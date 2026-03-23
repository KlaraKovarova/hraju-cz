"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, User, Clock, CheckCircle2, MessageSquare, ThumbsUp, Loader2, MapPinCheck, MapPin, PlusCircle, ArrowRight, Calendar } from "lucide-react";

interface UserData {
  userId: string;
  email: string;
  name: string | null;
}

interface UserReview {
  id: string;
  rating: number;
  title: string | null;
  text: string | null;
  helpful: number;
  isApproved: boolean;
  createdAt: string;
  facility: {
    name: string;
    slug: string;
    sports: { sport: { slug: string; nameCs: string } }[];
  };
}

interface UserVisit {
  id: string;
  note: string | null;
  createdAt: string;
  facility: {
    name: string;
    slug: string;
    location: { city: string };
    sports: { sport: { slug: string; nameCs: string } }[];
  };
}

interface UserEvent {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string | null;
  city: string;
  isActive: boolean;
  createdAt: string;
}

type Tab = "reviews" | "visits" | "events";

export default function MujUcetPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [visits, setVisits] = useState<UserVisit[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("reviews");

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/prihlaseni?redirect=/muj-ucet");
          return;
        }
        const userData = await meRes.json();
        setUser(userData);

        const [revRes, visitRes, eventRes] = await Promise.all([
          fetch("/api/auth/my-reviews"),
          fetch("/api/auth/my-visits"),
          fetch("/api/auth/my-events"),
        ]);

        if (revRes.ok) setReviews(await revRes.json());
        if (visitRes.ok) setVisits(await visitRes.json());
        if (eventRes.ok) setEvents(await eventRes.json());
      } catch {
        router.push("/prihlaseni?redirect=/muj-ucet");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return null;

  const isNewUser = reviews.length === 0 && visits.length === 0 && events.length === 0;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              {user.name || "Sportovec"}
            </h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <Link
              href={`/uzivatel/${user.userId}`}
              className="mt-1 inline-block text-xs text-emerald-600 hover:underline"
            >
              Zobrazit veřejný profil →
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pridat-sportoviste"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Přidat sportoviště
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition-colors"
          >
            Odhlásit
          </button>
        </div>
      </div>

      {/* Onboarding for new users */}
      {isNewUser && (
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Jak začít na hraju.cz
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Vyzkoušej jednu z těchto akcí a staň se součástí naší komunity sportovců.
          </p>
          <div className="mt-4 space-y-2">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">Napsat první recenzi</span>
                <p className="text-xs text-zinc-500">Najdi sportoviště a poděl se o svůj zážitek</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500" />
            </Link>
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-xl bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <MapPinCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">Označit navštívené sportoviště</span>
                <p className="text-xs text-zinc-500">Klikni &quot;Byl/a jsem tady&quot; na stránce sportoviště</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500" />
            </Link>
            <Link
              href="/pridat-sportoviste"
              className="group flex items-center gap-3 rounded-xl bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">Přidat chybějící sportoviště</span>
                <p className="text-xs text-zinc-500">Znáš sportoviště, které u nás chybí?</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500" />
            </Link>
            <Link
              href="/pridat-akci"
              className="group flex items-center gap-3 rounded-xl bg-white p-4 transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">Přidat akci</span>
                <p className="text-xs text-zinc-500">Pořádáš turistickou akci? Přidej ji do kalendáře</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      {!isNewUser && (
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900">{reviews.length}</div>
          <div className="text-xs text-zinc-500">Recenzí</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{approvedCount}</div>
          <div className="text-xs text-emerald-600">Schválených</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
          <div className="text-xs text-amber-600">Čeká</div>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-center">
          <div className="text-2xl font-bold text-sky-700">{visits.length}</div>
          <div className="text-xs text-sky-600">Návštěv</div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center">
          <div className="text-2xl font-bold text-orange-700">{events.length}</div>
          <div className="text-xs text-orange-600">Akcí</div>
        </div>
      </div>
      )}

      {/* Tabs */}
      {!isNewUser && <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1">
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            activeTab === "reviews"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Recenze ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab("visits")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            activeTab === "visits"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <MapPinCheck className="h-4 w-4" />
          Návštěvy ({visits.length})
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            activeTab === "events"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Akce ({events.length})
        </button>
      </div>}

      {/* Reviews tab */}
      {!isNewUser && activeTab === "reviews" && (
        <>
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-600">
                Zatím jste nenapsal/a žádnou recenzi.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Navštivte sportoviště a podělte se o svůj zážitek.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Procházet sportoviště
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => {
                const sport = review.facility.sports[0]?.sport;
                const facilityUrl = sport
                  ? `/sport/${sport.slug}/${review.facility.slug}`
                  : `/${review.facility.slug}`;

                return (
                  <div
                    key={review.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={facilityUrl}
                          className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 transition-colors"
                        >
                          {review.facility.name}
                        </Link>
                        {sport && (
                          <span className="ml-2 text-xs text-zinc-400">
                            {sport.nameCs}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {review.isApproved ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Schváleno
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Clock className="h-3 w-3" />
                            Čeká
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-200"
                          }`}
                        />
                      ))}
                    </div>

                    {review.title && (
                      <p className="mt-2 text-sm font-medium text-zinc-800">
                        {review.title}
                      </p>
                    )}
                    {review.text && (
                      <p className="mt-1 text-sm text-zinc-600 line-clamp-3">
                        {review.text}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
                      <span>
                        {new Date(review.createdAt).toLocaleDateString("cs-CZ")}
                      </span>
                      {review.helpful > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {review.helpful} užitečné
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Visits tab */}
      {!isNewUser && activeTab === "visits" && (
        <>
          {visits.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <MapPinCheck className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-600">
                Zatím jste neoznačil/a žádné sportoviště.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Označte sportoviště, která jste navštívil/a, tlačítkem &quot;Byl/a jsem tady&quot;.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Procházet sportoviště
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => {
                const sport = visit.facility.sports[0]?.sport;
                const facilityUrl = sport
                  ? `/sport/${sport.slug}/${visit.facility.slug}`
                  : `/${visit.facility.slug}`;

                return (
                  <div
                    key={visit.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={facilityUrl}
                          className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 transition-colors"
                        >
                          {visit.facility.name}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                          <MapPin className="h-3 w-3" />
                          {visit.facility.location.city}
                          {sport && ` · ${sport.nameCs}`}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <MapPinCheck className="h-3 w-3" />
                        Navštíveno
                      </span>
                    </div>

                    {visit.note && (
                      <p className="mt-2 text-sm text-zinc-600">{visit.note}</p>
                    )}

                    <div className="mt-3 text-xs text-zinc-400">
                      {new Date(visit.createdAt).toLocaleDateString("cs-CZ")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Events tab */}
      {!isNewUser && activeTab === "events" && (
        <>
          {events.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-600">
                Zatím jste nepřidal/a žádnou akci.
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Pořádáte turistickou akci? Přidejte ji do našeho kalendáře.
              </p>
              <Link
                href="/pridat-akci"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Přidat akci
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        {event.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                        <MapPin className="h-3 w-3" />
                        {event.city}
                        {" · "}
                        {new Date(event.dateStart).toLocaleDateString("cs-CZ")}
                        {event.dateEnd && ` – ${new Date(event.dateEnd).toLocaleDateString("cs-CZ")}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {event.isActive ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Schváleno
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Clock className="h-3 w-3" />
                          Čeká na schválení
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-zinc-400">
                    Přidáno {new Date(event.createdAt).toLocaleDateString("cs-CZ")}
                  </div>
                </div>
              ))}

              <Link
                href="/pridat-akci"
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 transition hover:border-emerald-400 hover:text-emerald-600"
              >
                <PlusCircle className="h-4 w-4" />
                Přidat další akci
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
