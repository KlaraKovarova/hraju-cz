/**
 * Import indoor climbing walls across Czech Republic
 * Sources: lamaholds.cz, horydoly.cz, singingrock.cz
 * Run: npx tsx scripts/import-lezeni-cr.ts
 * SIL-436
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

interface ClimbingCenter {
  name: string;
  slug: string;
  address: string;
  postalCode?: string;
  city: string;
  region: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
}

const centers: ClimbingCenter[] = [
  // ===== PRAHA (additional, not in import-lezeni-praha.ts) =====
  {
    name: "Boulder Bar Holešovice (Jungle)",
    slug: "boulder-bar-holesovice",
    address: "U Výstaviště 11",
    postalCode: "170 00",
    city: "Praha 7",
    region: "Hlavní město Praha",
    lat: 50.1044,
    lng: 14.4253,
    website: "https://holesovice.jungle.cz/",
    description:
      "Jedna z nejznámějších boulderových stěn v Praze v areálu Holešovice.",
  },
  {
    name: "Lezecká stěna Gutovka",
    slug: "lezecka-stena-gutovka",
    address: "Gutova 39",
    postalCode: "100 00",
    city: "Praha 10",
    region: "Hlavní město Praha",
    lat: 50.0714,
    lng: 14.4702,
    website: "https://gutovka.cz/lezecka-stena/",
    description:
      "Lezecká stěna ve sportovním areálu Gutovka na Praze 10 s venkovní i vnitřní částí.",
  },
  {
    name: "Lokal Blok",
    slug: "lokal-blok-praha",
    address: "Náměstí 14. října 10",
    postalCode: "150 00",
    city: "Praha 5",
    region: "Hlavní město Praha",
    lat: 50.0718,
    lng: 14.4035,
    website: "https://www.lokalblok.cz/",
    description:
      "Boulderová hala s více než 500 m² lezeckých profilů a 55+ vyznačenými cestami různé obtížnosti.",
  },
  {
    name: "SC Palmovka",
    slug: "sc-palmovka-lezeni",
    address: "Na Žertvách 34",
    postalCode: "180 00",
    city: "Praha 8",
    region: "Hlavní město Praha",
    lat: 50.1013,
    lng: 14.4713,
    website: "https://www.scpalmovka.cz/",
    description: "Sportovní centrum s lezeckou stěnou a boulderem.",
  },
  {
    name: "UltraAnt lezecké centrum",
    slug: "ultraant-lezecke-centrum",
    address: "Týnská 21",
    postalCode: "110 00",
    city: "Praha 1",
    region: "Hlavní město Praha",
    lat: 50.088,
    lng: 14.4235,
    website: "https://ultraant.cz/",
    description:
      "Lezecké centrum v centru Prahy nabízející boulder a tréninkové kurzy.",
  },
  {
    name: "Boulder MyWay Čakovice",
    slug: "boulder-myway-cakovice",
    address: "Oderská 335",
    postalCode: "196 00",
    city: "Praha 9",
    region: "Hlavní město Praha",
    lat: 50.1553,
    lng: 14.4987,
    website: "https://lezeckastenacakovice.cz/",
    description: "Boulderová stěna na okraji Prahy v Čakovicích.",
  },
  {
    name: "Lezecké centrum Radotín",
    slug: "lezecke-centrum-radotin",
    address: "U Starého Stadionu 1585/4",
    postalCode: "153 00",
    city: "Praha 5",
    region: "Hlavní město Praha",
    lat: 49.9857,
    lng: 14.3558,
    website: "https://halaradotin.cz/",
    description:
      "Lezecké centrum v radotínské sportovní hale s lezeckými a boulderovými stěnami.",
  },
  {
    name: "Prostor Letňany",
    slug: "prostor-letnany",
    address: "Veselská 699",
    postalCode: "199 00",
    city: "Praha 9",
    region: "Hlavní město Praha",
    lat: 50.1289,
    lng: 14.5142,
    website: "https://prostorletnany.cz/",
    description: "Moderní lezecké centrum v Letňanech.",
  },
  {
    name: "Horolezecká stěna Cibulka",
    slug: "horolezecka-stena-cibulka",
    address: "Fabiánova 1134/20",
    postalCode: "150 00",
    city: "Praha 5",
    region: "Hlavní město Praha",
    lat: 50.0614,
    lng: 14.3614,
    website: "https://www.squashpark.cz/cs/sport/horolezecka-stena",
    description:
      "Horolezecká stěna ve Squash Parku Cibulka na Praze 5 s výškou až 11 m.",
  },
  {
    name: "Spin Climbing Praha",
    slug: "spin-climbing-praha",
    address: "Herrmannova 24",
    postalCode: "140 00",
    city: "Praha 4",
    region: "Hlavní město Praha",
    lat: 50.0492,
    lng: 14.4454,
    website: "https://spinclimbing.cz/",
    description: "Boulderový a tréninkový prostor na Praze 4.",
  },

  // ===== BRNO (additional, not in import-klajda-brno.ts / import-hangar-brno.ts) =====
  {
    name: "Flash Boulder Bar Brno",
    slug: "flash-boulder-bar-brno",
    address: "Jaroslava Foglara 3149/13",
    postalCode: "612 00",
    city: "Brno",
    region: "Jihomoravský kraj",
    lat: 49.2272,
    lng: 16.617,
    website: "http://flashbb.cz/",
    description:
      "Boulder bar v Brně s pravidelně přestavovanými boulderovými cestami.",
  },
  {
    name: "Horolezecká stěna Komec Brno",
    slug: "horolezecka-stena-komec-brno",
    address: "Kounicova 22",
    postalCode: "602 00",
    city: "Brno",
    region: "Jihomoravský kraj",
    lat: 49.2047,
    lng: 16.5918,
    website: "https://www.komec.cz/lezecka-stena/",
    description:
      "Lezecká stěna ve sportovním areálu Komec se stěnami pro lezení s lanem i bouldering.",
  },
  {
    name: "Hudy lezecká stěna Brno",
    slug: "hudy-lezecka-stena-brno",
    address: "Vídeňská 99",
    postalCode: "639 00",
    city: "Brno",
    region: "Jihomoravský kraj",
    lat: 49.1745,
    lng: 16.5967,
    website: "https://www.hudysteny.cz/brno/",
    description:
      "Lezecká stěna sítě HUDY v Brně s lezením s lanem i boulderem.",
  },
  {
    name: "Kotelna Boulder Brno",
    slug: "kotelna-boulder-brno",
    address: "Zábrdovická 10",
    postalCode: "615 00",
    city: "Brno",
    region: "Jihomoravský kraj",
    lat: 49.2048,
    lng: 16.6264,
    website: "https://kotelna-boulder8.webnode.cz/",
    description: "Boulderová stěna v brněnské Zábrdovicích.",
  },

  // ===== OSTRAVA =====
  {
    name: "Tendon Blok Ostrava",
    slug: "tendon-blok-ostrava",
    address: "Sady Jožky Jabůrkové",
    postalCode: "702 00",
    city: "Ostrava",
    region: "Moravskoslezský kraj",
    lat: 49.8378,
    lng: 18.2928,
    website: "https://blokcentrum.cz/",
    description:
      "Jedno z největších lezeckých center na severní Moravě, součást sítě Tendon s lezením i boulderem.",
  },
  {
    name: "Tendon Hlubina Ostrava",
    slug: "tendon-hlubina-ostrava",
    address: "Dolní oblast Vítkovice",
    postalCode: "703 00",
    city: "Ostrava",
    region: "Moravskoslezský kraj",
    lat: 49.8165,
    lng: 18.2774,
    website: "https://tendonhlubina.cz/",
    description:
      "Lezecké centrum v industriálním areálu Dolní oblasti Vítkovic.",
  },
  {
    name: "Horolezecká stěna Eliass Ostrava",
    slug: "horolezecka-stena-eliass-ostrava",
    address: "Hrušovská 2583/20",
    postalCode: "702 00",
    city: "Ostrava",
    region: "Moravskoslezský kraj",
    lat: 49.835,
    lng: 18.2683,
    website: "https://lezeckastena.alpsport.cz/",
    description: "Horolezecká stěna v Ostravě provozovaná společností Alpsport.",
  },
  {
    name: "Družba Boulder Ostrava",
    slug: "druzba-boulder-ostrava",
    address: "Žilinská 13",
    postalCode: "709 00",
    city: "Ostrava",
    region: "Moravskoslezský kraj",
    lat: 49.8203,
    lng: 18.1718,
    website: "https://www.facebook.com/Druzbaboulder/",
    description: "Boulderová stěna v Ostravě-Porubě.",
  },
  {
    name: "CDU Sport Ostrava-Výškovice",
    slug: "cdu-sport-ostrava-vyskovice",
    address: "Charvátská 10",
    postalCode: "700 30",
    city: "Ostrava",
    region: "Moravskoslezský kraj",
    lat: 49.7954,
    lng: 18.2198,
    website: "https://www.cdusport.cz/",
    description: "Lezecká stěna v Ostravě-Výškovicích.",
  },

  // ===== PLZEŇ =====
  {
    name: "Sport Centrum Koloseum Plzeň",
    slug: "sport-centrum-koloseum-plzen",
    address: "Sokolovská 74",
    postalCode: "323 00",
    city: "Plzeň",
    region: "Plzeňský kraj",
    lat: 49.7488,
    lng: 13.3694,
    website: "https://sport-plzen.cz/sluzby/horolezecka-stena-plzen",
    description:
      "Horolezecká stěna ve Sport Centru Koloseum v Plzni s výškou přes 10 m.",
  },
  {
    name: "Lezecká stěna Hannah Plzeň",
    slug: "lezecka-stena-hannah-plzen",
    address: "Úslavská 75",
    postalCode: "301 00",
    city: "Plzeň",
    region: "Plzeňský kraj",
    lat: 49.7269,
    lng: 13.3787,
    website: "https://www.tjloko-plzen.cz/cz/sportovni-areal/lezecka-stena/",
    description:
      "Městská sportovní hala v Plzni s lezeckou stěnou provozovanou TJ Lokomotiva.",
  },
  {
    name: "Škoda Sport Park – Lezecká věž Plzeň",
    slug: "skoda-sport-park-lezecka-vez-plzen",
    address: "Malostranská 2",
    postalCode: "301 00",
    city: "Plzeň",
    region: "Plzeňský kraj",
    lat: 49.7498,
    lng: 13.3535,
    website: "https://skodasportpark.cz/sportoviste/lezecka-vez/",
    description: "Venkovní lezecká věž ve Škoda Sport Parku v Plzni.",
  },

  // ===== LIBEREC =====
  {
    name: "Šutr Liberec",
    slug: "sutr-liberec",
    address: "Hrazená 470",
    postalCode: "460 01",
    city: "Liberec",
    region: "Liberecký kraj",
    lat: 50.7628,
    lng: 15.0565,
    website: "https://sutr.cz/",
    description:
      "Největší boulderové centrum v Liberci s moderními stěnami a kavárnou.",
  },
  {
    name: "Lezecká stěna Harcov Liberec",
    slug: "lezecka-stena-harcov-liberec",
    address: "Na Bohdalci 715",
    postalCode: "460 15",
    city: "Liberec",
    region: "Liberecký kraj",
    lat: 50.7567,
    lng: 15.0829,
    website: "https://ktv.fp.tul.cz/katedra/sportoviste",
    description:
      "Lezecká stěna TU Liberec v Harcově, přístupná i veřejnosti.",
  },

  // ===== OLOMOUC =====
  {
    name: "FLASH WALL Olomouc",
    slug: "flash-wall-olomouc",
    address: "U Panelárny 4",
    postalCode: "772 00",
    city: "Olomouc",
    region: "Olomoucký kraj",
    lat: 49.5852,
    lng: 17.2722,
    website: "http://flashwall.cz/",
    description:
      "Lezecké centrum v Olomouci s 1 200 m² lezecké plochy, výškou 13 m a 180 cestami od obtížnosti 3 do 8a.",
  },
  {
    name: "Lezecké centrum U Pajka Olomouc",
    slug: "lezecke-centrum-u-pajka-olomouc",
    address: "Karolíny Světlé 14",
    postalCode: "779 00",
    city: "Olomouc",
    region: "Olomoucký kraj",
    lat: 49.5953,
    lng: 17.2508,
    website: "https://www.pajkland.cz/",
    description:
      "Tradiční olomoucké lezecké centrum s lezením na laně i boulderem.",
  },

  // ===== HRADEC KRÁLOVÉ =====
  {
    name: "Lezecká stěna Hradec Králové",
    slug: "lezecka-stena-hradec-kralove",
    address: "Brněnská 302",
    postalCode: "500 06",
    city: "Hradec Králové",
    region: "Královéhradecký kraj",
    lat: 50.2049,
    lng: 15.8199,
    website: "https://www.stenahk.cz/",
    description:
      "Největší lezecká stěna v Hradci Králové se 600 m² pro lezení na laně a 200+ m² boulderingu.",
  },

  // ===== ČESKÉ BUDĚJOVICE =====
  {
    name: "Lezecká stěna Lanovka České Budějovice",
    slug: "lezecka-stena-lanovka-ceske-budejovice",
    address: "Lannova 2",
    postalCode: "370 01",
    city: "České Budějovice",
    region: "Jihočeský kraj",
    lat: 48.9756,
    lng: 14.4742,
    website: "https://www.stenalanovka.cz/",
    description: "Oblíbená lezecká stěna v centru Českých Budějovic.",
  },
  {
    name: "SKP Policie České Budějovice",
    slug: "skp-policie-ceske-budejovice",
    address: "Kubatova 25",
    postalCode: "370 04",
    city: "České Budějovice",
    region: "Jihočeský kraj",
    lat: 48.9693,
    lng: 14.4465,
    website: "https://vylezskp.cz/",
    description:
      "Lezecká stěna provozovaná SKP Policie v Českých Budějovicích.",
  },

  // ===== PARDUBICE =====
  {
    name: "Jungle Pardubice (4 Move)",
    slug: "jungle-pardubice-4-move",
    address: "Sladkovského 505",
    postalCode: "530 02",
    city: "Pardubice",
    region: "Pardubický kraj",
    lat: 50.0314,
    lng: 15.7681,
    website: "https://www.junglepardubice.cz/",
    description:
      "Největší lezecké centrum v Pardubicích s boulderem i lezením na laně.",
  },
  {
    name: "Boulder Bar Gekon Pardubice",
    slug: "boulder-bar-gekon-pardubice",
    address: "Sladkovského 505",
    postalCode: "530 02",
    city: "Pardubice",
    region: "Pardubický kraj",
    lat: 50.0314,
    lng: 15.7685,
    website: "http://www.gekon-boulderbar.cz/",
    description: "Boulderový bar v Pardubicích.",
  },
  {
    name: "H-centrum lezecká stěna",
    slug: "h-centrum-lezecka-stena-pardubice",
    address: "Staré Hradiště 197",
    postalCode: "533 52",
    city: "Pardubice",
    region: "Pardubický kraj",
    lat: 50.0644,
    lng: 15.7368,
    website: "https://hcentrum.net/lezecka-stena/",
    description: "Lezecká stěna v areálu H-centra u Pardubic.",
  },

  // ===== KARLOVY VARY =====
  {
    name: "Lezecká stěna Karlovy Vary",
    slug: "lezecka-stena-karlovy-vary",
    address: "Kapitána Jaroše 376",
    postalCode: "360 01",
    city: "Karlovy Vary",
    region: "Karlovarský kraj",
    lat: 50.2324,
    lng: 12.8589,
    website: "https://kvstena.cz/",
    description:
      "Lezecká stěna v Karlových Varech o ploše ~550 m², výšce 11 m a ~100 cestami.",
  },
  {
    name: "Crux Boulder Karlovy Vary",
    slug: "crux-boulder-karlovy-vary",
    address: "T.G. Masaryka 12",
    postalCode: "360 01",
    city: "Karlovy Vary",
    region: "Karlovarský kraj",
    lat: 50.2286,
    lng: 12.8714,
    website: "https://www.facebook.com/stenacrux/",
    description: "Boulderová stěna v centru Karlových Varů.",
  },

  // ===== KLADNO =====
  {
    name: "OUTDOORCENTRUM Kladno",
    slug: "outdoorcentrum-kladno",
    address: "Huťská",
    postalCode: "272 01",
    city: "Kladno",
    region: "Středočeský kraj",
    lat: 50.1437,
    lng: 14.1031,
    website: "https://www.stenakladno.cz/",
    description:
      "Lezecká stěna v Kladně s výškou až 18 m a cestami obtížnosti 3–9 UIAA, pravidelně přestavovanými.",
  },

  // ===== ÚSTÍ NAD LABEM =====
  {
    name: "Hudy Lezecká Stěna Ústí nad Labem",
    slug: "hudy-lezecka-stena-usti-nad-labem",
    address: "Pražská 21",
    postalCode: "400 01",
    city: "Ústí nad Labem",
    region: "Ústecký kraj",
    lat: 50.6611,
    lng: 14.0383,
    website: "https://www.hudysteny.cz/usti/",
    description:
      "Lezecká stěna sítě HUDY v Ústí nad Labem s lezením a boulderem.",
  },

  // ===== ZLÍN =====
  {
    name: "Lezecké centrum Vertikon Zlín",
    slug: "lezecke-centrum-vertikon-zlin",
    address: "K Pasekám 623",
    postalCode: "760 01",
    city: "Zlín",
    region: "Zlínský kraj",
    lat: 49.2189,
    lng: 17.6611,
    website: "https://www.vertikon.cz/",
    description:
      "Jedno z největších lezeckých center v ČR s 900 m² stěn v 15×18 m hale, výška 16 m.",
  },

  // ===== JIHLAVA =====
  {
    name: "Wall Street Tendon Jihlava",
    slug: "wall-street-tendon-jihlava",
    address: "Strojírenská 4/7",
    postalCode: "586 01",
    city: "Jihlava",
    region: "Kraj Vysočina",
    lat: 49.3932,
    lng: 15.5785,
    website: "http://www.lezecke-centrum-jihlava.cz/",
    description:
      "Lezecké centrum Tendon v Jihlavě s lezením na laně i boulderem.",
  },

  // ===== JABLONEC NAD NISOU =====
  {
    name: "Lezecká aréna Makakaréna Jablonec",
    slug: "lezecka-arena-makakarena-jablonec",
    address: "Liberecká 104",
    postalCode: "466 01",
    city: "Jablonec nad Nisou",
    region: "Liberecký kraj",
    lat: 50.7297,
    lng: 15.1531,
    website: "https://www.makakarena.cz/",
    description:
      "Lezecká aréna v Jablonci nad Nisou s širokou nabídkou lezeckých cest.",
  },

  // ===== FRÝDEK-MÍSTEK =====
  {
    name: "Horolezecká stěna Frýdek-Místek",
    slug: "horolezecka-stena-frydek-mistek",
    address: "Pionýrů 2069",
    postalCode: "738 01",
    city: "Frýdek-Místek",
    region: "Moravskoslezský kraj",
    lat: 49.6869,
    lng: 18.3469,
    website: "https://www.horolezeckastenafm.cz/",
    description:
      "Lezecká stěna ve Frýdku-Místku s lezením na laně a boulderem.",
  },

  // ===== OPAVA =====
  {
    name: "Atlas Opava – lezecká stěna",
    slug: "atlas-opava-lezecka-stena",
    address: "Purkyňova 12",
    postalCode: "746 01",
    city: "Opava",
    region: "Moravskoslezský kraj",
    lat: 49.9371,
    lng: 17.8973,
    website: "https://atlasopava.cz/",
    description: "Lezecká stěna v Opavě v rámci centra Atlas.",
  },

  // ===== HAVLÍČKŮV BROD =====
  {
    name: "Lezecká stěna Havlíčkův Brod",
    slug: "lezecka-stena-havlickuv-brod",
    address: "Wolkerova 2941",
    postalCode: "580 01",
    city: "Havlíčkův Brod",
    region: "Kraj Vysočina",
    lat: 49.6038,
    lng: 15.5701,
    website: "https://www.roadoutdoor.cz/lezecka-stena",
    description:
      "Lezecká stěna provozovaná Road Outdoor v Havlíčkově Brodě.",
  },

  // ===== JIČÍN =====
  {
    name: "Lezecká stěna Jičín",
    slug: "lezecka-stena-jicin",
    address: "Poděbradova 18",
    postalCode: "506 01",
    city: "Jičín",
    region: "Královéhradecký kraj",
    lat: 50.4378,
    lng: 15.3591,
    website: "https://www.lkp.cz/stena/informace/",
    description: "Lezecká stěna v Jičíně provozovaná LKP.",
  },

  // ===== PÍSEK =====
  {
    name: "LezeTop Písek",
    slug: "lezetop-pisek",
    address: "U Vodárny 1506",
    postalCode: "397 01",
    city: "Písek",
    region: "Jihočeský kraj",
    lat: 49.3132,
    lng: 14.1459,
    website: "https://www.stenapisek.cz/",
    description: "Lezecká stěna v Písku s cestami pro začátečníky i pokročilé.",
  },

  // ===== NOVÝ JIČÍN =====
  {
    name: "Boulder Bar Nový Jičín",
    slug: "boulder-bar-novy-jicin",
    address: "Mendelova střední škola",
    postalCode: "741 01",
    city: "Nový Jičín",
    region: "Moravskoslezský kraj",
    lat: 49.5946,
    lng: 18.0092,
    website: "https://www.facebook.com/BoulderBarNovyJicin/",
    description: "Boulderový bar v Novém Jičíně.",
  },

  // ===== LANŠKROUN =====
  {
    name: "Horolezecká stěna Lanškroun",
    slug: "horolezecka-stena-lanskroun",
    address: "Nám. A. Jiráska 139",
    postalCode: "563 01",
    city: "Lanškroun",
    region: "Pardubický kraj",
    lat: 49.9123,
    lng: 16.6117,
    website: "https://www.hkla.cz/stena/o-stene",
    description: "Horolezecká stěna v Lanškrouně.",
  },

  // ===== SVITAVY =====
  {
    name: "Lezecká stěna Svitavy",
    slug: "lezecka-stena-svitavy",
    address: "Pražská 2",
    postalCode: "568 02",
    city: "Svitavy",
    region: "Pardubický kraj",
    lat: 49.7551,
    lng: 16.4689,
    website: "https://www.sportes.svitavy.cz/cs/m-25-horolezecka-stena/",
    description: "Horolezecká stěna ve sportovním areálu Svitav.",
  },

  // ===== ŠUMPERK =====
  {
    name: "Horolezecká stěna Šumperk",
    slug: "horolezecka-stena-sumperk",
    address: "Jesenická",
    postalCode: "787 01",
    city: "Šumperk",
    region: "Olomoucký kraj",
    lat: 49.9678,
    lng: 16.9744,
    website: "https://stenaspk.cz/lezecka-stena/",
    description: "Lezecká stěna v Šumperku.",
  },

  // ===== TŘEBÍČ =====
  {
    name: "TJ Alpin Třebíč – lezecká stěna",
    slug: "tj-alpin-trebic-lezecka-stena",
    address: "Benešova 585",
    postalCode: "674 01",
    city: "Třebíč",
    region: "Kraj Vysočina",
    lat: 49.2177,
    lng: 15.8863,
    website: "https://www.tj-alpin.cz/",
    description:
      "Lezecká stěna provozovaná TJ Alpin v Třebíči s pravidelnými tréninky.",
  },

  // ===== TRUTNOV =====
  {
    name: "Lezecká stěna SVČ Trutnov",
    slug: "lezecka-stena-svc-trutnov",
    address: "Komenského 399",
    postalCode: "541 01",
    city: "Trutnov",
    region: "Královéhradecký kraj",
    lat: 50.5612,
    lng: 15.9143,
    website: "https://www.svctrutnov.cz/lezecka-stena-p111/",
    description: "Lezecká stěna ve Středisku volného času v Trutnově.",
  },

  // ===== VSETÍN =====
  {
    name: "Lezecká stěna Vsetín",
    slug: "lezecka-stena-vsetin",
    address: "Luh 1544",
    postalCode: "755 01",
    city: "Vsetín",
    region: "Zlínský kraj",
    lat: 49.3392,
    lng: 17.9919,
    website: "http://stenaluh.cz/",
    description: "Lezecká stěna na Vsetíně v areálu na Luhu.",
  },

  // ===== ROŽNOV POD RADHOŠTĚM =====
  {
    name: "Lezecká stěna Rožnov pod Radhoštěm",
    slug: "lezecka-stena-roznov-pod-radhostem",
    address: "5. května 1700",
    postalCode: "756 61",
    city: "Rožnov pod Radhoštěm",
    region: "Zlínský kraj",
    lat: 49.4581,
    lng: 18.1426,
    website:
      "https://www.facebook.com/HorolezeckaStenaRoznovPodRadhostem",
    description: "Horolezecká stěna v Rožnově pod Radhoštěm.",
  },

  // ===== ZNOJMO =====
  {
    name: "Boulder Bar Znojmo",
    slug: "boulder-bar-znojmo",
    address: "Husovy sady",
    postalCode: "669 02",
    city: "Znojmo",
    region: "Jihomoravský kraj",
    lat: 48.8564,
    lng: 16.0504,
    website: "https://www.facebook.com/HorolezeckaStenaZnojmo/",
    description: "Boulderový bar ve Znojmě.",
  },

  // ===== BŘECLAV =====
  {
    name: "Horolezecká stěna Břeclav",
    slug: "horolezecka-stena-breclav",
    address: "Veslařská 1",
    postalCode: "690 02",
    city: "Břeclav",
    region: "Jihomoravský kraj",
    lat: 48.7561,
    lng: 16.8854,
    website: "https://www.facebook.com/hkpalavskyvesak/",
    description:
      "Horolezecká stěna v Břeclavi provozovaná HK Pálavský Věšák.",
  },

  // ===== KUŘIM =====
  {
    name: "L.S.D. – Lezecká Stěna Dufek Kuřim",
    slug: "lsd-lezecka-stena-dufek-kurim",
    address: "Tyršova 480",
    postalCode: "664 34",
    city: "Kuřim",
    region: "Jihomoravský kraj",
    lat: 49.2994,
    lng: 16.5313,
    website: "https://www.lezeckastenakurim.cz/",
    description:
      "Lezecká stěna v Kuřimi u Brna s lezením na laně i boulderem.",
  },

  // ===== FRENŠTÁT POD RADHOŠTĚM =====
  {
    name: "Replay Boulder Frenštát",
    slug: "replay-boulder-frenstat",
    address: "Rožnovská 241",
    postalCode: "744 01",
    city: "Frenštát pod Radhoštěm",
    region: "Moravskoslezský kraj",
    lat: 49.5483,
    lng: 18.2111,
    website: "https://www.replaysc.cz/boulder-lezecka-stena-2/",
    description:
      "Boulderová stěna ve Frenštátu pod Radhoštěm v rámci Replay Sport Centra.",
  },

  // ===== ČERNOŽICE NAD LABEM =====
  {
    name: "Lezecká stěna Černožice",
    slug: "lezecka-stena-cernozice",
    address: "Generála Svobody 177",
    postalCode: "503 04",
    city: "Černožice nad Labem",
    region: "Královéhradecký kraj",
    lat: 50.3444,
    lng: 15.8386,
    website: "https://www.cernozice.cz/stena/",
    description: "Lezecká a bouldrová stěna v Černožicích nad Labem.",
  },

  // ===== ČESKÁ TŘEBOVÁ =====
  {
    name: "Lezecká stěna Česká Třebová",
    slug: "lezecka-stena-ceska-trebova",
    address: "Habrmanova 1500",
    postalCode: "560 02",
    city: "Česká Třebová",
    region: "Pardubický kraj",
    lat: 49.9017,
    lng: 16.4439,
    website:
      "https://www.horo-ct.cz/domains/horo-ct.cz/lezecka-stena/",
    description: "Lezecká stěna v České Třebové.",
  },

  // ===== DĚČÍN =====
  {
    name: "Lezecká stěna Bělá (Děčín)",
    slug: "lezecka-stena-bela-decin",
    address: "Tělocvičná 9",
    postalCode: "405 02",
    city: "Děčín",
    region: "Ústecký kraj",
    lat: 50.7718,
    lng: 14.2303,
    website:
      "https://lezeckastenabela.wixsite.com/lezeckastenabela/cs",
    description:
      "Lezecká stěna v Děčíně-Bělé, oblíbená díky blízkosti Labských pískovců.",
  },

  // ===== KOLÍN =====
  {
    name: "Lezecká stěna Kolín",
    slug: "lezecka-stena-kolin",
    address: "Pod Novým Mostem",
    postalCode: "280 02",
    city: "Kolín",
    region: "Středočeský kraj",
    lat: 50.0302,
    lng: 15.199,
    website: "https://hopsuk.cz/",
    description: "Lezecká stěna v Kolíně.",
  },

  // ===== KUTNÁ HORA =====
  {
    name: "Lezecká stěna Kutná Hora",
    slug: "lezecka-stena-kutna-hora",
    address: "Jaselská 932",
    postalCode: "284 01",
    city: "Kutná Hora",
    region: "Středočeský kraj",
    lat: 49.9528,
    lng: 15.2639,
    website: "https://stenakh.cz/",
    description: "Lezecká stěna v areálu gymnázia v Kutné Hoře.",
  },

  // ===== MEZIMĚSTÍ =====
  {
    name: "Walzel lezecká stěna Meziměstí",
    slug: "walzel-lezecka-stena-mezimesti",
    address: "Dlouhá 138",
    postalCode: "549 81",
    city: "Meziměstí",
    region: "Královéhradecký kraj",
    lat: 50.6246,
    lng: 16.2424,
    website: "https://www.walzel.cz/lezecka-stena",
    description: "Lezecká stěna v areálu Walzel v Meziměstí.",
  },

  // ===== MŠENO =====
  {
    name: "Lezecká stěna Mšeno",
    slug: "lezecka-stena-mseno",
    address: "Sokolovna",
    postalCode: "277 35",
    city: "Mšeno",
    region: "Středočeský kraj",
    lat: 50.4408,
    lng: 14.6327,
    website:
      "https://www.mestomseno.cz/zivot-ve-meste/sport/tj-sokol-mseno/lezecka-stena/",
    description:
      "Lezecká stěna ve Mšeně – vstupní brána do Kokořínského dolu.",
  },

  // ===== PŘEROV =====
  {
    name: "Base Camp Přerov",
    slug: "base-camp-prerov",
    address: "Kainarova 58",
    postalCode: "750 02",
    city: "Přerov",
    region: "Olomoucký kraj",
    lat: 49.4584,
    lng: 17.4566,
    website: "https://bcprerov.cz/",
    description: "Lezecké centrum Base Camp v Přerově.",
  },

  // ===== VRCHLABÍ =====
  {
    name: "Horolezecká stěna Mango Vrchlabí",
    slug: "horolezecka-stena-mango-vrchlabi",
    address: "Krkonošská 186",
    postalCode: "543 01",
    city: "Vrchlabí",
    region: "Královéhradecký kraj",
    lat: 50.627,
    lng: 15.6102,
    website: "https://www.facebook.com/lezeckastenaVrchlabi/",
    description: "Lezecká stěna Mango v Tyršově domě ve Vrchlabí.",
  },

  // ===== JESENÍK =====
  {
    name: "Lezecká stěna Jeseník",
    slug: "lezecka-stena-jesenik",
    address: "Komenského 281",
    postalCode: "790 01",
    city: "Jeseník",
    region: "Olomoucký kraj",
    lat: 50.2291,
    lng: 17.2064,
    website: "https://hojesenik.cz/cz/stena/",
    description:
      "Lezecká stěna v Jeseníku v areálu gymnázia, provozovaná horolezeckým oddílem.",
  },

  // ===== JIRKOV =====
  {
    name: "Lezecká Arena Jirkov",
    slug: "lezecka-arena-jirkov",
    address: "Ervěnická 1147",
    postalCode: "431 11",
    city: "Jirkov",
    region: "Ústecký kraj",
    lat: 50.4989,
    lng: 13.4372,
    website: "https://www.facebook.com/LezeckaArenaJirkov/",
    description: "Lezecká aréna v Jirkově nedaleko Chomutova.",
  },

  // ===== TÁBOR / SEZIMOVO ÚSTÍ =====
  {
    name: "Boulder Pentagon Tábor",
    slug: "boulder-pentagon-tabor",
    address: "Kpt. Jaroše 1290",
    postalCode: "390 03",
    city: "Tábor",
    region: "Jihočeský kraj",
    lat: 49.414,
    lng: 14.6579,
    website: "https://boulderpentagon.com/",
    description: "Boulderová stěna v Táboře.",
  },

  // ===== BYSTŘICE NAD PERNŠTEJNEM =====
  {
    name: "Lezecká stěna Bystřice nad Pernštejnem",
    slug: "lezecka-stena-bystrice-nad-pernstejnem",
    address: "Dr. Veselého 754",
    postalCode: "593 01",
    city: "Bystřice nad Pernštejnem",
    region: "Kraj Vysočina",
    lat: 49.5229,
    lng: 16.2594,
    website: "https://www.arealsportu.cz/sportovni-hala",
    description: "Lezecká stěna v Areálu sportu v Bystřici nad Pernštejnem.",
  },

  // ===== VELKÉ MEZIŘÍČÍ =====
  {
    name: "Lezu v Mezu Velké Meziříčí",
    slug: "lezu-v-mezu-velke-mezirici",
    address: "Sportovní 7",
    postalCode: "594 01",
    city: "Velké Meziříčí",
    region: "Kraj Vysočina",
    lat: 49.3555,
    lng: 16.0133,
    website: "https://www.facebook.com/lezuvmezu",
    description: "Lezecká stěna ve Velkém Meziříčí.",
  },

  // ===== POLIČKA =====
  {
    name: "Lezecká stěna Polička",
    slug: "lezecka-stena-policka",
    address: "Švermova 401",
    postalCode: "572 01",
    city: "Polička",
    region: "Pardubický kraj",
    lat: 49.7148,
    lng: 16.2645,
    website: "https://www.facebook.com/stenapolicka/",
    description: "Lezecká stěna v Poličce.",
  },

  // ===== ZUBŘÍ =====
  {
    name: "Lezecká stěna Zubří",
    slug: "lezecka-stena-zubri",
    address: "Převrátí 1009",
    postalCode: "756 54",
    city: "Zubří",
    region: "Zlínský kraj",
    lat: 49.4653,
    lng: 18.0896,
    website: "https://www.facebook.com/HorolezeckaStenaZubri/",
    description: "Lezecká stěna v Zubří u Rožnova pod Radhoštěm.",
  },
];

async function main() {
  // Find lezeni sport
  const sport = await prisma.sport.findUnique({ where: { slug: "lezeni" } });
  if (!sport) {
    console.error("Sport 'lezeni' not found in database. Run seed first.");
    process.exit(1);
  }
  console.log(`Found sport: ${sport.nameCs} (${sport.id})\n`);

  let added = 0;
  let skipped = 0;

  for (const c of centers) {
    // Check if already exists by slug
    const existing = await prisma.facility.findUnique({
      where: { slug: c.slug },
    });
    if (existing) {
      console.log(`SKIP: ${c.name} (slug already exists)`);
      skipped++;
      continue;
    }

    // Find or create location
    let location = await prisma.location.findFirst({
      where: { city: c.city, region: c.region },
    });
    if (!location) {
      location = await prisma.location.create({
        data: { city: c.city, region: c.region },
      });
      console.log(`  Created location: ${c.city}, ${c.region}`);
    }

    // Build contacts array
    const contacts: Array<{
      type: "PHONE" | "EMAIL" | "WEBSITE";
      value: string;
      isPrimary?: boolean;
    }> = [];
    if (c.phone) contacts.push({ type: "PHONE", value: c.phone, isPrimary: true });
    if (c.email) contacts.push({ type: "EMAIL", value: c.email });
    if (c.website) contacts.push({ type: "WEBSITE", value: c.website });

    // Create facility
    const facility = await prisma.facility.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        address: c.address,
        postalCode: c.postalCode,
        locationId: location.id,
        lat: c.lat,
        lng: c.lng,
        website: c.website,
        sports: {
          create: { sportId: sport.id },
        },
        contacts: {
          create: contacts,
        },
      },
    });

    console.log(`ADDED: ${c.name} → ${c.city} (${facility.id})`);
    added++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Added: ${added}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total in script: ${centers.length}`);
  console.log(`\nDone! Run 'npx tsx scripts/sync-export-active.ts' next.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
