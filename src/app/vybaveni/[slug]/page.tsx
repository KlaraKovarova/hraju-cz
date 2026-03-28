import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Shield, Weight, Ruler } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    return await prisma.product.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const title = `${product.name} — ${product.brand}`;
  const description = product.description.slice(0, 160);
  const url = `https://www.hraju.cz/vybaveni/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "hraju.cz",
      locale: "cs_CZ",
      images: product.images[0]
        ? [{ url: product.images[0], width: 700, height: 700, alt: product.name }]
        : undefined,
    },
    alternates: { canonical: url },
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  set: "Ferratový set",
  "tlumic-padu": "Tlumič pádu",
  prilba: "Přilba",
  rukavice: "Rukavice",
  prislusenstvi: "Příslušenství",
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const specs: Record<string, any> = (product.specs as Record<string, any>) || {};

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/vybaveni" className="hover:text-zinc-700">
          Vybavení
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Images */}
        <div>
          {product.images[0] && (
            <div className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain p-6"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized
              />
            </div>
          )}
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-white"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 2}`}
                    fill
                    className="object-contain p-2"
                    sizes="120px"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">
            {product.brand}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900 lg:text-3xl">
            {product.name}
          </h1>
          <span className="mt-2 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {CATEGORY_LABELS[product.category] || product.category}
          </span>

          <p className="mt-4 text-zinc-700 leading-relaxed">
            {product.description}
          </p>

          {/* Specs */}
          <div className="mt-6 space-y-3">
            {specs.weight && (
              <div className="flex items-center gap-2 text-sm">
                <Weight className="h-4 w-4 text-zinc-400" />
                <span className="font-medium text-zinc-700">Hmotnost:</span>
                <span className="text-zinc-600">{String(specs.weight)}</span>
              </div>
            )}
            {specs.sizes && (
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-zinc-400" />
                <span className="font-medium text-zinc-700">Velikosti:</span>
                <span className="text-zinc-600">{String(specs.sizes)}</span>
              </div>
            )}
            {specs.sizeRange && (
              <div className="flex items-center gap-2 text-sm">
                <Ruler className="h-4 w-4 text-zinc-400" />
                <span className="font-medium text-zinc-700">Velikost:</span>
                <span className="text-zinc-600">{String(specs.sizeRange)}</span>
              </div>
            )}
            {Array.isArray(specs.certifications) && specs.certifications.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Shield className="mt-0.5 h-4 w-4 text-zinc-400" />
                <div>
                  <span className="font-medium text-zinc-700">Certifikace:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(specs.certifications as string[]).map((cert) => (
                      <span
                        key={cert}
                        className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {Array.isArray(specs.includes) && specs.includes.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-zinc-700">Obsah balení:</span>
                <ul className="mt-1 list-disc pl-5 text-zinc-600 space-y-0.5">
                  {(specs.includes as string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(specs.colors) && specs.colors.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-zinc-700">Barvy:</span>
                <span className="ml-1 text-zinc-600">
                  {(specs.colors as string[]).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Technical specs table for dampers */}
          {(specs.longitudinalStrength || specs.elasticArmExtension) && (
            <div className="mt-6 rounded-lg border border-zinc-200 overflow-hidden">
              <h3 className="bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700">
                Technické parametry
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Podélná pevnost", specs.longitudinalStrength],
                    ["Příčná pevnost", specs.transverseStrength],
                    ["Pevnost s otevřenou západkou", specs.openGateStrength],
                    ["Pevnost přes hranu", specs.edgeLoadingStrength],
                    ["Roztažení elastických ramen", specs.elasticArmExtension],
                  ]
                    .filter(([, v]) => v)
                    .map(([label, value]) => (
                      <tr key={String(label)} className="border-t border-zinc-100">
                        <td className="px-4 py-2 font-medium text-zinc-600">
                          {String(label)}
                        </td>
                        <td className="px-4 py-2 text-zinc-900">
                          {String(value)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CTA */}
          <div className="mt-6 space-y-3">
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Zobrazit na {product.brand}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Back + ferraty CTA */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6">
        <Link
          href="/vybaveni"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na katalog
        </Link>
        <Link
          href="/sport/ferraty"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Najít ferratu poblíž →
        </Link>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            brand: { "@type": "Brand", name: product.brand },
            image: product.images,
            url: `https://www.hraju.cz/vybaveni/${product.slug}`,
            ...(specs.articleNumber
              ? { sku: String(specs.articleNumber) }
              : {}),
          }),
        }}
      />
    </div>
  );
}
