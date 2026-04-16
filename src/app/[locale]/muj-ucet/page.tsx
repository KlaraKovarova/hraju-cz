"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  User,
  Clock,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  Loader2,
  MapPinCheck,
  MapPin,
  PlusCircle,
  ArrowRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Trophy,
  Lock,
  Compass,
  Heart,
  Bell,
  Award,
  BarChart3,
} from "lucide-react";
import { BADGE_META } from "@/lib/badge-meta";
import { SPORTS } from "@/lib/sports";

// ─── Types ────────────────────────────────────────────────────────────────

interface UserData {
  userId: string;
  email: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  favoriteSports: string[];
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

interface UserFavorite {
  id: string;
  createdAt: string;
  facility: {
    name: string;
    slug: string;
    address: string;
    averageRating: number | null;
    reviewCount: number;
    location: { city: string };
    sports: { sport: { slug: string; nameCs: string; icon: string | null } }[];
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

interface ActivityItem {
  type: "review" | "visit" | "event" | "badge";
  id: string;
  date: string;
  data: Record<string, unknown>;
}

interface BadgeProgress {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  earned: boolean;
  progress: number;
  target: number;
}

interface DashboardData {
  trends: {
    reviewsThisMonth: number;
    reviewsLastMonth: number;
    visitsThisMonth: number;
    visitsLastMonth: number;
  };
  totalHelpfulVotes: number;
  recommendations: {
    id: string;
    name: string;
    slug: string;
    city: string;
    sportSlug: string | null;
    sportName: string | null;
    averageRating: number | null;
    reviewCount: number;
  }[];
}

interface NotificationItem {
  id: string;
  source: "favorite" | "generic";
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  icon: string | null;
  isRead: boolean;
  createdAt: string;
}

interface UserStats {
  totalReviews: number;
  totalApproved: number;
  totalHelpfulVotes: number;
  totalCheckIns: number;
  reviewsBySport: {
    slug: string;
    nameCs: string;
    total: number;
    approved: number;
  }[];
  expertiseProgress: {
    sportSlug: string;
    sportNameCs: string;
    approvedCount: number;
    currentLevel: string | null;
    nextLevel: string | null;
    nextThreshold: number | null;
    remaining: number | null;
  }[];
  localGuide?: {
    currentTier: "bronze" | "silver" | "gold" | null;
    currentTierLabel: string | null;
    nextTier: "bronze" | "silver" | "gold" | null;
    nextTierLabel: string | null;
    nextTierHint: string | null;
    stats: {
      reportsLast90Days: number;
      reportsTotal: number;
      helpfulTotal: number;
      distinctFacilities: number;
    };
  };
}

type Tab = "overview" | "reviews" | "visits" | "favorites" | "events";

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ");
}

function facilityUrl(slug: string, sportSlug: string | null) {
  return sportSlug ? `/sport/${sportSlug}/${slug}` : `/${slug}`;
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (current > previous)
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (current < previous)
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-zinc-400" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function MujUcetPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [visits, setVisits] = useState<UserVisit[]>([]);
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [badges, setBadges] = useState<BadgeProgress[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [prefs, setPrefs] = useState({ emailNotifications: true, weeklyDigest: true });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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

        const [revRes, visitRes, eventRes, actRes, badgeRes, dashRes, favRes, notifRes, prefRes, statsRes] =
          await Promise.all([
            fetch("/api/auth/my-reviews"),
            fetch("/api/auth/my-visits"),
            fetch("/api/auth/my-events"),
            fetch("/api/auth/my-activity"),
            fetch("/api/auth/my-badges/progress"),
            fetch("/api/auth/my-dashboard"),
            fetch("/api/auth/my-favorites"),
            fetch("/api/auth/my-notifications"),
            fetch("/api/auth/my-preferences"),
            fetch("/api/user/stats"),
          ]);

        if (revRes.ok) setReviews(await revRes.json());
        if (visitRes.ok) setVisits(await visitRes.json());
        if (eventRes.ok) setEvents(await eventRes.json());
        if (actRes.ok) setActivity(await actRes.json());
        if (badgeRes.ok) {
          const data = await badgeRes.json();
          setBadges(data.progress);
        }
        if (dashRes.ok) setDashboard(await dashRes.json());
        if (favRes.ok) setFavorites(await favRes.json());
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications);
          setUnreadCount(notifData.unreadCount);
        }
        if (prefRes.ok) setPrefs(await prefRes.json());
        if (statsRes.ok) setUserStats(await statsRes.json());
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

