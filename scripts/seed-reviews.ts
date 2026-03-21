/**
 * Seed 25 reviews into production DB with realistic Czech user accounts.
 * Distribution: Praha 13, Brno 5, Ostrava 4, Mixed 3
 * Ratings: 3-star (2), 4-star (12), 5-star (11)
 *
 * Usage: npx tsx scripts/seed-reviews.ts
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

// --- Reviewer accounts ---
const reviewers = [
  { name: "Jana Novotná", email: "jana.novotna@seznam.cz" },
  { name: "Tomáš Dvořák", email: "tomas.dvorak@email.cz" },
  { name: "Petra Svobodová", email: "petra.svobodova@centrum.cz" },
  { name: "Martin Černý", email: "martin.cerny@gmail.com" },
  { name: "Lucie Procházková", email: "lucie.prochazkova@seznam.cz" },
  { name: "Ondřej Veselý", email: "ondrej.vesely@email.cz" },
  { name: "Kateřina Horáková", email: "katerina.horakova@gmail.com" },
  { name: "Pavel Kučera", email: "pavel.kucera@centrum.cz" },
  { name: "Zuzana Marková", email: "zuzana.markova@seznam.cz" },
  { name: "Jakub Němec", email: "jakub.nemec@email.cz" },
  { name: "Tereza Pokorná", email: "tereza.pokorna@gmail.com" },
  { name: "Filip Král", email: "filip.kral@centrum.cz" },
];

// --- Seed reviews ---
// Each entry: [facilityId, reviewerIndex, rating, title, text, daysAgo]
const seedReviews: [string, number, number, string | null, string, number][] = [
  // === PRAHA — TENIS (4) ===
  [
    "sCV-V9uvr8NAUPaT", 0, 5,
    "Krásný areál v Hodkovičkách",
    "Překrásný tenisový areál v klidném prostředí u Vltavy. Kurty jsou výborně udržované, antuka je vždy perfektně zarovnaná. Chodíme sem s manželem pravidelně o víkendech. Personál je milý a nápomocný. Doporučuji rezervovat dopředu, hlavně v létě je plno.",
    45,
  ],
  [
    "Cc1XThZF2K-o6vcR", 1, 4,
    "Dobrý tenis na písku",
    "Beach tenis je super zábava! Kurty jsou v dobrém stavu, ale šatny by zasloužily renovaci. Výuka je profesionální, trenér má trpělivost i s úplnými začátečníky jako jsem já. Cena odpovídá lokalitě v Praze 4.",
    38,
  ],
  [
    "z_XQqg4N8Z30UTpl", 2, 4,
    "Příjemný sportovní areál",
    "Hezký areál s tenisovými kurty i fotbalovým hřištěm. Kurty jsou antukové a dobře udržované. Parkování je trochu problém — málo míst. Jinak ale skvělé místo na odpolední tenis s přáteli.",
    32,
  ],
  [
    "l-99Gkm734BcH8om", 3, 4,
    null,
    "Solidní antukový kurt za rozumnou cenu. Není to žádný luxus, ale pro rekreační tenis naprosto dostačující. Dobrá dostupnost MHD.",
    28,
  ],

  // === PRAHA — FITNESS (3) ===
  [
    "5kEnHysbBYZTRenD", 4, 5,
    "Nejlepší gym v Praze 9",
    "ALL IN je absolutně top! Unikátní tréninkové zázemí, špičkové vybavení pro všechny úrovně. Funkční zóna je obrovská a vždy čistá. Trenéři jsou profíci. Jedinou nevýhodou je, že ve špičce (17-19h) bývá hodně plno.",
    52,
  ],
  [
    "u4DJjAko0t-tgQKj", 5, 5,
    "Squash i fitness na jednom místě",
    "ARBES centrum je skvělé — posilovna, squash i kardio zóna pod jednou střechou. Vybavení je moderní a čisté. Chodím sem 3x týdně už dva roky a jsem maximálně spokojená.",
    41,
  ],
  [
    "1xqO2U85QehEFBzf", 6, 4,
    "Kvalitní skupinové lekce",
    "Skupinové lekce v 3D FITNESS Academy jsou výborné, hlavně TRX a kruhový trénink. Trenéři jsou motivující a profesionální. Prostory jsou menší, ale útulné. Cena je vyšší, ale za kvalitu se platí.",
    35,
  ],

  // === PRAHA — SQUASH (2) ===
  [
    "VaZQjpm2S29xNNvf", 7, 5,
    "Skvělé squashové kurty",
    "SQP Squashpoint má tři kurty ve výborném stavu. Možnost zapůjčení raket a míčků přímo na místě. Stolní tenis a badminton jsou příjemný bonus. Doporučuji!",
    48,
  ],
  [
    "92n-t9KIs4YyhyqV", 8, 4,
    "Fajn squash v Praze 9",
    "MTV Fitness & Squash má čisté kurty a příjemný personál. Půjčovna vybavení funguje bezproblémově. Minus je, že občas mívají krátkou otevírací dobu o víkendech.",
    30,
  ],

  // === PRAHA — PLAVANI (2) ===
  [
    "N0a7V7lBoi7zWUWp", 9, 5,
    "Aquacentrum Šutka — paráda",
    "Výborný 50m bazén, parní lázně i sauny. Aquapark pro děti je bonus. Čisto a moderní. Chodíme sem celá rodina — děti milují tobogány a my si v klidu zaplaveme v hlavním bazénu.",
    55,
  ],
  [
    "hID7NlSbgMK1wnbs", 10, 5,
    "Super aquapark pro rodiny",
    "AquaDream Barrandov je ideální pro rodinný výlet. Vnitřní i venkovní bazén, tobogány, vířivka — prostě všechno. Děti se tu baví hodiny. Jediné mínus je parkování, které bývá plné o víkendech.",
    42,
  ],

  // === PRAHA — LEZENI (2) ===
  [
    "cmn032o3k000fnv8owq7tdk0t", 11, 5,
    "Skvělá boulderovka v Karlíně",
    "HUDY Boulder Karlín je výborná boulderovka s pestrou nabídkou cest pro všechny úrovně. Přestavují pravidelně, takže je vždy co zkoušet nového. Atmosféra je přátelská, komunita lezců super.",
    25,
  ],
  [
    "cmn032omd000unv8o52s93fwz", 0, 4,
    "Velká stěna, dobrá nabídka",
    "Big Wall je obrovský lezecký areál s cestami od 4a až po 8b. Ideální pro trénink s lanem. Šatny jsou čisté, půjčovna vybavení funguje. Občas je tu dost lidí ve večerních hodinách.",
    18,
  ],

  // === BRNO — TENIS (2) ===
  [
    "XnZslMvKbz9J1nn4", 1, 5,
    "Výborná tenisová škola",
    "D&M Tennis Academy je skvělá tenisová škola pro děti i dospělé. Více než desetiletá tradice a zkušení trenéři. Syn chodí od čtyř let a výrazně se zlepšil. Areál je čistý a moderní.",
    60,
  ],
  [
    "lLEsLX9gbSSPDzUS", 2, 4,
    "Tradice a kvalita",
    "Bystrcký tenisový klub má skvělou historii sahající do roku 1975. Sedm kurtů je dostatek. Celoroční provoz je velké plus. Zázemí je trochu starší, ale funkční. Dobrá cena.",
    50,
  ],

  // === BRNO — FITNESS (2) ===
  [
    "Xp7cfJMebFK081oF", 3, 5,
    "Čtyři sály, všechno top",
    "AZ FITNESS má čtyři cvičební sály — fitness, funkční trénink, skupinové lekce i kardio. Vybavení je moderní a čisté. Skupinové lekce jsou skvěle vedené. Nejlepší fitness v Brně!",
    44,
  ],
  [
    "f4K5OpLtn7AiFCPB", 4, 3,
    "Solidní, ale nic extra",
    "Active fitness má slušnou posilovnu a kardio zónu. Vybavení je funkční, ale některé stroje jsou starší. Cena je v pořádku. Chybí mi větší výběr skupinových lekcí.",
    37,
  ],

  // === BRNO — PLAVANI (1) ===
  [
    "tgZWZXwrr2icm6kR", 5, 4,
    "Dobrý bazén na kondiční plavání",
    "Bazén Ponávka je ideální pro kondiční plavání. Voda je čistá, plavčík dohlíží. Někdy bývá hodně lidí v odpoledních hodinách. Pro organizované skupiny nabízí dobré podmínky.",
    33,
  ],

  // === OSTRAVA — TENIS (2) ===
  [
    "Kqlhl9KERy_9KAkn", 6, 5,
    "Šest kurtů, letní i zimní sezóna",
    "ITP ISMM Tenis Park je výborný areál se šesti kurty s umělým povrchem. V létě super, v zimě přetlaková hala. Trenéři jsou kvalifikovaní a příjemní. Vřele doporučuji všem tenistům v Ostravě!",
    56,
  ],
  [
    "qB23o7ttl6EugWzx", 7, 4,
    "Rodinná atmosféra",
    "Family Tennis má příjemnou rodinnou atmosféru. Výuka je kvalitní pro dospělé i děti. Kurty by mohly být lépe osvětlené pro večerní hru, ale jinak je to skvělé místo.",
    40,
  ],

  // === OSTRAVA — FITNESS (2) ===
  [
    "EQxqOxBPDqfDWV-w", 8, 4,
    "Posilovna s dobrým zázemím",
    "BODY LAND má kvalitní vybavení a odborný personál. Bar s výživovými doplňky je příjemný bonus. Šatny jsou čisté. Trochu menší prostor, ale pro běžné cvičení naprosto stačí.",
    29,
  ],
  [
    "OODtWhOTxxpklD2d", 9, 3,
    "Průměrné fitness",
    "Bodylax Fitness je OK pro základní cvičení. Kardio zóna je slušná, ale silová část by potřebovala modernizaci. Personál je ochotný a poradenství ohledně výživy je fajn. Cena odpovídá.",
    22,
  ],

  // === MIXED — BADMINTON (1) ===
  [
    "Lgwfxl1hCxlA58iY", 10, 5,
    "Nejlepší badmintonová hala!",
    "AMOK ARÉNA v Paskově je čistokrevná badmintonová hala, kterou postavil sám aktivní hráč — a to je znát! Podlaha je perfektní, osvětlení výborné, a atmosféra je prostě super. Jezdíme sem pravidelně z Ostravy.",
    47,
  ],

  // === MIXED — GOLF (1) ===
  [
    "c9AVQhaHFF8O9FLY", 11, 5,
    "Unikátní zážitek s 3D grafikami",
    "3D Black Light Minigolf v Hradci Králové je fantastický zážitek! 18 jamek s 3D grafikami od zahraničních umělců. Gaming zóna s PS5 a Xbox je bonus. Ideální pro rodinný výlet nebo narozeninovou oslavu.",
    36,
  ],

  // === MIXED — VOLEJBAL (1) ===
  [
    "7hyJp4j6UsmDS-0K", 3, 4,
    "Skvělý beachvolejbal v Praze",
    "Beachklub Praha Pankrác je super místo pro beach volejbal. Bohatá historie klubu a vášeň pro sport jsou cítit. Pořádají profesionální turnaje i zábavné akce pro veřejnost. Doporučuji přijít v létě.",
    15,
  ],
];

async function main() {
  console.log("Seeding 25 reviews into production database...\n");

  // 1. Create user accounts (upsert to avoid duplicates)
  console.log("--- Creating reviewer accounts ---");
  const userIds: Record<string, string> = {};

  for (const r of reviewers) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        name: r.name,
        // Generate a random password hash (these are seed accounts, not real logins)
        passwordHash: crypto.randomBytes(32).toString("hex"),
      },
    });
    userIds[r.email] = user.id;
    console.log(`  ✓ ${r.name} (${user.id})`);
  }

  // 2. Insert reviews
  console.log("\n--- Inserting reviews ---");
  const affectedFacilities = new Set<string>();
  let inserted = 0;
  let skipped = 0;

  for (const [facilityId, reviewerIdx, rating, title, text, daysAgo] of seedReviews) {
    const reviewer = reviewers[reviewerIdx];
    const userId = userIds[reviewer.email];

    // Check if review already exists for this user+facility
    const existing = await prisma.review.findFirst({
      where: { facilityId, userId },
    });
    if (existing) {
      console.log(`  ⊘ Skipped (exists): ${reviewer.name} → ${facilityId}`);
      skipped++;
      continue;
    }

    // Calculate a past createdAt date
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    // Add some random hours to make timestamps more natural
    createdAt.setHours(
      8 + Math.floor(Math.random() * 14),
      Math.floor(Math.random() * 60),
      Math.floor(Math.random() * 60),
    );

    const review = await prisma.review.create({
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
    console.log(`  ✓ ${reviewer.name} → ${facilityId} (${rating}★) ${title || "(no title)"}`);
  }

  console.log(`\nInserted: ${inserted}, Skipped: ${skipped}`);

  // 3. Recalculate averageRating and reviewCount for each affected facility
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
        reviewCount: stats._count.rating,
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

  console.log("\n✅ Done! All 25 seed reviews inserted and approved.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
