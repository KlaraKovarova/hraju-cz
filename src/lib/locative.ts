/**
 * Czech locative case (6. pád / lokál) for city names.
 * Used after prepositions "v" / "ve" (in).
 *
 * Maps nominative → locative form.
 * Falls back to nominative for unknown cities.
 */

const LOCATIVE_MAP: Record<string, string> = {
  // === Top cities by facility count ===
  "Praha": "Praze",
  "Brno": "Brně",
  "Ostrava": "Ostravě",
  "Plzeň": "Plzni",
  "Olomouc": "Olomouci",
  "Hradec Králové": "Hradci Králové",
  "Pardubice": "Pardubicích",
  "Zlín": "Zlíně",
  "Frýdek-Místek": "Frýdku-Místku",
  "Havířov": "Havířově",
  "Kladno": "Kladně",
  "Karlovy Vary": "Karlových Varech",
  "Opava": "Opavě",
  "Ústí nad Labem": "Ústí nad Labem",
  "Most": "Mostě",
  "Tábor": "Táboře",
  "Teplice": "Teplicích",
  "Jihlava": "Jihlavě",
  "Karviná": "Karviné",
  "Česká Lípa": "České Lípě",
  "Třinec": "Třinci",
  "Písek": "Písku",
  "Prostějov": "Prostějově",
  "Chomutov": "Chomutově",
  "Hodonín": "Hodoníně",
  "Krnov": "Krnově",
  "Třebíč": "Třebíči",
  "Jablonec nad Nisou": "Jablonci nad Nisou",
  "Trutnov": "Trutnově",
  "České Budějovice": "Českých Budějovicích",
  "Znojmo": "Znojmě",
  "Kroměříž": "Kroměříži",
  "Liberec": "Liberci",
  "Havlíčkův Brod": "Havlíčkově Brodě",
  "Svitavy": "Svitavách",
  "Bohumín": "Bohumíně",
  "Benešov": "Benešově",
  "Mariánské Lázně": "Mariánských Lázních",
  "Mělník": "Mělníku",
  "Orlová": "Orlové",
  "Říčany": "Říčanech",
  "Břeclav": "Břeclavi",
  "Šumperk": "Šumperku",
  "Uherské Hradiště": "Uherském Hradišti",
  "Cheb": "Chebu",
  "Lysá nad Labem": "Lysé nad Labem",
  "Sokolov": "Sokolově",
  "Pelhřimov": "Pelhřimově",
  "Rožnov pod Radhoštěm": "Rožnově pod Radhoštěm",
  "Valašské Meziříčí": "Valašském Meziříčí",
  "Vrchlabí": "Vrchlabí",
  "Turnov": "Turnově",
  "Vsetín": "Vsetíně",
  "Nový Jičín": "Novém Jičíně",
  "Nymburk": "Nymburce",
  "Kralupy nad Vltavou": "Kralupech nad Vltavou",
  "Žatec": "Žatci",
  "Litoměřice": "Litoměřicích",
  "Žamberk": "Žamberku",
  "Ústí nad Orlicí": "Ústí nad Orlicí",
  "Blansko": "Blansku",
  "Kopřivnice": "Kopřivnici",
  "Lanškroun": "Lanškrouně",
  "Vysoké Mýto": "Vysokém Mýtě",
  "Rokycany": "Rokycanech",
  "Slaný": "Slaném",
  "Mladá Boleslav": "Mladé Boleslavi",
  "Kolín": "Kolíně",
  "Litvínov": "Litvínově",
  "Louny": "Lounech",
  "Jindřichův Hradec": "Jindřichově Hradci",
  "Žďár nad Sázavou": "Žďáru nad Sázavou",
  "Český Těšín": "Českém Těšíně",
  "Jeseník": "Jeseníku",
  "Rychnov nad Kněžnou": "Rychnově nad Kněžnou",
  "Otrokovice": "Otrokovicích",
  "Jičín": "Jičíně",
  "Frenštát pod Radhoštěm": "Frenštátě pod Radhoštěm",
  "Slavkov u Brna": "Slavkově u Brna",
  "Bruntál": "Bruntále",
  "Vyškov": "Vyškově",
  "Staré Město": "Starém Městě",
  "Klášterec nad Ohří": "Klášterci nad Ohří",
  "Dvůr Králové nad Labem": "Dvoře Králové nad Labem",
  "Mohelnice": "Mohelnici",
  "Šlapanice": "Šlapanicích",
  "Neratovice": "Neratovicích",
  "Uherský Brod": "Uherském Brodě",
  "Varnsdorf": "Varnsdorfu",
  "Vlašim": "Vlašimi",
  "Bílina": "Bílině",
  "Doksy": "Doksech",
  "Jesenice": "Jesenici",
  "Nové Město na Moravě": "Novém Městě na Moravě",
  "Kyjov": "Kyjově",
  "Nová Paka": "Nové Pace",
  "Veselí nad Moravou": "Veselí nad Moravou",
  "Tachov": "Tachově",
  "Chodov": "Chodově",
  "Čeladná": "Čeladné",
  "Sedlčany": "Sedlčanech",
  "Lipno nad Vltavou": "Lipně nad Vltavou",
  "Horažďovice": "Horažďovicích",
  "Mikulov": "Mikulově",
  "Uničov": "Uničově",
  "Lovosice": "Lovosicích",
  "Jilemnice": "Jilemnici",
  "Jaroměř": "Jaroměři",
  "Luhačovice": "Luhačovicích",
  "Boskovice": "Boskovicích",
  "Litovel": "Litovli",
  "Mníšek pod Brdy": "Mníšku pod Brdy",
  "Frýdlant nad Ostravicí": "Frýdlantu nad Ostravicí",
  "Hlinsko": "Hlinsku",
  "Kuřim": "Kuřimi",
  "Špindlerův Mlýn": "Špindlerově Mlýně",
  "Tišnov": "Tišnově",
  "Velké Meziříčí": "Velkém Meziříčí",
  "Aš": "Aši",
  "Hustopeče": "Hustopečích",
  "Domažlice": "Domažlicích",
  "Šternberk": "Šternberku",
  "Rosice": "Rosicích",
  "Hořice": "Hořicích",
  "Nový Bor": "Novém Boru",
  "Holešov": "Holešově",
  "Sezimovo Ústí": "Sezimově Ústí",
  "Roztoky": "Roztokách",
  "Moravské Budějovice": "Moravských Budějovicích",
  "Studénka": "Studénce",
  "Český Krumlov": "Českém Krumlově",
  "Česká Třebová": "České Třebové",
  "Kutná Hora": "Kutné Hoře",
  "Kadaň": "Kadani",
  "Dobruška": "Dobrušce",
  "Harrachov": "Harrachově",
  "Čelákovice": "Čelákovicích",
  "Březnice": "Březnici",
  "Dobříš": "Dobříši",
  "Humpolec": "Humpolci",
  "Semily": "Semilech",
  "Hlučín": "Hlučíně",
  "Roudnice nad Labem": "Roudnici nad Labem",
  "Hrádek nad Nisou": "Hrádku nad Nisou",
  "Blatná": "Blatné",
  "Ostrov": "Ostrově",
  "Nové Město nad Metují": "Novém Městě nad Metují",
  "Židlochovice": "Židlochovicích",
  "Zábřeh": "Zábřehu",
  "Milevsko": "Milevsku",
  "Náchod": "Náchodě",
  "Bučovice": "Bučovicích",
  "Slavičín": "Slavičíně",
  "Nový Bydžov": "Novém Bydžově",
  "Podbořany": "Podbořanech",
  "Hostivice": "Hostivici",
  "Moravská Třebová": "Moravské Třebové",
  "Přerov": "Přerově",
  "Rakovník": "Rakovníku",
  "Strakonice": "Strakonicích",
  "Beroun": "Berouně",
  "Chrudim": "Chrudimi",
};

/**
 * Returns the Czech locative form of a city name.
 * Falls back to the nominative (original) form for unknown cities.
 */
export function toLocative(cityName: string): string {
  return LOCATIVE_MAP[cityName] ?? cityName;
}

/**
 * Returns "v" or "ve" based on phonetic rules for the following word.
 * "ve" before: v/f, and consonant clusters starting with z/ž/s/š + consonant.
 */
function getPreposition(locativeForm: string): "v" | "ve" {
  const lower = locativeForm.toLowerCase();
  if (lower.startsWith("v") || lower.startsWith("f")) return "ve";
  if (/^[zžsš][^aeiouyáéíóúůý\s]/i.test(lower)) return "ve";
  return "v";
}

/**
 * Returns the full "v/ve + locative" phrase for a city name.
 *
 * @example getCityInPhrase("Praha")  // "v Praze"
 * @example getCityInPhrase("Zlín")   // "ve Zlíně"
 * @example getCityInPhrase("Vsetín") // "ve Vsetíně"
 */
export function getCityInPhrase(cityName: string): string {
  const locative = toLocative(cityName);
  const prep = getPreposition(locative);
  return `${prep} ${locative}`;
}