  const isNewUser =
    reviews.length === 0 && visits.length === 0 && events.length === 0;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const pendingCount = reviews.filter((r) => !r.isApproved).length;
  const totalHelpful = reviews.reduce((sum, r) => sum + r.helpful, 0);

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
            Vyzkoušej jednu z těchto akcí a staň se součástí naší komunity
            sportovců.
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
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                  Napsat první recenzi
                </span>
                <p className="text-xs text-zinc-500">
                  Najdi sportoviště a poděl se o svůj zážitek
                </p>
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
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                  Označit navštívené sportoviště
                </span>
                <p className="text-xs text-zinc-500">
                  Klikni &quot;Byl/a jsem tady&quot; na stránce sportoviště
                </p>
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
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                  Přidat chybějící sportoviště
                </span>
                <p className="text-xs text-zinc-500">
                  Znáš sportoviště, které u nás chybí?
                </p>
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
                <span className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                  Přidat akci
                </span>
                <p className="text-xs text-zinc-500">
                  Pořádáš turistickou akci? Přidej ji do kalendáře
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-emerald-500" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats row with trends */}
      {!isNewUser && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-zinc-900">
              {reviews.length}
            </div>
            <div className="text-xs text-zinc-500">Recenzí</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">
              {approvedCount}
            </div>
            <div className="text-xs text-emerald-600">Schválených</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">
              {pendingCount}
            </div>
            <div className="text-xs text-amber-600">Čeká</div>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-center">
            <div className="text-2xl font-bold text-sky-700">
              {visits.length}
            </div>
            <div className="text-xs text-sky-600">Návštěv</div>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {totalHelpful}
            </div>
            <div className="text-xs text-purple-600">
              <ThumbsUp className="mr-0.5 inline h-3 w-3" />
              Užitečné
            </div>
          </div>
        </div>
      )}

