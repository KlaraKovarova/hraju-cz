import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ArrowRight, Shield } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Vybavení pro ferraty a lezení",
  description:
    "Katalog vybavení pro via ferraty a lezení od českých výrobců. Tlumiče pádu, sety, přilby, rukavice a příslušenství — OCÚN a další značky.",
  alternates: { canonical: "https://www.hraju.cz/vybaveni" },
};

const CATEGORY_LABELS: Record<string, string> = {
  // Ferraty
  set: "Ferratové sety",
  "tlumic-padu": "Tlumiče pádu",
  prilba: "Přilby",
  rukavice: "Rukavice",
  prislusenstvi: "Příslušenství",
  // Lezení
  lezecky: "Lezečky",
  uvazek: "Sedací úvazky",
  magnesium: "Magnézium",
  expresky: "Expresky",
  lano: "Lana",
  jistitko: "Jistítka",
  karabina: "Karabiny",
  crashpad: "Crashpady",
};

const CATEGORY_ORDER = [
  "set", "tlumic-padu", "prilba", "rukavice", "prislusenstvi",
  "lezecky", "uvazek", "magnesium", "expresky", "lano", "jistitko", "karabina", "crashpad",
];

async function getProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function VybaveniPage() {
  const products = await getProducts();

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    items: products.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  const brands = [...new Set(products.map((p) => p.brand))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl font-bold text-zinc-900">
            Vybavení pro ferraty a lezení
          </h1>
        </div>
        <p className="text-lg text-zinc-600 max-w-2xl">
          Katalog vybavení od českých i světových výrobců. Ferratové sety, lezečky,
          sedáky, magnézium a další — vše pro ferraty i lezení.
        </p>
        {brands.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
            <Shield className="h-4 w-4" />
            <span>
              Značky: {brands.join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Category sections */}
      {grouped.map((group) => (
        <section key={group.category} className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-zinc-900 border-b border-zinc-200 pb-2">
            {group.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((product) => (
              <Link
                key={product.id}
                href={`/vybaveni/${product.slug}`}
                className="group rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                {product.images[0] && (
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-zinc-50">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-4 transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                    {product.brand}
                  </p>
                  <h3 className="mt-1 font-semibold text-zinc-900 group-hover:text-emerald-700 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-3 flex items-center text-sm font-medium text-emerald-600">
                    Detail produktu
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {products.length === 0 && (
        <p className="text-zinc-500">Katalog produktů se připravuje.</p>
      )}

      {/* CTA */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <h2 className="text-lg font-bold text-zinc-900">
            Hledáte ferratu poblíž?
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Prohlédněte si naši mapu ferrat po celé ČR.
          </p>
          <Link
            href="/sport/ferraty"
            className="mt-3 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Zobrazit ferraty
          </Link>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <h2 className="text-lg font-bold text-zinc-900">
            Kde lézt v ČR?
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Najděte lezecké stěny a bouldrovky ve vašem okolí.
          </p>
          <Link
            href="/sport/lezeni"
            className="mt-3 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Zobrazit stěny
          </Link>
        </div>
      </div>
    </div>
  );
}
