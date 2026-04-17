// Shared constants and helpers for the TripReport feature (SIL-674).
// Keep server + client in sync on limits and validation.

export const TRIP_REPORT_BETA_MAX_LENGTH = 2000;
export const TRIP_REPORT_GRADE_MAX_LENGTH = 40;
export const TRIP_REPORT_PARTNERS_MAX_LENGTH = 120;
export const TRIP_REPORT_WEATHER_MAX_LENGTH = 120;
export const TRIP_REPORT_MAX_PHOTOS = 3;

// Reuse review-side rate limit: max 5 submissions per hour per user.
export const TRIP_REPORT_RATE_LIMIT_PER_HOUR = 5;
export const TRIP_REPORT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export const TRIP_REPORT_PAGE_SIZE = 20;

/** Minutes a trip could plausibly take; anything outside rejected. */
export const TRIP_REPORT_DURATION_MIN = 1;
export const TRIP_REPORT_DURATION_MAX = 60 * 24 * 7; // a week

export interface TripReportInput {
  dateClimbed: string; // ISO date
  durationMinutes?: number | null;
  gradeText?: string | null;
  partnersText?: string | null;
  beta?: string | null;
  weatherNote?: string | null;
  photoIds?: string[];
}

export interface TripReportValidationError {
  field: string;
  message: string;
}

/**
 * Validate + normalize a client-submitted trip report payload.
 * Returns either `{ value }` with cleaned-up fields or `{ error }` on first failure.
 */
export function validateTripReportInput(raw: unknown):
  | { value: {
      dateClimbed: Date;
      durationMinutes: number | null;
      gradeText: string | null;
      partnersText: string | null;
      beta: string | null;
      weatherNote: string | null;
      photoIds: string[];
    } }
  | { error: TripReportValidationError } {
  if (!raw || typeof raw !== "object") {
    return { error: { field: "body", message: "Neplatný formát." } };
  }
  const body = raw as Record<string, unknown>;

  // dateClimbed: required, ISO date string, not in the future (allow today).
  const dateStr = typeof body.dateClimbed === "string" ? body.dateClimbed : null;
  if (!dateStr) {
    return { error: { field: "dateClimbed", message: "Zadejte datum výstupu." } };
  }
  const dateClimbed = new Date(dateStr);
  if (Number.isNaN(dateClimbed.getTime())) {
    return { error: { field: "dateClimbed", message: "Neplatné datum." } };
  }
  const now = new Date();
  // Allow today (strip time by comparing day-level)
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (dateClimbed.getTime() > endOfToday.getTime()) {
    return { error: { field: "dateClimbed", message: "Datum nemůže být v budoucnosti." } };
  }
  // Sanity lower bound — nothing before 1950.
  if (dateClimbed.getFullYear() < 1950) {
    return { error: { field: "dateClimbed", message: "Datum je příliš staré." } };
  }

  let durationMinutes: number | null = null;
  if (body.durationMinutes !== undefined && body.durationMinutes !== null && body.durationMinutes !== "") {
    const n = typeof body.durationMinutes === "string"
      ? parseInt(body.durationMinutes, 10)
      : (body.durationMinutes as number);
    if (!Number.isFinite(n) || n < TRIP_REPORT_DURATION_MIN || n > TRIP_REPORT_DURATION_MAX) {
      return {
        error: {
          field: "durationMinutes",
          message: `Doba musí být ${TRIP_REPORT_DURATION_MIN}–${TRIP_REPORT_DURATION_MAX} minut.`,
        },
      };
    }
    durationMinutes = Math.round(n);
  }

  const str = (v: unknown, max: number, field: string):
    | { value: string | null }
    | { error: TripReportValidationError } => {
    if (v === undefined || v === null) return { value: null };
    if (typeof v !== "string") return { error: { field, message: "Neplatná hodnota." } };
    const trimmed = v.trim();
    if (!trimmed) return { value: null };
    if (trimmed.length > max) {
      return { error: { field, message: `Pole je příliš dlouhé (max ${max} znaků).` } };
    }
    return { value: trimmed };
  };

  const grade = str(body.gradeText, TRIP_REPORT_GRADE_MAX_LENGTH, "gradeText");
  if ("error" in grade) return grade;
  const partners = str(body.partnersText, TRIP_REPORT_PARTNERS_MAX_LENGTH, "partnersText");
  if ("error" in partners) return partners;
  const beta = str(body.beta, TRIP_REPORT_BETA_MAX_LENGTH, "beta");
  if ("error" in beta) return beta;
  const weather = str(body.weatherNote, TRIP_REPORT_WEATHER_MAX_LENGTH, "weatherNote");
  if ("error" in weather) return weather;

  let photoIds: string[] = [];
  if (Array.isArray(body.photoIds)) {
    photoIds = body.photoIds
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, TRIP_REPORT_MAX_PHOTOS);
  }

  return {
    value: {
      dateClimbed,
      durationMinutes,
      gradeText: grade.value,
      partnersText: partners.value,
      beta: beta.value,
      weatherNote: weather.value,
      photoIds,
    },
  };
}

/** Format a duration in minutes into a compact CS label ("2 h 15 min"). */
export function formatDurationCs(minutes: number | null | undefined): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
