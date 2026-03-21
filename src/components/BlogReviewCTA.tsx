import Link from "next/link";
import { Star, MessageSquare, Users } from "lucide-react";

interface BlogReviewCTAProps {
  sportTags?: string[];
}

const SPORT_LABELS: Record<string, string> = {
  tenis: "tenisové kurty",
  squash: "squashová centra",
  badminton: "badmintonové haly",
  plavani: "bazény a aquaparky",
  fitness: "fitness centra",
  lezeni: "lezecké stěny",
  volejbal: "volejbalová hřiště",
  padel: "padel kurty",
  golf: "golfová hřiště",
  ferraty: "via ferraty",
};

export function BlogReviewCTA({ sportTags = [] }: BlogReviewCTAProps) {
  const primarySport = sportTags[0];
  const sportLabel = primarySport ? SPORT_LABELS[primarySport] : null;

  const heading = sportLabel
    ? `Znáte ${sportLabel} ve svém okolí?`
    : "Znáte sportoviště ve svém okolí?";

  const sportLink = primarySport ? `/sport/${primarySport}` : "/";

  return (
    <section className="mt-10 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="hidden rounded-xl bg-emerald-100 p-3 sm:block">
          <Star className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-zinc-900">{heading}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Vaše zkušenost pomůže tisícům dalších sportovců vybrat si to
            správné místo. Stačí pár vět &mdash; ohodnoťte sportoviště, které
            znáte, a pomozte budovat komunitu hraju.cz.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={sportLink}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <MessageSquare className="h-4 w-4" />
              Napsat recenzi
            </Link>
            <Link
              href="/prihlaseni"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <Users className="h-4 w-4" />
              Přidat se do komunity
            </Link>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Zabere to jen minutku. Všechny recenze procházejí schválením.
          </p>
        </div>
      </div>
    </section>
  );
}
