import nodemailer from "nodemailer";
import { CONDITION_RATING_META, type ConditionRating } from "@/lib/conditions";

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_PORT || "587") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface ConditionsDigestFacility {
  facilityName: string;
  facilityUrl: string;
  rating: ConditionRating;
  commentExcerpt: string | null;
  reportedAt: Date;
  reportCount: number; // total fresh reports for this facility in window
}

export interface ConditionsDigestData {
  userName: string | null;
  facilities: ConditionsDigestFacility[];
  totalReports: number;
}

const MAX_FACILITIES_IN_EMAIL = 10;
const COMMENT_EXCERPT_LENGTH = 120;

export function excerptComment(comment: string | null): string | null {
  if (!comment) return null;
  const trimmed = comment.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length <= COMMENT_EXCERPT_LENGTH) return trimmed;
  return trimmed.slice(0, COMMENT_EXCERPT_LENGTH).trimEnd() + "…";
}

function timeAgoCs(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "před chvílí";
  if (diffHours < 24) return diffHours === 1 ? "před hodinou" : `před ${diffHours} h`;
  if (diffDays === 1) return "včera";
  if (diffDays < 7) return `před ${diffDays} dny`;
  return `před ${Math.floor(diffDays / 7)} týdny`;
}

function ratingBadgeHtml(rating: ConditionRating): string {
  const meta = CONDITION_RATING_META[rating] ?? CONDITION_RATING_META.good;
  const colors: Record<string, { bg: string; fg: string }> = {
    emerald: { bg: "#d1fae5", fg: "#065f46" },
    amber: { bg: "#fef3c7", fg: "#92400e" },
    orange: { bg: "#ffedd5", fg: "#9a3412" },
    rose: { bg: "#ffe4e6", fg: "#9f1239" },
  };
  const c = colors[meta.color] ?? colors.amber;
  return `<span style="display:inline-block;background:${c.bg};color:${c.fg};padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:600;">${meta.emoji} ${meta.labelCs}</span>`;
}

function ratingLabelText(rating: ConditionRating): string {
  const meta = CONDITION_RATING_META[rating] ?? CONDITION_RATING_META.good;
  return `${meta.emoji} ${meta.labelCs}`;
}

export function buildConditionsDigestSubject(totalReports: number): string {
  return `Aktuální podmínky na vašich oblíbených místech (${totalReports} ${pluralReports(totalReports)})`;
}

function pluralReports(n: number): string {
  if (n === 1) return "nový report";
  if (n >= 2 && n <= 4) return "nové reporty";
  return "nových reportů";
}

export function renderConditionsDigestHtml(
  data: ConditionsDigestData,
  unsubscribeUrl: string,
  now: Date = new Date()
): string {
  const greeting = data.userName ? `Ahoj ${data.userName}` : "Dobrý den";
  const visible = data.facilities.slice(0, MAX_FACILITIES_IN_EMAIL);

  const rowsHtml = visible
    .map((f) => {
      const more =
        f.reportCount > 1
          ? `<span style="color:#71717a;font-size:12px;margin-left:6px;">(+${f.reportCount - 1} dalších)</span>`
          : "";
      const excerpt = f.commentExcerpt
        ? `<p style="color:#3f3f46;margin:6px 0 8px;font-size:14px;line-height:1.4;">„${escapeHtml(f.commentExcerpt)}“</p>`
        : "";
      return `
      <tr><td style="padding:16px 0;border-bottom:1px solid #e4e4e7;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <a href="${f.facilityUrl}" style="color:#059669;font-weight:600;font-size:16px;text-decoration:none;">${escapeHtml(f.facilityName)}</a>
          ${ratingBadgeHtml(f.rating)}
        </div>
        ${excerpt}
        <div style="color:#71717a;font-size:12px;">${timeAgoCs(f.reportedAt, now)}${more}</div>
        <a href="${f.facilityUrl}#conditions" style="display:inline-block;margin-top:8px;background:#059669;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Zobrazit všechny reporty</a>
      </td></tr>`;
    })
    .join("");

  const overflowNotice =
    data.facilities.length > MAX_FACILITIES_IN_EMAIL
      ? `<p style="color:#71717a;font-size:13px;margin:16px 0 0;">A dalších ${data.facilities.length - MAX_FACILITIES_IN_EMAIL} oblíbených míst má nové reporty — <a href="https://www.hraju.cz/komunita" style="color:#059669;">prohlédněte si vše</a>.</p>`
      : "";

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 16px;">
      <h2 style="color: #18181b;">Aktuální podmínky</h2>
      <p>${greeting},</p>
      <p>na vašich oblíbených místech přibyly nové reporty o podmínkách. Tady je rychlý přehled:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-top:8px;">
        ${rowsHtml}
      </table>
      ${overflowNotice}
      <p style="margin: 24px 0;">
        <a href="https://www.hraju.cz/muj-ucet" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Můj účet a oblíbená místa
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
      <p style="color: #a1a1aa; font-size: 12px;">
        hraju.cz – sportoviště v Česku |
        <a href="${unsubscribeUrl}" style="color: #a1a1aa;">Odhlásit se z přehledu podmínek</a>
      </p>
    </div>
  `;
}

export function renderConditionsDigestText(
  data: ConditionsDigestData,
  unsubscribeUrl: string,
  now: Date = new Date()
): string {
  const greeting = data.userName ? `Ahoj ${data.userName}` : "Dobrý den";
  const lines: string[] = [
    `${greeting},`,
    ``,
    `na vašich oblíbených místech přibyly nové reporty o podmínkách:`,
    ``,
  ];
  for (const f of data.facilities.slice(0, MAX_FACILITIES_IN_EMAIL)) {
    lines.push(`- ${f.facilityName} — ${ratingLabelText(f.rating)} (${timeAgoCs(f.reportedAt, now)})`);
    if (f.commentExcerpt) lines.push(`  „${f.commentExcerpt}“`);
    lines.push(`  ${f.facilityUrl}#conditions`);
  }
  if (data.facilities.length > MAX_FACILITIES_IN_EMAIL) {
    lines.push(``);
    lines.push(
      `A dalších ${data.facilities.length - MAX_FACILITIES_IN_EMAIL} oblíbených míst má nové reporty.`,
    );
  }
  lines.push(``);
  lines.push(`Můj účet: https://www.hraju.cz/muj-ucet`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`Odhlásit se z přehledu podmínek: ${unsubscribeUrl}`);
  return lines.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendConditionsDigestEmail(
  to: string,
  data: ConditionsDigestData,
  unsubscribeUrl: string,
  now: Date = new Date()
): Promise<boolean> {
  if (data.facilities.length === 0) return false;
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping conditions digest email");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: buildConditionsDigestSubject(data.totalReports),
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: renderConditionsDigestText(data, unsubscribeUrl, now),
      html: renderConditionsDigestHtml(data, unsubscribeUrl, now),
    });
    return true;
  } catch (error) {
    console.error("Failed to send conditions digest email:", error);
    return false;
  }
}
