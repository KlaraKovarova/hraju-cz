import { SPORTS } from "@/lib/sports";
import { getAllPosts, CATEGORIES } from "@/lib/blog";
import { REGIONS } from "@/lib/regions";
import { prisma } from "@/lib/prisma";

const BASE = "https://www.hraju.cz";

export const revalidate = 86400; // revalidate every 24 hours (optimization)

export async function GET() {
  const sections: string[] = [];

  // Header
  sections.push(`# hraju.cz — Podrobný přehled pro LLMs

> Největší adresář sportovišť v České republice. 3 000+ zařízení napříč 9 sporty — adresy, kontakty, hodnocení, komunitní recenze a turistické akce po celé ČR. Stránky jsou v češtině.

## O projektu

hraju.cz je komunitní platforma pro hledání sportovišť v České republice. Uživatelé mohou:
- Hledat sportoviště podle sportu, města nebo kraje
- Číst a psát recenze s hodnocením (1–5 hvězd)
- Zaznamenávat návštěvy (check-in "Byl/a jsem tady")
- Přidávat turistické a sportovní akce
- Navrhovat úpravy informací o sportovištích

Všechna data se týkají výhradně České republiky. Jazyk stránek je čeština.`);

  // Sports detail
  const sportDetails = SPORTS.map(
    (s) =>
      `### ${s.icon} ${s.nameCs} (${s.name})\n- URL: [${BASE}/sport/${s.slug}](${BASE}/sport/${s.slug})\n- ${s.description}`
  ).join("\n\n");
  sections.push(`## Sporty\n\n${sportDetails}`);

  // Regions
  const regionLines = REGIONS.map(
    (r) => `- [${r.name}](${BASE}/sport/tenis/kraj/${r.slug}): URL vzor /sport/{sport}/kraj/${r.slug}`
  ).join("\n");
  sections.push(`## Kraje (14 krajů ČR)\n\n${regionLines}`);

  // Facility stats from DB (with fallback) — only real/live data
  try {
    const stats = await Promise.race([
      Promise.all([
        prisma.facility.count({ where: { isActive: true } }),
        prisma.review.count({
          where: { isApproved: true, user: { isSeed: false } },
        }),
        prisma.user.count({ where: { isSeed: false } }),
        prisma.touristEvent.count({ where: { isActive: true } }),
        prisma.$queryRaw<{ sport: string; count: bigint }[]>`
          SELECT s.slug as sport, COUNT(*) as count
          FROM "Facility" f
          JOIN "FacilitySport" fs ON fs."facilityId" = f.id
          JOIN "Sport" s ON s.id = fs."sportId"
          WHERE f."isActive" = true
          GROUP BY s.slug
          ORDER BY count DESC
        `,
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000)
      ),
    ]);
    const [facilityCount, reviewCount, userCount, eventCount, sportCounts] =
      stats;
    const sportLines = sportCounts
      .map((sc) => {
        const sport = SPORTS.find((s) => s.slug === sc.sport);
        return sport
          ? `  - ${sport.nameCs}: ${sc.count}`
          : `  - ${sc.sport}: ${sc.count}`;
      })
      .join("\n");
    sections.push(`## Statistiky

- Aktivních sportovišť: ${facilityCount.toLocaleString("cs-CZ")}
${sportLines}
- Recenzí od uživatelů: ${reviewCount.toLocaleString("cs-CZ")}
- Registrovaných uživatelů: ${userCount.toLocaleString("cs-CZ")}
- Aktivních akcí: ${eventCount.toLocaleString("cs-CZ")}`);
  } catch {
    sections.push(`## Statistiky

- 3 000+ aktivních sportovišť
- 9 sportovních kategorií
- 14 krajů ČR`);
  }

  // Top cities per sport (from DB, with fallback)
  try {
    const topCities = await Promise.race([
      prisma.$queryRaw<{ city: string; count: bigint }[]>`
        SELECT l.city, COUNT(*) as count
        FROM "Facility" f
        JOIN "Location" l ON l.id = f."locationId"
        WHERE f."isActive" = true
        GROUP BY l.city
        ORDER BY count DESC
        LIMIT 15
      `,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000)
      ),
    ]);
    const cityLines = topCities.map(
      (c) => `- ${c.city}: ${c.count} sportovišť`
    ).join("\n");
    sections.push(`## Největší města\n\n${cityLines}`);
  } catch {
    // skip section on failure
  }

  // Blog posts
  const posts = getAllPosts();
  const categoryList = Object.entries(CATEGORIES)
    .map(([slug, name]) => `- [${name}](${BASE}/blog/kategorie/${slug})`)
    .join("\n");

  const recentPosts = posts.slice(0, 20).map(
    (p) => `- [${p.title}](${BASE}/blog/${p.slug}) (${p.date})`
  ).join("\n");

  sections.push(`## Blog

${posts.length} publikovaných článků v ${Object.keys(CATEGORIES).length} kategoriích.

### Kategorie

${categoryList}

### Nejnovější články

${recentPosts}`);

  // URL structure
  sections.push(`## Struktura URL

### Sportoviště
- \`/sport/{sport}\` — přehled sportu (top zařízení, FAQ, kraje)
- \`/sport/{sport}/{slug}\` — detail sportoviště (adresa, kontakt, hodnocení, recenze, mapa)
- \`/sport/{sport}/kraj/{kraj}\` — sportoviště v kraji
- \`/sport/{sport}/{mesto}\` — sportoviště ve městě (pro města s 2+ zařízeními)
- \`/sport/{sport}/praha\` — souhrn Prahy (všechny městské části)
- \`/sport/{sport}/praha/{cast}\` — městská část Prahy

### Města (multi-sport)
- \`/mesta\` — přehled všech měst
- \`/mesto/{mesto}\` — všechny sporty v daném městě

### Komunita
- \`/recenze\` — nejnovější schválené recenze
- \`/akce\` — kalendář turistických a sportovních akcí
- \`/uzivatel/{id}\` — veřejný profil uživatele (recenze, statistiky)

### Blog
- \`/blog\` — přehled všech článků
- \`/blog/{slug}\` — jednotlivý článek
- \`/blog/kategorie/{kategorie}\` — články podle kategorie
- \`/blog/sport/{sport}\` — články podle sportu

### Ostatní
- \`/hledat\` — fulltextové vyhledávání
- \`/kontakt\` — kontaktní formulář
- \`/ochrana-osobnich-udaju\` — ochrana osobních údajů`);

  // Structured data info
  sections.push(`## Strukturovaná data (JSON-LD)

Stránky obsahují schema.org strukturovaná data:
- **Sportoviště**: LocalBusiness, SportsActivityLocation, TennisComplex, GolfCourse, ExerciseGym
- **Hodnocení**: AggregateRating, Review
- **Blog**: Article s autorem a vydavatelem
- **Města**: ItemList se seznamem sportovišť
- **Uživatelé**: Person
- **FAQ**: FAQPage na stránkách sportů
- **Navigace**: BreadcrumbList na většině stránek
- **Otevírací doba**: OpeningHoursSpecification`);

  // API info for developers
  sections.push(`## Veřejné zdroje

- [Sitemap](${BASE}/sitemap.xml): Kompletní mapa stránek
- [llms.txt](${BASE}/llms.txt): Stručný přehled pro LLMs
- [RSS/Blog](${BASE}/blog): Nejnovější články (HTML)
- Vyhledávání: \`/api/search?q={dotaz}\` (JSON, veřejné)`);

  const body = sections.join("\n\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