      {/* Monthly trends */}
      {!isNewUser && dashboard && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-4">
            <TrendIndicator
              current={dashboard.trends.reviewsThisMonth}
              previous={dashboard.trends.reviewsLastMonth}
            />
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                {dashboard.trends.reviewsThisMonth} recenzí tento měsíc
              </div>
              <div className="text-xs text-zinc-400">
                {dashboard.trends.reviewsLastMonth} minulý měsíc
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-4">
            <TrendIndicator
              current={dashboard.trends.visitsThisMonth}
              previous={dashboard.trends.visitsLastMonth}
            />
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                {dashboard.trends.visitsThisMonth} návštěv tento měsíc
              </div>
              <div className="text-xs text-zinc-400">
                {dashboard.trends.visitsLastMonth} minulý měsíc
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social proof: helpful votes notification */}
      {!isNewUser && dashboard && dashboard.totalHelpfulVotes > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <ThumbsUp className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900">
              Lidé označili vaše recenze jako užitečné{" "}
              {dashboard.totalHelpfulVotes}x
            </div>
            <div className="text-xs text-zinc-500">
              Díky za hodnotné příspěvky do komunity!
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!isNewUser && (
        <div className="mb-6 flex gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === "overview"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Activity className="h-4 w-4" />
            Přehled
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === "reviews"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Recenze
          </button>
          <button
            onClick={() => setActiveTab("visits")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === "visits"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <MapPinCheck className="h-4 w-4" />
            Návštěvy
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === "favorites"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Heart className="h-4 w-4" />
            Oblíbené
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === "events"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Akce
          </button>
        </div>
      )}

      {/* Overview tab */}
      {!isNewUser && activeTab === "overview" && (
        <div className="space-y-6">
          {/* Notifications (all types) */}
          {unreadCount > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bell className="h-4.5 w-4.5 text-rose-600" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Oznámení
                  </h3>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/my-notifications", { method: "POST" });
                    setUnreadCount(0);
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, isRead: true }))
                    );
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Označit jako přečtené
                </button>
              </div>
              <div className="space-y-2">
                {notifications
                  .filter((n) => !n.isRead)
                  .slice(0, 8)
                  .map((n) => (
                    <Link
                      key={n.id}
                      href={n.linkUrl || "/muj-ucet"}
                      className="flex items-start gap-2.5 rounded-lg bg-white p-3 transition hover:shadow-sm"
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        n.type === "badge_earned" || n.type === "challenge_completed"
                          ? "bg-amber-100"
                          : n.type === "review_reply"
                            ? "bg-blue-100"
                            : "bg-rose-100"
                      }`}>
                        {n.icon ? (
                          <span className="text-xs">{n.icon}</span>
                        ) : n.type === "review" ? (
                          <Star className="h-3 w-3 text-amber-500" />
                        ) : (
                          <MapPinCheck className="h-3 w-3 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-700">
                          {n.title}
                          {n.body && (
                            <span className="text-zinc-400"> — {n.body}</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Impact stats */}
          {userStats && !isNewUser && (
            <div className="rounded-xl border border-zinc-100 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Váš dopad
                </h3>
              </div>

              {/* Motivational text */}
              {userStats.totalHelpfulVotes > 0 && (
                <div className="mb-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-3">
                  <p className="text-sm font-medium text-emerald-800">
                    Vaše recenze pomohly {userStats.totalHelpfulVotes}{" "}
                    {userStats.totalHelpfulVotes === 1
                      ? "člověku"
                      : userStats.totalHelpfulVotes >= 2 && userStats.totalHelpfulVotes <= 4
                        ? "lidem"
                        : "lidem"}{" "}
                    s výběrem sportoviště
                  </p>
                </div>
              )}

              {/* Reviews by sport */}
              {userStats.reviewsBySport.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Recenze podle sportu
                  </div>
                  <div className="space-y-2">
                    {userStats.reviewsBySport.map((sport) => (
                      <div key={sport.slug} className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-700">
                              {sport.nameCs}
                            </span>
                            <span className="text-zinc-500">
                              {sport.total}{" "}
                              {sport.total === 1
                                ? "recenze"
                                : sport.total >= 2 && sport.total <= 4
                                  ? "recenze"
                                  : "recenzí"}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500 transition-all"
                              style={{
                                width: `${Math.min(100, (sport.total / Math.max(...userStats.reviewsBySport.map((s) => s.total))) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expertise progress */}
              {userStats.expertiseProgress.length > 0 && (
                <div>
                  <div className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Cesta k expertíze
                  </div>
                  <div className="space-y-2">
                    {userStats.expertiseProgress.map((ep) => (
                      <div
                        key={ep.sportSlug}
                        className="rounded-lg border border-zinc-100 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium text-zinc-700">
                            {ep.sportNameCs}
                          </span>
                          {ep.currentLevel && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              {ep.currentLevel}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              {ep.approvedCount}/{ep.nextThreshold} schválených recenzí
                            </span>
                            <span className="font-medium text-amber-600">
                              Ještě {ep.remaining}{" "}
                              {ep.remaining === 1
                                ? "recenze"
                                : ep.remaining! >= 2 && ep.remaining! <= 4
                                  ? "recenze"
                                  : "recenzí"}{" "}
                              do titulu {ep.nextLevel}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-200">
                            <div
                              className="h-1.5 rounded-full bg-amber-400 transition-all"
                              style={{
                                width: `${(ep.approvedCount / (ep.nextThreshold ?? 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Místní průvodce — local guide tier */}
              {userStats.localGuide && (userStats.localGuide.stats.reportsTotal > 0 || userStats.localGuide.currentTier) && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Místní průvodce
                  </div>
                  <div className="rounded-lg border border-zinc-100 p-3">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-base">🗺️</span>
                      <span className="text-sm font-medium text-zinc-700">
                        {userStats.localGuide.currentTierLabel ?? "Zatím bez úrovně"}
                      </span>
                      {userStats.localGuide.currentTier && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {userStats.localGuide.currentTier === "bronze" && "Bronz"}
                          {userStats.localGuide.currentTier === "silver" && "Stříbro"}
                          {userStats.localGuide.currentTier === "gold" && "Zlato"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {userStats.localGuide.stats.reportsTotal}{" "}
                      {userStats.localGuide.stats.reportsTotal === 1
                        ? "report"
                        : userStats.localGuide.stats.reportsTotal >= 2 && userStats.localGuide.stats.reportsTotal <= 4
                          ? "reporty"
                          : "reportů"}{" "}
                      • {userStats.localGuide.stats.helpfulTotal} hlasů „užitečné“ • {userStats.localGuide.stats.distinctFacilities}{" "}
                      {userStats.localGuide.stats.distinctFacilities === 1 ? "sportoviště" : "sportovišť"}
                    </p>
                    {userStats.localGuide.nextTierHint && (
                      <p className="mt-2 text-xs font-medium text-amber-600">
                        {userStats.localGuide.nextTierHint}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Summary for users with no reviews yet in any sport */}
              {userStats.reviewsBySport.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Napište svou první recenzi a začněte budovat svůj odborný profil.
                </p>
              )}
            </div>
          )}

          {/* Challenge progress */}
          {badges.length > 0 && (
            <div className="rounded-xl border border-zinc-100 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Aktivní výzvy
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {badges.map((badge) => (
                  <div
                    key={badge.slug}
                    className={`rounded-lg border p-3 ${
                      badge.earned
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-zinc-100 bg-zinc-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl leading-none">
                        {badge.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-zinc-900">
                            {badge.name}
                          </span>
                          {badge.earned ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Lock className="h-3 w-3 text-zinc-300" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {badge.description}
                        </p>
                        {!badge.earned && (
                          <div className="mt-2">
                            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                              <span>
                                {badge.progress}/{badge.target}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-200">
                              <div
                                className="h-1.5 rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${(badge.progress / badge.target) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity feed */}
          {activity.length > 0 && (
            <div className="rounded-xl border border-zinc-100 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Poslední aktivita
                </h3>
              </div>
              <div className="space-y-3">
                {activity.slice(0, 10).map((item) => (
                  <ActivityRow key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Recommended facilities */}
          {dashboard && dashboard.recommendations.length > 0 && (
            <div className="rounded-xl border border-zinc-100 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Compass className="h-4.5 w-4.5 text-sky-600" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Doporučená sportoviště
                </h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {dashboard.recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    href={facilityUrl(rec.slug, rec.sportSlug)}
                    className="group rounded-lg border border-zinc-100 p-3 transition hover:border-emerald-200 hover:shadow-sm"
                  >
                    <div className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">
                      {rec.name}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {rec.city}
                      </span>
                      {rec.sportName && <span>{rec.sportName}</span>}
                      {rec.averageRating && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {rec.averageRating.toFixed(1)}
                        </span>
                      )}
                      {rec.reviewCount > 0 && (
                        <span>
                          {rec.reviewCount}{" "}
                          {rec.reviewCount === 1 ? "recenze" : "recenzí"}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Profile edit */}
          <ProfileEditSection user={user} onUpdate={setUser} />

          {/* Notification preferences */}
          <div className="rounded-xl border border-zinc-100 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-zinc-500" />
              <h3 className="text-sm font-bold text-zinc-900">
                Nastavení notifikací
              </h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-zinc-700">
                    E-mailové notifikace
                  </div>
                  <div className="text-xs text-zinc-400">
                    Nové recenze a aktivita u oblíbených sportovišť
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={prefs.emailNotifications}
                  onClick={async () => {
                    const val = !prefs.emailNotifications;
                    setPrefs((p) => ({ ...p, emailNotifications: val }));
                    await fetch("/api/auth/my-preferences", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ emailNotifications: val }),
                    });
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    prefs.emailNotifications ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      prefs.emailNotifications ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-zinc-700">
                    Týdenní přehled
                  </div>
                  <div className="text-xs text-zinc-400">
                    Souhrn novinek, recenzí a akcí jednou týdně
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={prefs.weeklyDigest}
                  onClick={async () => {
                    const val = !prefs.weeklyDigest;
                    setPrefs((p) => ({ ...p, weeklyDigest: val }));
                    await fetch("/api/auth/my-preferences", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ weeklyDigest: val }),
                    });
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    prefs.weeklyDigest ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      prefs.weeklyDigest ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reviews tab */}
      {!isNewUser && activeTab === "reviews" && (
        <>
          {reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="mx-auto mb-3 h-10 w-10 text-zinc-300" />}
              title="Zatím jste nenapsal/a žádnou recenzi."
              subtitle="Navštivte sportoviště a podělte se o svůj zážitek."
              href="/"
              cta="Procházet sportoviště"
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => {
                const sport = review.facility.sports[0]?.sport;
                const url = facilityUrl(review.facility.slug, sport?.slug ?? null);

                return (
                  <div
                    key={review.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={url}
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
                      <span>{formatDate(review.createdAt)}</span>
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
            <EmptyState
              icon={<MapPinCheck className="mx-auto mb-3 h-10 w-10 text-zinc-300" />}
              title="Zatím jste neoznačil/a žádné sportoviště."
              subtitle='Označte sportoviště, která jste navštívil/a, tlačítkem "Byl/a jsem tady".'
              href="/"
              cta="Procházet sportoviště"
            />
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => {
                const sport = visit.facility.sports[0]?.sport;
                const url = facilityUrl(visit.facility.slug, sport?.slug ?? null);

                return (
                  <div
                    key={visit.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={url}
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
                      <p className="mt-2 text-sm text-zinc-600">
                        {visit.note}
                      </p>
                    )}

                    <div className="mt-3 text-xs text-zinc-400">
                      {formatDate(visit.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Favorites tab */}
      {!isNewUser && activeTab === "favorites" && (
        <>
          {favorites.length === 0 ? (
            <EmptyState
              icon={<Heart className="mx-auto mb-3 h-10 w-10 text-zinc-300" />}
              title="Zatím nemáte žádná oblíbená sportoviště."
              subtitle="Klikněte na srdíčko u sportoviště a uložte si ho sem."
              href="/sport/squash"
              cta="Prozkoumat sportoviště"
            />
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => {
                const sport = fav.facility.sports[0]?.sport;
                const url = facilityUrl(fav.facility.slug, sport?.slug ?? null);

                return (
                  <div
                    key={fav.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={url}
                          className="text-sm font-semibold text-zinc-900 hover:text-emerald-600 transition-colors"
                        >
                          {fav.facility.name}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                          <MapPin className="h-3 w-3" />
                          {fav.facility.location.city}
                          {sport && ` · ${sport.nameCs}`}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                        <Heart className="h-3 w-3 fill-rose-500" />
                        Oblíbené
                      </span>
                    </div>

                    {fav.facility.averageRating && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {fav.facility.averageRating.toFixed(1)}
                        <span className="text-zinc-400">
                          ({fav.facility.reviewCount} {fav.facility.reviewCount === 1 ? "recenze" : fav.facility.reviewCount >= 2 && fav.facility.reviewCount <= 4 ? "recenze" : "recenzí"})
                        </span>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-zinc-400">
                      Přidáno {formatDate(fav.createdAt)}
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
            <EmptyState
              icon={<Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-300" />}
              title="Zatím jste nepřidal/a žádnou akci."
              subtitle="Pořádáte turistickou akci? Přidejte ji do našeho kalendáře."
              href="/pridat-akci"
              cta="Přidat akci"
            />
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
                        {formatDate(event.dateStart)}
                        {event.dateEnd &&
                          ` – ${formatDate(event.dateEnd)}`}
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
                    Přidáno {formatDate(event.createdAt)}
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

// ─── Activity Row ─────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: ActivityItem }) {
  const d = item.data;

  if (item.type === "review") {
    const sport = d.sportSlug as string | null;
    const url = facilityUrl(d.facilitySlug as string, sport);
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50">
          <Star className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-700">
            Recenze na{" "}
            <Link href={url} className="font-medium text-emerald-600 hover:underline">
              {d.facilityName as string}
            </Link>
            {(d.helpful as number) > 0 && (
              <span className="ml-1 text-xs text-zinc-400">
                · {d.helpful as number}x užitečné
              </span>
            )}
          </p>
          <p className="text-xs text-zinc-400">{formatDate(item.date)}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${
                s <= (d.rating as number)
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "visit") {
    const sport = d.sportSlug as string | null;
    const url = facilityUrl(d.facilitySlug as string, sport);
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
          <MapPinCheck className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-700">
            Check-in:{" "}
            <Link href={url} className="font-medium text-emerald-600 hover:underline">
              {d.facilityName as string}
            </Link>
            <span className="ml-1 text-xs text-zinc-400">
              · {d.city as string}
            </span>
          </p>
          <p className="text-xs text-zinc-400">{formatDate(item.date)}</p>
        </div>
      </div>
    );
  }

  if (item.type === "event") {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50">
          <Calendar className="h-3.5 w-3.5 text-orange-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-700">
            Přidaná akce: <span className="font-medium">{d.name as string}</span>
            <span className="ml-1 text-xs text-zinc-400">
              · {d.city as string}
            </span>
          </p>
          <p className="text-xs text-zinc-400">{formatDate(item.date)}</p>
        </div>
      </div>
    );
  }

  if (item.type === "badge") {
    const slug = d.badgeSlug as string;
    const def = BADGE_META[slug];
    if (!def) return null;
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-50">
          <Trophy className="h-3.5 w-3.5 text-purple-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-700">
            Získán odznak:{" "}
            <span className="font-medium">
              {def.emoji} {def.name}
            </span>
          </p>
          <p className="text-xs text-zinc-400">{formatDate(item.date)}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Empty State ──────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  subtitle,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
      {icon}
      <p className="text-sm font-medium text-zinc-600">{title}</p>
      <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
      <Link
        href={href}
        className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}

// ─── Profile Edit Section ─────────────────────────────────────────────────

function ProfileEditSection({
  user,
  onUpdate,
}: {
  user: UserData;
  onUpdate: (u: UserData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [location, setLocation] = useState(user.location || "");
  const [favSports, setFavSports] = useState<Set<string>>(
    new Set(user.favoriteSports)
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          location: location.trim(),
          favoriteSports: Array.from(favSports),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate({
          ...user,
          name: data.name,
          bio: data.bio,
          location: data.location,
          favoriteSports: data.favoriteSports,
        });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleSport(slug: string) {
    setFavSports((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-zinc-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-zinc-500" />
            <h3 className="text-sm font-bold text-zinc-900">Profil</h3>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-emerald-600 hover:underline"
          >
            Upravit
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {user.bio && (
            <p className="text-zinc-600">{user.bio}</p>
          )}
          {user.location && (
            <p className="flex items-center gap-1.5 text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              {user.location}
            </p>
          )}
          {user.favoriteSports.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {user.favoriteSports.map((slug) => {
                const sport = SPORTS.find((s) => s.slug === slug);
                if (!sport) return null;
                return (
                  <span
                    key={slug}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600"
                  >
                    {sport.icon} {sport.nameCs}
                  </span>
                );
              })}
            </div>
          )}
          {!user.bio && !user.location && user.favoriteSports.length === 0 && (
            <p className="text-xs text-zinc-400">
              Doplňte si bio, lokaci a oblíbené sporty.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <User className="h-4.5 w-4.5 text-emerald-600" />
        <h3 className="text-sm font-bold text-zinc-900">Upravit profil</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Jméno
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-300"
            placeholder="Vaše jméno"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-300 resize-none"
            placeholder="Něco o vás..."
          />
          <p className="mt-0.5 text-right text-xs text-zinc-400">
            {bio.length}/200
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Město / region
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-300"
            placeholder="např. Praha, Brno..."
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Oblíbené sporty
          </label>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport.slug}
                type="button"
                onClick={() => toggleSport(sport.slug)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  favSports.has(sport.slug)
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200"
                }`}
              >
                {sport.icon} {sport.nameCs}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Ukládám..." : "Uložit"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setName(user.name || "");
              setBio(user.bio || "");
              setLocation(user.location || "");
              setFavSports(new Set(user.favoriteSports));
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
}
