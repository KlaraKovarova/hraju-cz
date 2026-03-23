"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, User, Clock, CheckCircle2, MessageSquare, ThumbsUp, Loader2 } from "lucide-react";

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

export default function MujUcetPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);

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

        const revRes = await fetch("/api/auth/my-reviews");
        if (revRes.ok) {
          setReviews(await revRes.json());
        }
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
        <button
          onClick={handleLogout}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 transition-colors"
        >
          Odhlásit
        </button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900">{reviews.length}</div>
          <div className="text-xs text-zinc-500">Recenzí celkem</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">{approvedCount}</div>
          <div className="text-xs text-emerald-600">Schválených</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
          <div className="text-xs text-amber-600">Čeká na schválení</div>
        </div>
      </div>

      {/* Reviews */}
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
        <MessageSquare className="h-5 w-5 text-zinc-400" />
        Moje recenze
      </h2>

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
    </div>
  );
}
