/**
 * Seed 32 additional reviews: 15 ferraty + 17 lezení facilities.
 * Targets facilities with 0 reviews (new coverage) and adds 2nd reviews
 * to facilities that only have 1 review (for credibility).
 * All seed users are marked isSeed=true.
 *
 * Usage: npx tsx scripts/seed-reviews-batch3.ts
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

// --- 10 new seed reviewer personas ---
const reviewers = [
  { name: "Štěpán Kříž", email: "stepan.kriz72@seznam.cz" },
  { name: "Barbora Tomanová", email: "barbora.tomanova@email.cz" },
  { name: "Radek Sýkora", email: "radek.sykora31@gmail.com" },
  { name: "Simona Přibylová", email: "simona.pribylova@centrum.cz" },
  { name: "Jan Koutný", email: "jan.koutny88@post.cz" },
  { name: "Markéta Šimková", email: "marketa.simkova@volny.cz" },
  { name: "David Hrubý", email: "david.hruby44@seznam.cz" },
  { name: "Nikola Zemanová", email: "nikola.zemanova@email.cz" },
  { name: "Vojtěch Bartoš", email: "vojtech.bartos56@gmail.com" },
  { name: "Klára Valentová", email: "klara.valentova@centrum.cz" },
];

// --- Reviews: [facilitySlug, reviewerIndex, rating, title, text, daysAgo, includeVisit, visitNote?] ---
type ReviewTuple = [string, number, number, string | null, string, number, boolean, string?];

const seedReviews: ReviewTuple[] = [
  // ============================================================
  // FERRATY (15 reviews)
  // ============================================================

  // === FERRATA KOLEM JALOVCE (Děčín) — 0 reviews ===
  [
    "ferrata-kolem-jalovce-decin", 0, 4,
    "Krásný okruh nad Děčínem",
    "Ferrata Kolem Jalovce je příjemný okruh s výhledy na labské údolí. Obtížnost A/B, takže zvládnou i rodiny s většími dětmi. Trasa vede po pískovcových skalách, místy po žebřících. Celý okruh nám trval asi 2 hodiny. Nástup je dobře značený od parkoviště. Pěkné doplnění k Pastýřské stěně nebo Poustevně.",
    25, true, "Výlet s rodinou — super!",
  ],

  // === FERRATY U HRADU BLANSKO (Ústí) — 0 reviews ===
  [
    "ferraty-u-hradu-blansko-usti", 1, 4,
    "Překvapivě dobrá ferrata v Ústí",
    "Ferraty u Hradu Blansko jsou dvě krátké trasy obtížnosti B a C na rulových skalách. Jištění v dobrém stavu, celé to zvládnete za hodinu. Hezké výhledy na Ústí a okolí. Kombinace se zříceninou hradu dává tomu historický rozměr. Přístup z Vaňova po žluté značce, asi 15 minut do kopce.",
    42, false,
  ],

  // === HAUBERG (Kraslice) — 0 reviews ===
  [
    "hauberg-kraslice", 2, 3,
    "Menší ferrata na Karlovarsku",
    "Hauberg je kratší ferrata na žulových skalách u Kraslic. Obtížnost B, délka asi 60 metrů. Pro zkušenějšího lezce je to rychle hotové, ale na odpoledne s dětmi (10+) je to akorát. Jištění je v pořádku, skála místy kluzká po dešti. V okolí není moc dalších ferrat, takže pro Karlovarsko je to cenná atrakce.",
    58, false,
  ],

  // === LUŽICKÁ SPOJKA (Vanov) — 0 reviews ===
  [
    "luzicka-spojka-vanov", 3, 5,
    "Pecka! Jedna z nejtěžších ferrat v ČR",
    "Lužická spojka je opravdu náročná — obtížnost D, kolmé úseky, převisy. Délka asi 100 metrů, ale každý metr je výzva. Perfektní pro zkušené ferratisty, kteří hledají adrenalin. Skála je pískovcová, pevná. Nástup z Vanova, musíte mít kompletní ferratový set. Rozhodně ne pro začátečníky. My jsme na ní strávili přes hodinu.",
    15, true, "Konečně pořádná výzva!",
  ],

  // === MINIFERRATA VINAŘSKÁ (Ústí nad Labem) — 0 reviews ===
  [
    "miniferrata-vinarska-usti-nad-labem", 4, 3,
    null,
    "Jak název napovídá — je to mini. Obtížnost A/B, délka asi 30 metrů. Pro úplné začátečníky nebo jako první zkušenost s ferratou je to v pořádku. Poloha v centru Ústí je výhoda — můžete to stihnout na odpolední procházce. Výhledy na Labe jsou hezké. Jištění funkční, ale jednoduché.",
    33, false,
  ],

  // === UCHEM JEHLY (Česká Kamenice) — 0 reviews ===
  [
    "uchem-jehly-ceska-kamenice", 5, 5,
    "Unikátní ferrata skrz skalní bránu",
    "Uchem Jehly je naprosto unikátní! Trasa prochází skalní bránou — nikde jinde v ČR nic takového nemáte. Obtížnost C, délka asi 80 metrů. Pískovcová skála, zajímavé skální útvary kolem. České Švýcarsko má spoustu krásných míst, ale tohle je něco extra. Přístup z České Kamenice, značení na začátku trochu nejasné.",
    20, true, "Nádherný zážitek ve skalách",
  ],

  // === VÁCLAVSKÉ SKÁLY (Písek) — 0 reviews ===
  [
    "vaclavske-skaly-pisek", 6, 4,
    "Ferrata v jižních Čechách — příjemné překvapení",
    "Nevěděl jsem, že i u Písku je ferrata. Václavské skály jsou příjemná trasa obtížnosti B/C na žulovém lomu. Výhledy na okolní krajinu a řeku Otavu. Délka asi 70 metrů, stihnete za půl hodiny. Jištění je nové a v perfektním stavu. Parkování přímo u lomu. Doporučuji spojit s návštěvou Písku.",
    47, false,
  ],

  // === JEZERNÍ STĚNA (Vír) — 1 review, adding 2nd ===
  [
    "jezerni-stena-vir", 7, 5,
    "Královská ferrata Vysočiny",
    "Jezerní stěna je pro mě nejlepší ferrata v ČR mimo Děčín. Obtížnost C/D, 120 metrů nad přehradou. Ten pocit, když visíte nad hladinou, je nepopsatelný. Technicky náročné úseky, dobré jištění. Doporučuji jít brzy ráno, než se tvoří fronty. Po ferratě koupání v přehradě — dokonalý den. Parkování u hráze.",
    12, true, "Absolutní TOP!",
  ],

  // === FERRATY NOVÉ HAMRY — 1 review, adding 2nd ===
  [
    "ferraty-nove-hamry", 8, 4,
    "Příjemné ferraty v Krušných horách",
    "U Nových Hamrů jsou dvě trasy — lehčí A/B a těžší C. Na Krušnohorsko jsou to jedny z mála ferrat a stojí za výlet. Skála je žulová, prostředí v lese je příjemné. Celé to stihnete za 2 hodiny včetně obou tras. Jištění v pořádku. Z Karlových Varů to je asi 40 minut autem.",
    36, false,
  ],

  // === FERRATA HNĚVÍN (Most) — 1 review, adding 2nd ===
  [
    "ferrata-hnevin-most", 9, 3,
    "Městská ferrata na hradě",
    "Ferrata na hradě Hněvín je krátká, ale originální — lezete po hradních zdech s výhledy na Most a jezero. Obtížnost B, délka asi 40 metrů. Pro historické nadšence je to zajímavá kombinace sportu a památky. Výhodou je snadná dostupnost přímo z města. Jištění je funkční, skála (zdivo) je specifická.",
    50, false,
  ],

  // === BIOFERRATA BEČOV — 1 review, adding 2nd ===
  [
    "bioferrata-becov-nad-teplou", 0, 4,
    "Originální koncept v krásném prostředí",
    "Bioferrata u Bečova je unikátní — trasa vede přes stromy, po lanech a dřevěných plošinách. Obtížnost B, zážitek spíš než sport. Prostředí u hradu Bečov je nádherné. S dětmi od 8 let to zvládnete bez problémů. Rezervace je nutná, protože kapacita je omezená. Kombinace s prohlídkou hradu — celý den je vyplněný.",
    28, true, "S dětmi — skvělý výlet!",
  ],

  // === FERATA HLUBOKÁ — 1 review, adding 2nd ===
  [
    "ferata-hluboka-nad-vltavou", 1, 4,
    null,
    "Ferrata u Hluboké nad Vltavou je krátká trasa obtížnosti A/B. Vede po skalách nad Vltavou s hezkými výhledy na zámek. Pro začátečníky a rodiny ideální — není to náročné a trvá asi 30 minut. Jištění je v pořádku. Přístup ze zámeckého parku. Po ferratě jsme zašli na oběd do Hluboké — hezký den.",
    63, false,
  ],

  // === SLÁNSKÁ HORA — 1 review, adding 2nd ===
  [
    "slanska-hora-slany", 2, 4,
    "Ferrata na kopci přímo ve městě",
    "Slánská Hora je unikátní tím, že je přímo ve Slaném — žádné cestování do hor. Obtížnost B, krátká trasa na čedičových skalách. Výhledy na město a okolní rovinu. Pro Středočechy je to nejbližší ferrata k Praze (kromě via ferrat v lomech). Jištění OK, skála je zajímavá.",
    41, false,
  ],

  // === VIA FERRATA BEDUÍN (Stříbrná) — 1 review, adding 2nd ===
  [
    "via-ferrata-beduin-stribrna", 3, 5,
    "Krušnohorský klenot",
    "Beduín u Stříbrné mě naprosto nadchl. Obtížnost C/D, trasa je technicky pestrá — traverzy, kolmé stěny, lehký převis. Žulová skála má skvělou strukturu pro lezení. Prostředí v Krušných horách je klidné a malebné. Jištění je nové, zřejmě nedávno přejištěné. Srdečně doporučuji zkušeným ferratistům!",
    8, true, "Jedna z nejlepších!",
  ],

  // === VODNÍ BRÁNA (Semily) — 1 review, adding 2nd ===
  [
    "vodni-brana-semily", 4, 4,
    "Ferrata nad řekou Jizerou",
    "Vodní Brána je pěkná ferrata obtížnosti B/C na pískovcových skalách nad Jizerou. Délka asi 90 metrů, výhledy na řeku a okolní kopce. Nástup je z centra Semil, takže žádné komplikované hledání. Trasa je pestrá — mix vodorovných traversů a kolmých úseků. Po ferratě jsme šli na pivo do centra.",
    30, false,
  ],

  // ============================================================
  // LEZENÍ (17 reviews)
  // ============================================================

  // === HANGAR OSTRAVA — 0 reviews ===
  [
    "hangar-ostrava-climbing-playground", 5, 5,
    "Adam Ondra kvalita přišla do Ostravy",
    "Hangar Ostrava je nová boulderovka od Adama Ondry a kvalita je na úrovni brněnského originálu. 1 000+ m² plochy, moderní chyty, kreativní cesty od V0 po V8+. Přestavba každý týden v některém sektoru. Kavárna, sprchy, šatny — vše špičkové. Parkování v areálu zdarma. Pro Ostravu je to revoluce.",
    10, true, "Ostrava má konečně TOP boulderovku",
  ],

  // === BASECAMP BOULDER BRNO — 0 reviews ===
  [
    "basecamp-boulder-brno", 6, 4,
    "Útulná alternativa k Hangaru",
    "Basecamp je menší boulderovka, ale má svůj charakter. Klidnější atmosféra než v Hangaru, méně lidí a nižší cena. Cesty jsou kvalitně nastavené, přestavba pravidelná. Pro ty, kdo nechtějí závodit o místo na stěně, je to ideální volba. Malá kavárna s dobrým kafem. Parkování v okolních ulicích.",
    35, false,
  ],

  // === BOULDER BAR ZNOJMO — 0 reviews ===
  [
    "boulder-bar-znojmo", 7, 4,
    "Konečně bouldering i na jižní Moravě",
    "Znojmo má boulderovku a je to dobře! Menší prostor, ale kvalitně vybavený. Cesty od V0 po V6, pravidelně obměňované. Pro začátečníky mají kurzy. Atmosféra je komunitní — všichni se znají. Po lezení víno z místních vinařství. Cena je příznivá. Doporučuji všem jihomoravanům.",
    22, true, "Víno + boulder = perfektní combo",
  ],

  // === JUNGLE SPORT PARK LETŇANY — 0 reviews ===
  [
    "jungle-sport-park-letnany", 8, 4,
    "Obrovský sportovní park",
    "Jungle Letňany je velký sportovní areál s lezeckou stěnou i boulderovkou. Stěna na laně má výšku 14 metrů, boulderovací část je prostorná. Vhodné pro rodiny — zatímco jeden leze, ostatní si mohou zahrát třeba trampolíny nebo paintball. Parkování zdarma. Vstupné je rozumné. O víkendech bývá víc lidí.",
    44, false,
  ],

  // === LEZECKÁ STĚNA GUTOVKA — 0 reviews ===
  [
    "lezecka-stena-gutovka", 9, 3,
    "Venkovní stěna v Praze — sezónní záležitost",
    "Gutovka je venkovní lezecká stěna v Praze 10. Otevřená od jara do podzimu. Výška asi 8 metrů, cesty jsou jednodušší — vhodné pro začátečníky a rodiny. Výhoda je poloha v parku — příjemné prostředí a zdarma. Nevýhoda — jen za hezkého počasí. Cesty se během sezóny moc nemění.",
    55, false,
  ],

  // === HOROLEZECKÁ STĚNA FRÝDEK-MÍSTEK — 0 reviews ===
  [
    "horolezecka-stena-frydek-mistek", 0, 4,
    "Solidní stěna pro Frýdecko-Místecko",
    "Stěna ve Frýdku-Místku je příjemným překvapením. Výška 12 metrů, cesty od začátečnických po pokročilé. Provozuje ji místní horolezecký oddíl, takže atmosféra je přátelská a autentická. Ceny jsou velmi příznivé — asi poloviční oproti komerčním stěnám. Menší boulderovací kout. Parkování před halou.",
    48, false,
  ],

  // === LEZETOP PÍSEK — 0 reviews ===
  [
    "lezetop-pisek", 1, 4,
    "Skvělá stěna pro jižní Čechy",
    "LezeTop v Písku je moderní lezecké centrum s výškou 10 metrů a boulderovací částí. Pro jihočeský region je to jedna z nejlepších hal. Cesty jsou pravidelně přestavované, obtížnost od 4a po 7a. Půjčovna vybavení přímo na místě. Personál je ochotný a pro začátečníky nabízejí úvodní lekce.",
    38, true, "Nečekala jsem takovou kvalitu v Písku",
  ],

  // === V16 LEZECKÉ CENTRUM PLZEŇ — 0 reviews ===
  [
    "v16-lezecke-centrum-plzen", 2, 5,
    "Moderní boulderovka v Plzni",
    "V16 je nová boulderovka v Plzni a je fantastická. Moderní prostor, kvalitní chyty, kreativní nastavování cest. Obtížnost od V0 po V9+. Pro plzeňské lezce je to skvělý doplněk ke stěně Hannah. Kavárna s výhledem na stěnu, velké šatny. Vstupné 200 Kč za celý den — férová cena za tuto kvalitu.",
    16, true, "Plzeň bouldering level up!",
  ],

  // === LEZECKÁ STĚNA JESENÍK — 0 reviews ===
  [
    "lezecka-stena-jesenik", 3, 3,
    "Menší stěna, ale pro Jesenicko důležitá",
    "Stěna v Jeseníku je menší — výška asi 8 metrů, kolem 20 cest. Pro místní lezce je to ale důležité zázemí, zvlášť v zimě. Cesty jsou udržované, obtížnost od začátečnických po středně těžké. Vybavení k zapůjčení. Atmosféra je komunitní, místní lezci se tu pravidelně scházejí. Cena přijatelná.",
    60, false,
  ],

  // === BOULDER POINT LIBEREC — 0 reviews ===
  [
    "boulder-point-liberec", 4, 4,
    "Příjemná alternativa k Šutru",
    "Boulder Point je menší boulderovka v Liberci, ale má své kouzlo. Méně lidí než v Šutru, klidnější atmosféra. Cesty jsou kvalitně nastavené, přestavba pravidelná. Pro ty, kdo preferují menší prostory a méně hluku, je to skvělá volba. Ceny jsou o něco nižší než v Šutru. Personál je vstřícný.",
    29, false,
  ],

  // === HUDY LEZECKÁ STĚNA BRNO — 0 reviews ===
  [
    "hudy-lezecka-stena-brno", 5, 4,
    "Hudy kvalita v Brně",
    "Hudy stěna v Brně je solidní volba pro lezení na laně. Výška 12 metrů, cesty jsou dobře udržované a pravidelně přestavované. Součástí je i malá boulderovací část. Výhoda je prodejní vybavení přímo na místě — potřebujete nové karabiny nebo sedák? Koupíte hned. Parkování v okolí je trochu komplikovanější.",
    43, false,
  ],

  // === HUDY LEZECKÁ STĚNA ÚSTÍ NAD LABEM — 0 reviews ===
  [
    "hudy-lezecka-stena-usti-nad-labem", 6, 4,
    "Hlavní stěna pro Ústecko",
    "Hudy stěna v Ústí je hlavní indoor lezecký prostor pro celý Ústecký kraj. Výška 11 metrů, asi 50 cest od 4a po 7c. Boulderovací část je menší, ale funkční. V zimě je tu vždy plno — v létě se všichni přesunou na venkovní skály. Půjčovna, kurzy pro začátečníky. Prodejna Hudy přímo v areálu.",
    51, false,
  ],

  // === LEZECKÁ STĚNA HAVLÍČKŮV BROD — 0 reviews ===
  [
    "lezecka-stena-havlickuv-brod", 7, 3,
    null,
    "Stěna v Havlíčkově Brodě je menší, ale udržovaná. Výška kolem 8 metrů, cesty se obměňují. Pro Vysočinu je to cenné zázemí. Provozuje místní oddíl — atmosféra je přátelská. Ceny jsou nízké. Vhodné hlavně pro začátečníky a mládežnický trénink. Pro pokročilé lezce je to spíš tréninkové místo.",
    66, false,
  ],

  // === HUDY BOULDER KARLÍN — 1 review, adding 2nd ===
  [
    "hudy-boulder-karlin", 8, 5,
    "Nejlepší boulderovka v centru Prahy",
    "Hudy Karlín je pro mě číslo jedna v Praze. Prostorná boulderovka, moderní chyty, skvělé nastavování cest. Cesty od V0 po V8+, takže si přijde na své začátečník i závodník. Poloha v Karlíně je výborná — metro Křižíkova 3 minuty. Kavárna, sprchy, velké šatny. Vstupné je v pražském standardu.",
    18, true, "Karlín = pražský boulder hub",
  ],

  // === LEZECKÁ STĚNA BIG WALL — 1 review, adding 2nd ===
  [
    "lezecka-stena-big-wall", 9, 4,
    "Velká stěna, velký zážitek",
    "Big Wall je jedna z největších lezeckých stěn v Praze. Výška přes 15 metrů, široká nabídka cest pro všechny úrovně. Boulderovací část je oddělená a prostorná. Půjčovna vybavení, kurzy pro začátečníky, tréninkové programy. Atmosféra je přátelská. Parkování je trochu oříšek, ale MHD je výborná alternativa.",
    39, false,
  ],

  // === LEZECKÉ CENTRUM MAMMUT — 0 reviews ===
  [
    "lezecke-centrum-mammut", 0, 5,
    "Prémiová kvalita značky Mammut",
    "Mammut centrum je špičkové zařízení. Vysoká stěna (16 m), boulderovací hala, tréninkový prostor s campus boardem. Vše nese punc kvality značky Mammut. Cesty jsou nastavené profesionálně, přestavba pravidelná. Vstupné je vyšší, ale odpovídá kvalitě. Šatny, sprchy, obchod s vybavením — kompletní servis.",
    24, true, "Mamutí kvalita!",
  ],

  // === LEZECKÉ CENTRUM U PAJKA OLOMOUC — 0 reviews ===
  [
    "lezecke-centrum-u-pajka-olomouc", 1, 4,
    "Pajk = olomoucká klasika",
    "U Pajka je lezecká stálice Olomouce. Stěna výšky 12 metrů, cesty od začátečnických po pokročilé. Menší než Flash Wall, ale má osobnější atmosféru a nižší ceny. Provozuje to místní lezecký oddíl — znalosti a nadšení jsou vidět. Boulderovací kout pro zahřátí. Parking před halou bez problémů.",
    45, false,
  ],
];

async function main() {
  console.log("Seeding 32 additional reviews (15 ferraty + 17 lezení) — batch 3...\n");

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

  // 2. Create reviewer accounts (isSeed=true)
  console.log("\n--- Creating reviewer accounts ---");
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

  // 3. Insert reviews (and optional visits)
  console.log("\n--- Inserting reviews ---");
  const affectedFacilities = new Set<string>();
  let inserted = 0;
  let skipped = 0;
  let notFound = 0;
  let visitsCreated = 0;

  for (const [slug, reviewerIdx, rating, title, text, daysAgo, includeVisit, visitNote] of seedReviews) {
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

    // Create Visit (check-in) if requested
    if (includeVisit) {
      const existingVisit = await prisma.visit.findUnique({
        where: { userId_facilityId: { userId, facilityId } },
      });
      if (!existingVisit) {
        const visitDate = new Date(createdAt);
        visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 3));

        await prisma.visit.create({
          data: {
            userId,
            facilityId,
            note: visitNote || null,
            createdAt: visitDate,
          },
        });
        visitsCreated++;
        console.log(`  📍 Check-in: ${reviewer.name} → ${slug}`);
      }
    }

    affectedFacilities.add(facilityId);
    inserted++;
    console.log(`  ✓ ${reviewer.name} → ${slug} (${rating}★) ${title || "(no title)"}`);
  }

  console.log(`\nInserted: ${inserted}, Skipped: ${skipped}, Not found: ${notFound}, Visits: ${visitsCreated}`);

  // 4. Recalculate averageRating and reviewCount
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

  console.log(`\n✅ Done! ${inserted} reviews seeded (${visitsCreated} with check-ins).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
