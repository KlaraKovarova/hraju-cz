/**
 * Seed reviews for all ferraty + lezení facilities with 0 reviews.
 * Target: 100% review coverage for both categories.
 * Uses existing seed reviewer personas.
 *
 * Usage: npx tsx scripts/seed-reviews-coverage.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) throw new Error("DATABASE_URL / DIRECT_URL not set");
console.log("Connecting to:", connStr.replace(/:[^:@]+@/, ":***@"));

const adapter = new PrismaNeon({ connectionString: connStr });
const prisma = new PrismaClient({ adapter });

// Reuse existing seed reviewer personas
const reviewers = [
  { name: "Radek Matoušek", email: "radek.matousek77@seznam.cz" },
  { name: "Simona Krejčová", email: "simona.krejcova14@email.cz" },
  { name: "Vojtěch Hrubý", email: "vojtech.hruby33@gmail.com" },
  { name: "Michaela Tichá", email: "michaela.ticha@centrum.cz" },
  { name: "Dominik Šulc", email: "dominik.sulc88@post.cz" },
  { name: "Barbora Vlková", email: "barbora.vlkova@volny.cz" },
  { name: "Štěpán Kadlec", email: "stepan.kadlec42@seznam.cz" },
  { name: "Nikola Řezníčková", email: "nikola.reznickova@email.cz" },
];

// [facilitySlug, reviewerIndex, rating, title, text, daysAgo]
const seedReviews: [string, number, number, string | null, string, number][] = [
  // === FERRATY ===
  ["horolezecka-arena-liberec", 0, 4, "Fajn městská ferrata",
    "Liberecká aréna u přehrady je ideální na rozlezení. Trasy nejsou dlouhé, ale dobře udržované. Vhodné pro rodiny s většími dětmi. Po ferratě se dá posedět u přehrady. Parkování přímo u areálu.",
    14],

  // === LEZENÍ — Praha ===
  ["boulder-myway-cakovice", 1, 4, "Moderní bouldrovka na severu Prahy",
    "MyWay v Čakovicích má pěkné nové profily a pravidelně přestavují. Menší než Smíchoff nebo Karlín, ale útulnější a méně přeplněné. Dobrá dětská zóna. Parkování u centra bez problému.",
    18],

  ["horolezecka-stena-cibulka", 2, 3, "Menší stěna, ale funguje",
    "Stěna na Cibulce je menší a starší, ale pro trénink stačí. Výhodou je klidné prostředí a nízká návštěvnost. Profily nejsou moc pestré. Vhodné spíš pro pravidelný trénink než na celý den.",
    25],

  ["jam-jam-boulderovka", 3, 4, null,
    "Útulná boulderovka v Praze 6. Přestavují pravidelně, problémy jsou zajímavé a kreativní. Menší prostor, ale výborná atmosféra. Káva v baru je překvapivě dobrá. O víkendu bývá plnější.",
    12],

  ["lezecka-stena-free-solo", 4, 4, "Kvalitní stěna na Praze 4",
    "Free Solo má solidní výběr cest i boulderů. Výška stěny je dostatečná, profily pestré. Personál ochotný a kurzy pro začátečníky dobře vedené. Šatny čisté. Jediné minus — o víkendu fronty na populární cesty.",
    30],

  ["lezecka-stena-ruzyne", 5, 3, null,
    "Menší stěna v Ruzyni, vhodná hlavně pro trénink. Profily jsou jednoduché, ale pro pravidelné lezení stačí. Výhoda je nízká návštěvnost a rozumná cena. Parkování snadné.",
    22],

  ["lezecka-stena-trinactka", 6, 4, "Příjemná stěna na Smíchově",
    "Třináctka je příjemná lezecká stěna s dobrým poměrem cena/výkon. Pravidelně přestavují. Atmosféra komunitní — znáte se tu. Pro bouldery menší prostor, ale cesty jsou fajn. Blízko metra.",
    17],

  ["lezecke-centrum-radotin", 7, 3, "Menší centrum, ale v klidu",
    "Radotín je menší lezecké centrum, ideální na klidný trénink. Stěna není nejvyšší, ale profily jsou zajímavé. Méně lidí než v centru Prahy. Dobrá dostupnost autem.",
    28],

  ["prostor-letnany", 0, 4, "Moderní centrum s velkým prostorem",
    "Prostor v Letňanech překvapí velikostí. Bouldery i stěna na lano, dobrý výběr obtížností. Café a posezení příjemné. Pravidelné přestavby. Trochu dál od centra, ale parkování pohodové.",
    15],

  ["sc-palmovka-lezeni", 1, 3, null,
    "Lezecká stěna na Palmovce je malá, ale pro trénink postačí. Výhodou je poloha v centru Prahy a nízká cena. Profily jednoduché, spíš pro začátečníky a pravidelný trénink.",
    20],

  ["spin-climbing-praha", 2, 5, "Výborná stěna na Praze 4",
    "Spin Climbing mě nadchl — moderní profily, skvělé přestavby a příjemná atmosféra. Výška stěny je solidní, výběr cest pestrý. Doporučuji kurzy pro začátečníky, jsou profesionálně vedené. Jedno z nejlepších center v Praze.",
    10],

  ["sport-centrum-evropska", 3, 3, "Multisportovní centrum se stěnou",
    "Lezecká stěna je součástí většího sportovního centra. Není to specializovaná hala, ale pro příležitostné lezení stačí. Výhodou je možnost kombinace s dalšími sporty. Cena přiměřená.",
    35],

  ["ultraant-lezecke-centrum", 4, 4, "Centrum v srdci Prahy",
    "UltraAnt je překvapivě dobré centrum přímo v centru města. Menší prostor, ale kvalitní profily a pravidelné přestavby. Pro bouldery ideální. Atmosféra přátelská, personál ochotný.",
    19],

  // === LEZENÍ — Brno ===
  ["flash-boulder-bar-brno", 5, 4, "Oblíbená brněnská bouldrovka",
    "Flash Boulder Bar má příjemnou atmosféru a dobré problémy. Přestavují pravidelně. Bar s kávou a pečivem je bonus. O víkendu plné, lepší chodit ve všední dny dopoledne. Šatny čisté, sprchy funkční.",
    16],

  ["horolezecka-stena-komec-brno", 6, 3, null,
    "Komec je starší stěna v Brně, ale stále funkční. Profily nejsou nejmodernější, ale pro trénink dostačují. Nízká cena a menší návštěvnost jsou výhodou. Parkování u haly.",
    24],

  // === LEZENÍ — Ostrava ===
  ["cdu-sport-ostrava-vyskovice", 7, 3, "Solidní stěna v Ostravě",
    "CDU Sport má slušnou lezeckou stěnu. Není největší, ale profily jsou pestré. Pro ostravské lezce dobrá volba na pravidelný trénink. Cena rozumná, personál vstřícný.",
    32],

  ["druzba-boulder-ostrava", 0, 4, "Fajn boulder v Ostravě",
    "Družba má moderní bouldrovku s pravidelnými přestavbami. Problémy jsou kreativní a pro všechny úrovně. Menší prostor, ale útulný. Komunita je přátelská. Doporučuji páteční večery.",
    13],

  ["horolezecka-stena-eliass-ostrava", 1, 3, null,
    "Eliass je menší stěna v Ostravě. Pro trénink stačí, ale na celý den to není. Výhodou je nízká cena a klidné prostředí. Lezecké kurzy jsou dobře vedené.",
    27],

  // === LEZENÍ — Liberec ===
  ["boulder-point-liberec", 2, 4, "Kvalitní boulder v Liberci",
    "Boulder Point je moderní bouldrovka s dobrými profily. Přestavují pravidelně, problémy jsou zajímavé od 3 po 7. Prostorná hala, čisté zázemí. Dobré místo pro liberecké bouldristy.",
    11],

  ["lezecka-stena-harcov-liberec", 3, 3, "Univerzitní stěna v Liberci",
    "Harcov je stěna u liberecké univerzity. Menší, ale funkční. Vhodná hlavně pro studenty a pravidelný trénink. Ceny studentské, profily základní. Na specializovaný trénink lepší Šutr nebo Boulder Point.",
    29],

  // === LEZENÍ — menší města ===
  ["atlas-opava-lezecka-stena", 4, 3, "Jediná stěna v Opavě",
    "Atlas je jediná lezecká stěna v Opavě a okolí. Menší, ale pro místní komunitu důležitá. Profily základní, přestavují méně často. Cena nízká, atmosféra přátelská.",
    21],

  ["base-camp-prerov", 5, 4, "Příjemné centrum v Přerově",
    "Base Camp překvapí kvalitou. Moderní vybavení, čisté zázemí, ochotný personál. Stěna i boulder. Pro Přerov nadstandardní. Kurzy pro děti dobře vedené. Doporučuji.",
    16],

  ["boulder-bar-novy-jicin", 6, 4, null,
    "Útulná bouldrovka v Novém Jičíně. Menší prostor, ale problémy jsou kreativní a přestavují pravidelně. Dobrá komunita, přátelská atmosféra. Káva v baru fajn.",
    23],

  ["boulder-pentagon-tabor", 7, 4, "Boulder v Táboře",
    "Pentagon je příjemná bouldrovka v Táboře. Moderní profily, pravidelné přestavby. Ideální pro jihočeské bouldristy. Prostorný, čistý, dobrý bar. Parkování u centra.",
    14],

  ["h-centrum-lezecka-stena-pardubice", 0, 3, null,
    "H-centrum má funkční lezeckou stěnu. Profily starší, ale udržované. Pro pardubické lezce alternativa k Jungle/Gekon. Výhodou je nižší návštěvnost a klidné prostředí.",
    26],

  ["horolezecka-stena-breclav", 1, 3, "Menší stěna na jihu Moravy",
    "Břeclavská stěna je menší, ale pro místní komunitu cenná. Základní profily, přestavují méně často. Vhodné pro trénink a začátečníky. Cena přijatelná.",
    33],

  ["horolezecka-stena-lanskroun", 2, 3, null,
    "Stěna v Lanškrouně je malá, ale pro pravidelný trénink stačí. Místní lezecká komunita je přátelská. Základní vybavení, rozumné ceny.",
    28],

  ["horolezecka-stena-mango-vrchlabi", 3, 4, "Překvapivě dobrá stěna",
    "Mango ve Vrchlabí mě mile překvapilo. Moderní profily, příjemné prostředí s výhledem na Krkonoše. Ideální kombinace s venkovním lezením v Adršpachu nebo v Jizerách. Doporučuji.",
    15],

  ["horolezecka-stena-sobotka", 4, 3, null,
    "Malá stěna v Sobotce. Pro trénink a místní komunitu dostačující. Blízko Hruboskalska — ideální pro zimní trénink, než se vrátíte na pískovce.",
    31],

  ["horolezecka-stena-sumperk", 5, 3, "Stěna v Šumperku",
    "Šumperská stěna je základní, ale funkční. Pro místní lezce důležitá, zvlášť v zimě. Profily jednoduché, přestavují méně často. Cena nízká.",
    22],

  ["jungle-pardubice-4-move", 6, 4, "Moderní centrum v Pardubicích",
    "Jungle (4 Move) je nejmodernější lezecké centrum v Pardubicích. Velký prostor, pestré profily, pravidelné přestavby. Boulder i stěna na lano. Café s dobrou kávou. Parkování u centra.",
    9],

  ["lsd-lezecka-stena-dufek-kurim", 7, 3, null,
    "L.S.D. v Kuřimi je menší stěna kousek od Brna. Pro trénink stačí, profily základní. Výhoda — méně lidí než v brněnských halách. Cena rozumná.",
    34],

  ["lezecka-arena-jirkov", 0, 3, "Stěna v Jirkově",
    "Lezecká Arena v Jirkově je menší stěna pro místní komunitu. Základní vybavení, ale udržované. Výhodou je nízká cena a přátelský přístup provozovatele.",
    27],

  ["lezecka-stena-bystrice-nad-pernstejnem", 1, 3, null,
    "Malá stěna v Bystřici nad Pernštejnem. Pro místní lezce a školy. Profily jednoduché, ale funkční. V zimě dobrá alternativa k venkovnímu lezení na Vysočině.",
    30],

  ["lezecka-stena-jicin", 2, 3, "Stěna u bran Českého ráje",
    "Jičínská stěna je malá, ale má strategickou polohu — v zimě trénujete tady, v létě na pískovcích v Českém ráji. Základní profily, přátelská komunita.",
    21],

  ["lezecka-stena-karlovy-vary", 3, 4, "Dobrá stěna v Karlových Varech",
    "Lezecká stěna v Karlových Varech má solidní profily a příjemné zázemí. Pro karlovarské lezce jediná pořádná stěna v okolí. Přestavují pravidelně, personál ochotný.",
    18],

  ["lezecka-stena-kolin", 4, 3, null,
    "Stěna v Kolíně je menší, ale udržovaná. Pro místní komunitu důležitá. Blízko Via Ferrat Peklo — ideální pro kombinaci ferrata + stěna na jeden výlet.",
    25],

  ["lezecka-stena-kutna-hora", 5, 3, "Stěna v historickém městě",
    "Kutnohorská stěna je malá, ale funkční. Pro místní trénink stačí. Dobrá kombinace s výletem po městě. Profily základní, ceny přívětivé.",
    29],

  ["lezecka-stena-mseno", 6, 4, "Blízko skalních oblastí",
    "Stěna v Mšeně je ideální zázemí pro lezce, kteří jezdí do Kokořínska. V dešti trénujete uvnitř, za pěkna jdete ven na pískovec. Profily kvalitní, menší prostor.",
    12],

  ["lezecka-stena-policka", 7, 3, null,
    "Polička má malou stěnu, ale pro místní komunitu důležitou. Základní profily, přátelská atmosféra. V zimě jediná možnost lezení v širokém okolí.",
    26],

  ["lezecka-stena-svc-trutnov", 0, 3, "Stěna u Krkonoš",
    "Trutnovská stěna je na SVČ — menší, ale funkční. Pro místní děti a mládež skvělá. Profily jednoduché. Blízko Adršpachu — zimní zázemí pro pískovcové lezce.",
    33],

  ["lezecka-stena-svitavy", 1, 3, null,
    "Svitavská stěna je malá, ale pro trénink stačí. Místní komunita lezců je přátelská. Základní vybavení, rozumné ceny. V zimě oceníte.",
    31],

  ["lezecka-stena-vsetin", 2, 3, "Stěna ve Vsetíně",
    "Vsetínská stěna je menší, ale pro Zlínský kraj cenná. Profily jednoduché, udržované. Pro pravidelný trénink dostačující. Blízko Beskyd na letní venkovní lezení.",
    24],

  ["lezecka-stena-zubri", 3, 3, null,
    "Zubří má malou stěnu, ale pro místní lezce důležitou. Jednoduché profily, přátelská atmosféra. V zimě alternativa k Vsetínu.",
    28],

  ["lezecka-stena-cernozice", 4, 3, "Malá stěna u Hradce",
    "Černožice mají malou stěnu kousek od Hradce Králové. Pro trénink stačí, ale na celý den to není. Výhoda — méně lidí a nízká cena.",
    22],

  ["lezecka-stena-ceska-trebova", 5, 3, null,
    "Stěna v České Třebové je menší, ale funkční. Pro trénink místních lezců dostačující. Základní profily, klidné prostředí.",
    30],

  ["lezu-v-mezu-velke-mezirici", 6, 4, "Příjemná stěna na Vysočině",
    "Lezu v Mezu je příjemné překvapení — moderní profily, čisté zázemí a přátelská atmosféra. Pro Vysočinu nadstandard. Dobré kurzy pro děti. Doporučuji.",
    13],

  ["replay-boulder-frenstat", 7, 4, "Bouldrovka v Beskydech",
    "Replay je moderní bouldrovka ve Frenštátu. Problémy kreativní, přestavují pravidelně. Příjemná komunita. Ideální na zimní trénink, v létě se leze venku v Beskydech.",
    11],

  ["skp-policie-ceske-budejovice", 0, 3, null,
    "Stěna SKP Policie v Budějovicích je menší, ale pro trénink funguje. Starší vybavení, ale udržované. Pro jihočeské lezce alternativa k Lanovce.",
    35],

  ["sport-centrum-koloseum-plzen", 1, 3, "Multisport s lezením",
    "Koloseum v Plzni má stěnu jako součást sportovního centra. Není specializovaná, ale pro příležitostné lezení stačí. Výhodou je kombinace s dalšími sporty.",
    20],

  ["tj-alpin-trebic-lezecka-stena", 2, 4, "Klubová stěna v Třebíči",
    "TJ Alpin má pěknou stěnu s dobrými profily. Klubová atmosféra, ale otevřeno i veřejnosti. Pro Třebíč výborné. Pravidelné přestavby, ochotní správci.",
    17],

  ["walzel-lezecka-stena-mezimesti", 3, 3, null,
    "Walzel v Meziměstí je malá stěna v podhůří Broumovska. Pro trénink stačí. Blízko Adršpachu a Broumovských stěn — zimní zázemí.",
    32],

  ["skoda-sport-park-lezecka-vez-plzen", 4, 4, "Lezecká věž v Plzni",
    "Škoda Sport Park má zajímavou lezeckou věž. Venkovní a vnitřní profily. Pro plzeňské lezce skvělá volba. Zázemí sportovního parku je bonus — parkování, občerstvení.",
    14],
];

async function main() {
  console.log(`Seeding ${seedReviews.length} reviews for facilities with 0 reviews...\n`);

  // 1. Look up facilities by slug
  console.log("--- Looking up facilities ---");
  const slugToId: Record<string, string> = {};
  const allSlugs = [...new Set(seedReviews.map(([slug]) => slug))];

  for (const slug of allSlugs) {
    const facility = await prisma.facility.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });
    if (facility) {
      slugToId[slug] = facility.id;
      console.log(`  ✓ ${facility.name} → ${facility.id}`);
    } else {
      console.log(`  ✗ NOT FOUND: ${slug}`);
    }
  }

  // 2. Ensure reviewer accounts exist (isSeed=true)
  console.log("\n--- Ensuring reviewer accounts ---");
  const userIds: Record<string, string> = {};

  for (const r of reviewers) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        name: r.name,
        passwordHash: crypto.randomBytes(32).toString("hex"),
        isSeed: true,
      },
    });
    userIds[r.email] = user.id;
    console.log(`  ✓ ${r.name} (${user.id})`);
  }

  // 3. Insert reviews
  console.log("\n--- Inserting reviews ---");
  const affectedFacilities = new Set<string>();
  let inserted = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [slug, reviewerIdx, rating, title, text, daysAgo] of seedReviews) {
    const facilityId = slugToId[slug];
    if (!facilityId) {
      console.log(`  ✗ Skipped (facility not found): ${slug}`);
      notFound++;
      continue;
    }

    const reviewer = reviewers[reviewerIdx];
    const userId = userIds[reviewer.email];

    // Check for existing review (same user + facility)
    const existing = await prisma.review.findFirst({
      where: { facilityId, userId },
    });
    if (existing) {
      console.log(`  ⊘ Skipped (exists): ${reviewer.name} → ${slug}`);
      skipped++;
      continue;
    }

    // Calculate backdated createdAt
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(
      7 + Math.floor(Math.random() * 15),
      Math.floor(Math.random() * 60),
      Math.floor(Math.random() * 60),
    );

    await prisma.review.create({
      data: {
        facilityId,
        userId,
        authorName: reviewer.name,
        authorEmail: reviewer.email,
        rating,
        title,
        text,
        isApproved: true,
        createdAt,
      },
    });

    affectedFacilities.add(facilityId);
    inserted++;
    console.log(`  ✓ ${reviewer.name} → ${slug} (${rating}★) ${title || "(no title)"}`);
  }

  console.log(`\nInserted: ${inserted}, Skipped: ${skipped}, Not found: ${notFound}`);

  // 4. Recalculate averageRating for affected facilities
  console.log("\n--- Recalculating facility ratings ---");
  for (const facilityId of affectedFacilities) {
    const stats = await prisma.review.aggregate({
      where: { facilityId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.facility.update({
      where: { id: facilityId },
      data: {
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
      },
    });

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { name: true },
    });

    console.log(
      `  ✓ ${facility?.name}: ${stats._avg.rating?.toFixed(1)} avg, ${stats._count.rating} reviews`,
    );
  }

  console.log(`\n✅ Done! ${inserted} reviews seeded and approved.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
