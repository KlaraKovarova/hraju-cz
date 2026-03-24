import { SPORTS } from "@/lib/sports";
import { CATEGORIES } from "@/lib/blog";
import { REGIONS } from "@/lib/regions";

const BASE = "https://www.hraju.cz";

export function GET() {
  const sportList = SPORTS.map(
    (s) => `- [${s.nameCs}](${BASE}/sport/${s.slug}): ${s.description}`
  ).join("\n");

  const regionList = REGIONS.map(
    (r) => `- [${r.name}](${BASE}/sport/tenis/kraj/${r.slug})`
  ).join("\n");

  const categoryList = Object.entries(CATEGORIES)
    .map(([slug, name]) => `- [${name}](${BASE}/blog/kategorie/${slug})`)
    .join("\n");

  const body = `# hraju.cz

> Největší adresář sportovišť v České republice. 3 000+ zařízení napříč 9 sporty — adresy, kontakty, hodnocení, komunitní recenze a turistické akce po celé ČR.

## O projektu

hraju.cz je komunitní platforma pro hledání sportovišť. Uživatelé mohou hledat podle sportu, města nebo kraje, číst a psát recenze, zaznamenávat návštěvy (check-iny) a sdílet turistické akce. Stránky jsou v češtině a zaměřují se výhradně na Českou republiku.

## Sporty

${sportList}

## Hlavní sekce

- [Vyhledávání sportovišť](${BASE}/hledat): Fulltextové hledání podle názvu a města
- [Města](${BASE}/mesta): Přehled sportovišť podle měst
- [Recenze](${BASE}/recenze): Komunitní hodnocení sportovišť
- [Turistické akce](${BASE}/akce): Kalendář outdoorových a sportovních akcí
- [Blog](${BASE}/blog): Průvodce sporty, městy, tipy a vybavení

## Kraje

${regionList}

## Blog kategorie

${categoryList}

## Struktura URL

- \`/sport/{sport}\` — přehled sportu s nejlepšími zařízeními
- \`/sport/{sport}/{slug}\` — detail sportoviště
- \`/sport/{sport}/kraj/{kraj}\` — sportoviště v kraji
- \`/sport/{sport}/{mesto}\` — sportoviště ve městě
- \`/mesto/{mesto}\` — všechny sporty v daném městě
- \`/blog/{slug}\` — článek na blogu
- \`/akce\` — kalendář turistických akcí
- \`/recenze\` — nejnovější recenze
- \`/uzivatel/{id}\` — veřejný profil uživatele

## Další informace

- [Podrobná verze pro LLMs](${BASE}/llms-full.txt)
- [Sitemap](${BASE}/sitemap.xml)
- [Kontakt](${BASE}/kontakt)
- [Ochrana osobních údajů](${BASE}/ochrana-osobnich-udaju)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
