/**
 * Daily community seeding script — creates 5 new users with 1-3 reviews each.
 * All seed users are marked isSeed=true for admin distinction.
 * Reviews are auto-approved and facility ratings are recalculated.
 *
 * Usage: npx tsx scripts/seed-daily-reviews.ts
 *        npx tsx scripts/seed-daily-reviews.ts --mark-existing  (one-time: mark old seed users)
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

// --- Name pools ---
const firstNames = {
  male: [
    "Adam", "Aleš", "David", "Daniel", "Filip", "Honza", "Jakub", "Jan",
    "Jiří", "Lukáš", "Marek", "Martin", "Matěj", "Michal", "Ondřej",
    "Patrik", "Pavel", "Petr", "Radek", "Roman", "Štěpán", "Tomáš",
    "Václav", "Viktor", "Vojtěch", "Zdeněk",
  ],
  female: [
    "Adéla", "Alena", "Barbora", "Dana", "Eliška", "Eva", "Hana",
    "Jana", "Karolína", "Kateřina", "Klára", "Lenka", "Lucie", "Marie",
    "Markéta", "Martina", "Monika", "Nela", "Petra", "Simona", "Tereza",
    "Veronika", "Zuzana",
  ],
};
const lastNames = {
  male: [
    "Bartoš", "Beneš", "Bláha", "Čech", "Černý", "Doležal", "Dvořák",
    "Fiala", "Holub", "Horák", "Jelínek", "Kolář", "Kopecký", "Kos",
    "Kovář", "Král", "Krejčí", "Kučera", "Malý", "Marek", "Mašek",
    "Navrátil", "Němec", "Novák", "Novotný", "Pokorný", "Polák",
    "Procházka", "Růžička", "Sedláček", "Sobotka", "Soukup", "Svoboda",
    "Šimek", "Šťastný", "Urban", "Valenta", "Veselý", "Vlček", "Zeman",
  ],
  female: [
    "Bartošová", "Benešová", "Bláhová", "Čechová", "Černá", "Doležalová",
    "Dvořáková", "Fialová", "Holubová", "Horáková", "Jelínková", "Kolářová",
    "Kopecká", "Kosová", "Kovářová", "Králová", "Krejčová", "Kučerová",
    "Malá", "Marková", "Mašková", "Navrátilová", "Němcová", "Nováková",
    "Novotná", "Pokorná", "Poláková", "Procházková", "Růžičková",
    "Sedláčková", "Sobotkova", "Soukupová", "Svobodová", "Šimková",
    "Šťastná", "Urbanová", "Valentová", "Veselá", "Vlčková", "Zemanová",
  ],
};

const emailDomains = ["seznam.cz", "email.cz", "centrum.cz", "gmail.com", "post.cz", "volny.cz"];

// --- Review templates by sport ---
const reviewTemplates: Record<string, { titles: (string | null)[]; texts: string[] }> = {
  tenis: {
    titles: [
      "Super tenisové kurty", "Příjemný areál na tenis", "Dobrá antuka",
      "Skvělé zázemí pro tenis", null, "Výborná tenisová škola",
    ],
    texts: [
      "Kurty jsou dobře udržované a personál je příjemný. Rádi se vracíme.",
      "Hezký areál, antuka v dobrém stavu. Parkování je trochu problém, ale jinak spokojenost.",
      "Chodíme sem pravidelně hrát s kamarády. Cena je přijatelná a kurty jsou vždy připravené.",
      "Výborné podmínky pro rekreační tenis. Trenér je profesionální a trpělivý.",
      "Areál je čistý a prostorný. V létě je tu krásně. Jediné mínus — občas plno o víkendech.",
      "Jsem nadšenec do tenisu a tady se mi líbí. Kurty jsou v perfektním stavu.",
    ],
  },
  squash: {
    titles: [
      "Výborné squashové kurty", "Fajn squash", "Čisté kurty, dobrá atmosféra",
      null, "Příjemné sportovní centrum",
    ],
    texts: [
      "Squashové kurty jsou v perfektním stavu. Půjčovna vybavení funguje bez problémů.",
      "Chodím sem hrát squash 2x týdně. Kurty jsou čisté a dobře osvětlené.",
      "Super místo na squash. Rezervace online funguje skvěle. Personál je milý.",
      "Dobrá poloha a kvalitní kurty. Šatny jsou čisté. Občas je tu víc lidí, ale většinou ok.",
      "Squash je tu výborný. Kurty mají správnou teplotu a podlaha je v top stavu.",
    ],
  },
  badminton: {
    titles: [
      "Super badmintonová hala", "Dobré kurty na badminton", null,
      "Příjemné místo na badminton", "Kvalitní zázemí",
    ],
    texts: [
      "Hala je prostorná a kurty mají výborný povrch. Osvětlení je rovnoměrné.",
      "Chodíme sem hrát badminton pravidelně. Cena je férová a vybavení v dobrém stavu.",
      "Příjemné prostředí pro badminton. Strop je dostatečně vysoký. Šatny čisté.",
      "Kvalitní badmintonové kurty s dobrým osvětlením. Parkování u haly je plus.",
      "Jsem spokojený. Kurty jsou vždy připravené a personál nápomocný.",
    ],
  },
  fitness: {
    titles: [
      "Skvělá posilovna", "Moderní fitness centrum", null,
      "Dobrý gym", "Kvalitní vybavení", "Super atmosféra",
    ],
    texts: [
      "Moderní vybavení a čisté prostory. Skupinové lekce jsou skvěle vedené.",
      "Chodím sem pravidelně a jsem spokojený/á. Stroje jsou nové a vždy funkční.",
      "Posilovna má všechno co potřebuju — kardio, silovou zónu i stretching area.",
      "Příjemný personál a čisté šatny. Vybavení je kvalitní. Otevírací doba by mohla být delší.",
      "Fitness centrum s dobrým poměrem cena/výkon. Trenéři jsou profesionální.",
      "Super gym! Ve špičce je tu víc lidí, ale jinak jsem nadšený/á.",
    ],
  },
  plavani: {
    titles: [
      "Čistý bazén", "Příjemný aquapark", "Dobrý bazén na plavání",
      null, "Super pro rodiny s dětmi",
    ],
    texts: [
      "Bazén je čistý a dobře udržovaný. Voda má příjemnou teplotu. Doporučuji.",
      "Chodíme sem s dětmi pravidelně. Dětský bazén je super, plavčíci dohlíží.",
      "Ideální na kondiční plavání. Dráhy jsou dostatečně dlouhé a voda čistá.",
      "Příjemný bazén s dobrým zázemím. Šatny a sprchy jsou čisté. Cena odpovídá.",
      "Super aquacentrum pro celou rodinu. Tobogány pro děti, plavecký bazén pro dospělé.",
    ],
  },
  volejbal: {
    titles: [
      "Skvělý beach volejbal", "Dobrá hala na volejbal", null,
      "Příjemné sportovní centrum",
    ],
    texts: [
      "Beachové kurty jsou v super stavu. Písek je čistý a pravidelně udržovaný.",
      "Hala je prostorná a vhodná pro volejbal. Sítě jsou kvalitní. Parkování ok.",
      "Chodíme sem hrát volejbal s partou každý týden. Rezervace funguje skvěle.",
      "Dobrá atmosféra a kvalitní zázemí. Pořádají i turnaje pro amatéry.",
    ],
  },
  golf: {
    titles: [
      "Krásné golfové hřiště", "Příjemný golfový areál", null,
      "Dobrý driving range", "Super pro začátečníky",
    ],
    texts: [
      "Hřiště je krásně udržované a v příjemném prostředí. Greeny jsou perfektní.",
      "Výborný areál pro golf. Cvičná louka je prostorná. Trenéři jsou profesionální.",
      "Chodíme sem pravidelně hrát golf. Areál je dobře dostupný a zázemí příjemné.",
      "Skvělé místo pro začátečníky i pokročilé. Golfová škola je kvalitní.",
      "Příjemný golfový klub s přátelskou atmosférou. Restaurace v klubovně je bonus.",
    ],
  },
  lezeni: {
    titles: [
      "Super stěna", "Výborná boulderovka", null,
      "Skvělé cesty pro všechny úrovně",
    ],
    texts: [
      "Stěna je pestrá a pravidelně přestavovaná. Atmosféra mezi lezci je přátelská.",
      "Boulderovka je skvělá — cesty od lehkých po těžké. Matrace jsou v dobrém stavu.",
      "Lezecká stěna s výbornou nabídkou cest. Trenéři jsou zkušení a nápomocní.",
      "Chodím sem boulderovat 3x týdně. Komunita je super a cesty se pravidelně mění.",
    ],
  },
  ferraty: {
    titles: [
      "Adrenalinový zážitek", "Super ferrata", null,
      "Doporučuji všem odvážným",
    ],
    texts: [
      "Výborná zajištěná cesta s krásnými výhledy. Jištění je v perfektním stavu.",
      "Ferrata je skvěle vyznačená a udržovaná. Vhodná i pro středně pokročilé.",
      "Adrenalinový zážitek s nádherným výhledem. Doporučuji jít brzy ráno, než je plno.",
      "Super ferrata pro rodiny. Děti od 12 let zvládnou bez problémů. Bezpečnostní prvky ok.",
    ],
  },
  default: {
    titles: [
      "Příjemné sportovní centrum", "Dobrý sportovní areál", null,
      "Doporučuji", "Super místo",
    ],
    texts: [
      "Příjemné prostředí a kvalitní zázemí. Personál je milý a nápomocný.",
      "Chodíme sem pravidelně a jsme spokojení. Čisto a dobře udržované.",
      "Dobrý poměr cena/výkon. Vybavení je v dobrém stavu. Doporučuji.",
      "Skvělé místo pro sportovní vyžití. Parkování je dostupné přímo u areálu.",
      "Příjemná atmosféra a čisté prostory. Otevírací doba vyhovuje.",
    ],
  },
};

// --- Utility functions ---
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUser(): { name: string; email: string; gender: "male" | "female" } {
  const gender = Math.random() < 0.5 ? "male" : "female";
  const first = pick(firstNames[gender]);
  const last = pick(lastNames[gender]);
  const name = `${first} ${last}`;

  // Generate email from name
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "");
  const emailBase = `${normalize(first)}.${normalize(last)}`;
  // Add random digits to avoid collisions
  const suffix = Math.floor(Math.random() * 99) + 1;
  const domain = pick(emailDomains);
  const email = `${emailBase}${suffix}@${domain}`;

  return { name, email, gender };
}

function generateRating(): number {
  // Distribution: 5★ 35%, 4★ 40%, 3★ 20%, 2★ 4%, 1★ 1%
  const r = Math.random();
  if (r < 0.01) return 1;
  if (r < 0.05) return 2;
  if (r < 0.25) return 3;
  if (r < 0.65) return 4;
  return 5;
}

function getTemplates(sportSlug: string) {
  return reviewTemplates[sportSlug] || reviewTemplates.default;
}

// --- Known seed emails from seed-reviews.ts (to mark as isSeed) ---
const legacySeedEmails = [
  "jana.novotna@seznam.cz", "tomas.dvorak@email.cz",
  "petra.svobodova@centrum.cz", "martin.cerny@gmail.com",
  "lucie.prochazkova@seznam.cz", "ondrej.vesely@email.cz",
  "katerina.horakova@gmail.com", "pavel.kucera@centrum.cz",
  "zuzana.markova@seznam.cz", "jakub.nemec@email.cz",
  "tereza.pokorna@gmail.com", "filip.kral@centrum.cz",
];

async function markExistingSeedUsers() {
  console.log("--- Marking existing seed users as isSeed=true ---");
  for (const email of legacySeedEmails) {
    try {
      await prisma.user.update({
        where: { email },
        data: { isSeed: true },
      });
      console.log(`  ✓ Marked: ${email}`);
    } catch {
      console.log(`  ⊘ Not found: ${email}`);
    }
  }
}

async function seedDailyReviews() {
  const NUM_USERS = 5;
  const MIN_REVIEWS = 1;
  const MAX_REVIEWS = 3;

  // Get all active facilities with their sports
  const facilities = await prisma.facility.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sports: { select: { sport: { select: { slug: true, name: true } } } },
      location: { select: { city: true } },
    },
  });

  if (facilities.length === 0) {
    console.log("No active facilities found.");
    return;
  }

  console.log(`Found ${facilities.length} active facilities.`);

  const affectedFacilities = new Set<string>();
  let totalReviews = 0;

  for (let i = 0; i < NUM_USERS; i++) {
    // Create user
    const userInfo = generateUser();

    // Check for email collision and regenerate if needed
    const existing = await prisma.user.findUnique({ where: { email: userInfo.email } });
    if (existing) {
      console.log(`  ⊘ Email collision: ${userInfo.email}, skipping user`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        passwordHash: crypto.randomBytes(32).toString("hex"),
        isSeed: true,
      },
    });
    console.log(`\n✓ Created user: ${userInfo.name} (${userInfo.email})`);

    // Determine how many reviews this user writes
    const numReviews = MIN_REVIEWS + Math.floor(Math.random() * (MAX_REVIEWS - MIN_REVIEWS + 1));

    // Pick random facilities (no duplicates per user)
    const shuffled = [...facilities].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numReviews);

    for (const facility of selected) {
      const sportSlug = facility.sports[0]?.sport.slug || "default";
      const templates = getTemplates(sportSlug);
      const rating = generateRating();
      const title = pick(templates.titles);
      const text = pick(templates.texts);

      // Randomize creation time within the past 1-7 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7));
      createdAt.setHours(
        7 + Math.floor(Math.random() * 15),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60),
      );

      await prisma.review.create({
        data: {
          facilityId: facility.id,
          userId: user.id,
          authorName: userInfo.name,
          authorEmail: userInfo.email,
          rating,
          title,
          text,
          isApproved: true,
          createdAt,
        },
      });

      affectedFacilities.add(facility.id);
      totalReviews++;
      console.log(
        `  ✓ Review: ${facility.name} (${facility.location.city}) ${rating}★ ${title || "(no title)"}`,
      );
    }
  }

  // Recalculate ratings for affected facilities
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
  }

  console.log(`\n✅ Done! Created ${NUM_USERS} users with ${totalReviews} reviews total.`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--mark-existing")) {
    await markExistingSeedUsers();
  }

  await seedDailyReviews();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
