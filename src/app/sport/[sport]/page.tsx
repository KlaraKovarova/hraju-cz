import { notFound } from "next/navigation";
import { getSportBySubdomain } from "@/lib/sports";
import type { Metadata } from "next";

interface SportPageProps {
  params: Promise<{ sport: string }>;
}

export async function generateMetadata({
  params,
}: SportPageProps): Promise<Metadata> {
  const { sport: sportSlug } = await params;
  const sport = getSportBySubdomain(sportSlug);
  if (!sport) return {};
  return {
    title: `${sport.nameCs} | hraju.cz`,
    description: sport.description,
  };
}

export default async function SportPage({ params }: SportPageProps) {
  const { sport: sportSlug } = await params;
  const sport = getSportBySubdomain(sportSlug);

  if (!sport) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="text-3xl">{sport.icon}</span>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              {sport.nameCs}.hraju.cz
            </h1>
            <p className="text-sm text-zinc-500">{sport.description}</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900">
          {sport.nameCs}ové kurty v České republice
        </h2>
        <p className="text-zinc-500">
          Připravujeme přehled sportovišť. Brzy zde najdeš všechna dostupná
          místa pro {sport.nameCs.toLowerCase()} poblíž tebe.
        </p>
      </section>
    </main>
  );
}
