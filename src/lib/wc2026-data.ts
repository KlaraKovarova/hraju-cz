// Static FIFA World Cup 2026 data: groups, teams, match schedule.
// All kickoff times are in UTC. Standings come from DB.

export interface Wc2026Team {
  slug: string; // URL-safe slug
  name: string; // English name (used for DB key)
  nameCs: string; // Czech name
  flag: string; // emoji flag
  isHost?: boolean;
}

export interface Wc2026Group {
  letter: string;
  teams: Wc2026Team[];
}

export interface Wc2026Match {
  id: string; // e.g. "A1", "B3"
  group: string;
  homeTeam: string; // English name (matches Wc2026Team.name)
  awayTeam: string;
  kickoffUtc: string; // ISO 8601 UTC
  venue: string;
  city: string;
}

export const WC2026_TEAMS: Wc2026Team[] = [
  // Group A
  { slug: "mexico", name: "Mexico", nameCs: "Mexiko", flag: "🇲🇽", isHost: true },
  { slug: "south-africa", name: "South Africa", nameCs: "Jižní Afrika", flag: "🇿🇦" },
  { slug: "south-korea", name: "South Korea", nameCs: "Jižní Korea", flag: "🇰🇷" },
  { slug: "czech-republic", name: "Czech Republic", nameCs: "Česká republika", flag: "🇨🇿" },
  // Group B
  { slug: "canada", name: "Canada", nameCs: "Kanada", flag: "🇨🇦", isHost: true },
  { slug: "bosnia-herzegovina", name: "Bosnia and Herzegovina", nameCs: "Bosna a Hercegovina", flag: "🇧🇦" },
  { slug: "qatar", name: "Qatar", nameCs: "Katar", flag: "🇶🇦" },
  { slug: "switzerland", name: "Switzerland", nameCs: "Švýcarsko", flag: "🇨🇭" },
  // Group C
  { slug: "brazil", name: "Brazil", nameCs: "Brazílie", flag: "🇧🇷" },
  { slug: "morocco", name: "Morocco", nameCs: "Maroko", flag: "🇲🇦" },
  { slug: "haiti", name: "Haiti", nameCs: "Haiti", flag: "🇭🇹" },
  { slug: "scotland", name: "Scotland", nameCs: "Skotsko", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // Group D
  { slug: "usa", name: "United States", nameCs: "USA", flag: "🇺🇸", isHost: true },
  { slug: "paraguay", name: "Paraguay", nameCs: "Paraguay", flag: "🇵🇾" },
  { slug: "australia", name: "Australia", nameCs: "Austrálie", flag: "🇦🇺" },
  { slug: "turkey", name: "Turkey", nameCs: "Turecko", flag: "🇹🇷" },
  // Group E
  { slug: "germany", name: "Germany", nameCs: "Německo", flag: "🇩🇪" },
  { slug: "curacao", name: "Curaçao", nameCs: "Curaçao", flag: "🇨🇼" },
  { slug: "ivory-coast", name: "Ivory Coast", nameCs: "Pobřeží slonoviny", flag: "🇨🇮" },
  { slug: "ecuador", name: "Ecuador", nameCs: "Ekvádor", flag: "🇪🇨" },
  // Group F
  { slug: "netherlands", name: "Netherlands", nameCs: "Nizozemsko", flag: "🇳🇱" },
  { slug: "japan", name: "Japan", nameCs: "Japonsko", flag: "🇯🇵" },
  { slug: "sweden", name: "Sweden", nameCs: "Švédsko", flag: "🇸🇪" },
  { slug: "tunisia", name: "Tunisia", nameCs: "Tunisko", flag: "🇹🇳" },
  // Group G
  { slug: "belgium", name: "Belgium", nameCs: "Belgie", flag: "🇧🇪" },
  { slug: "egypt", name: "Egypt", nameCs: "Egypt", flag: "🇪🇬" },
  { slug: "iran", name: "Iran", nameCs: "Írán", flag: "🇮🇷" },
  { slug: "new-zealand", name: "New Zealand", nameCs: "Nový Zéland", flag: "🇳🇿" },
  // Group H
  { slug: "spain", name: "Spain", nameCs: "Španělsko", flag: "🇪🇸" },
  { slug: "cape-verde", name: "Cape Verde", nameCs: "Kapverdy", flag: "🇨🇻" },
  { slug: "saudi-arabia", name: "Saudi Arabia", nameCs: "Saúdská Arábie", flag: "🇸🇦" },
  { slug: "uruguay", name: "Uruguay", nameCs: "Uruguay", flag: "🇺🇾" },
  // Group I
  { slug: "france", name: "France", nameCs: "Francie", flag: "🇫🇷" },
  { slug: "senegal", name: "Senegal", nameCs: "Senegal", flag: "🇸🇳" },
  { slug: "iraq", name: "Iraq", nameCs: "Irák", flag: "🇮🇶" },
  { slug: "norway", name: "Norway", nameCs: "Norsko", flag: "🇳🇴" },
  // Group J
  { slug: "argentina", name: "Argentina", nameCs: "Argentina", flag: "🇦🇷" },
  { slug: "algeria", name: "Algeria", nameCs: "Alžírsko", flag: "🇩🇿" },
  { slug: "austria", name: "Austria", nameCs: "Rakousko", flag: "🇦🇹" },
  { slug: "jordan", name: "Jordan", nameCs: "Jordánsko", flag: "🇯🇴" },
  // Group K
  { slug: "portugal", name: "Portugal", nameCs: "Portugalsko", flag: "🇵🇹" },
  { slug: "dr-congo", name: "DR Congo", nameCs: "DR Kongo", flag: "🇨🇩" },
  { slug: "uzbekistan", name: "Uzbekistan", nameCs: "Uzbekistán", flag: "🇺🇿" },
  { slug: "colombia", name: "Colombia", nameCs: "Kolumbie", flag: "🇨🇴" },
  // Group L
  { slug: "england", name: "England", nameCs: "Anglie", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { slug: "croatia", name: "Croatia", nameCs: "Chorvatsko", flag: "🇭🇷" },
  { slug: "ghana", name: "Ghana", nameCs: "Ghana", flag: "🇬🇭" },
  { slug: "panama", name: "Panama", nameCs: "Panama", flag: "🇵🇦" },
];

export const WC2026_GROUPS: Wc2026Group[] = [
  {
    letter: "A",
    teams: ["Mexico", "South Africa", "South Korea", "Czech Republic"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "B",
    teams: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "C",
    teams: ["Brazil", "Morocco", "Haiti", "Scotland"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "D",
    teams: ["United States", "Paraguay", "Australia", "Turkey"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "E",
    teams: ["Germany", "Curaçao", "Ivory Coast", "Ecuador"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "F",
    teams: ["Netherlands", "Japan", "Sweden", "Tunisia"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "G",
    teams: ["Belgium", "Egypt", "Iran", "New Zealand"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "H",
    teams: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "I",
    teams: ["France", "Senegal", "Iraq", "Norway"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "J",
    teams: ["Argentina", "Algeria", "Austria", "Jordan"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "K",
    teams: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
  {
    letter: "L",
    teams: ["England", "Croatia", "Ghana", "Panama"].map(
      (n) => WC2026_TEAMS.find((t) => t.name === n)!
    ),
  },
];

export const WC2026_MATCHES: Wc2026Match[] = [
  // ── Group A ──
  { id: "A1", group: "A", homeTeam: "Mexico", awayTeam: "South Africa", kickoffUtc: "2026-06-11T19:00:00Z", venue: "Estadio Azteca", city: "Mexico City" },
  { id: "A2", group: "A", homeTeam: "South Korea", awayTeam: "Czech Republic", kickoffUtc: "2026-06-12T02:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "A3", group: "A", homeTeam: "Czech Republic", awayTeam: "South Africa", kickoffUtc: "2026-06-18T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "A4", group: "A", homeTeam: "Mexico", awayTeam: "South Korea", kickoffUtc: "2026-06-19T01:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "A5", group: "A", homeTeam: "Czech Republic", awayTeam: "Mexico", kickoffUtc: "2026-06-25T01:00:00Z", venue: "Estadio Azteca", city: "Mexico City" },
  { id: "A6", group: "A", homeTeam: "South Africa", awayTeam: "South Korea", kickoffUtc: "2026-06-25T01:00:00Z", venue: "Estadio BBVA", city: "Monterrey" },
  // ── Group B ──
  { id: "B1", group: "B", homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", kickoffUtc: "2026-06-12T19:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "B2", group: "B", homeTeam: "Qatar", awayTeam: "Switzerland", kickoffUtc: "2026-06-13T19:00:00Z", venue: "Levi's Stadium", city: "Santa Clara" },
  { id: "B3", group: "B", homeTeam: "Switzerland", awayTeam: "Bosnia and Herzegovina", kickoffUtc: "2026-06-18T19:00:00Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "B4", group: "B", homeTeam: "Canada", awayTeam: "Qatar", kickoffUtc: "2026-06-18T22:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "B5", group: "B", homeTeam: "Switzerland", awayTeam: "Canada", kickoffUtc: "2026-06-24T19:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "B6", group: "B", homeTeam: "Bosnia and Herzegovina", awayTeam: "Qatar", kickoffUtc: "2026-06-24T19:00:00Z", venue: "Lumen Field", city: "Seattle" },
  // ── Group C ──
  { id: "C1", group: "C", homeTeam: "Brazil", awayTeam: "Morocco", kickoffUtc: "2026-06-13T22:00:00Z", venue: "MetLife Stadium", city: "East Rutherford" },
  { id: "C2", group: "C", homeTeam: "Haiti", awayTeam: "Scotland", kickoffUtc: "2026-06-14T01:00:00Z", venue: "Gillette Stadium", city: "Foxborough" },
  { id: "C3", group: "C", homeTeam: "Scotland", awayTeam: "Morocco", kickoffUtc: "2026-06-19T22:00:00Z", venue: "Gillette Stadium", city: "Foxborough" },
  { id: "C4", group: "C", homeTeam: "Brazil", awayTeam: "Haiti", kickoffUtc: "2026-06-20T00:30:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "C5", group: "C", homeTeam: "Scotland", awayTeam: "Brazil", kickoffUtc: "2026-06-24T22:00:00Z", venue: "Hard Rock Stadium", city: "Miami Gardens" },
  { id: "C6", group: "C", homeTeam: "Morocco", awayTeam: "Haiti", kickoffUtc: "2026-06-24T22:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  // ── Group D ──
  { id: "D1", group: "D", homeTeam: "United States", awayTeam: "Paraguay", kickoffUtc: "2026-06-13T01:00:00Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "D2", group: "D", homeTeam: "Australia", awayTeam: "Turkey", kickoffUtc: "2026-06-14T04:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "D3", group: "D", homeTeam: "United States", awayTeam: "Australia", kickoffUtc: "2026-06-19T19:00:00Z", venue: "Lumen Field", city: "Seattle" },
  { id: "D4", group: "D", homeTeam: "Turkey", awayTeam: "Paraguay", kickoffUtc: "2026-06-20T03:00:00Z", venue: "Levi's Stadium", city: "Santa Clara" },
  { id: "D5", group: "D", homeTeam: "Turkey", awayTeam: "United States", kickoffUtc: "2026-06-26T02:00:00Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "D6", group: "D", homeTeam: "Paraguay", awayTeam: "Australia", kickoffUtc: "2026-06-26T02:00:00Z", venue: "Levi's Stadium", city: "Santa Clara" },
  // ── Group E ──
  { id: "E1", group: "E", homeTeam: "Germany", awayTeam: "Curaçao", kickoffUtc: "2026-06-14T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "E2", group: "E", homeTeam: "Ivory Coast", awayTeam: "Ecuador", kickoffUtc: "2026-06-14T23:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "E3", group: "E", homeTeam: "Germany", awayTeam: "Ivory Coast", kickoffUtc: "2026-06-20T20:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "E4", group: "E", homeTeam: "Ecuador", awayTeam: "Curaçao", kickoffUtc: "2026-06-21T00:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "E5", group: "E", homeTeam: "Curaçao", awayTeam: "Ivory Coast", kickoffUtc: "2026-06-25T20:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "E6", group: "E", homeTeam: "Ecuador", awayTeam: "Germany", kickoffUtc: "2026-06-25T20:00:00Z", venue: "MetLife Stadium", city: "East Rutherford" },
  // ── Group F ──
  { id: "F1", group: "F", homeTeam: "Netherlands", awayTeam: "Japan", kickoffUtc: "2026-06-14T20:00:00Z", venue: "AT&T Stadium", city: "Arlington" },
  { id: "F2", group: "F", homeTeam: "Sweden", awayTeam: "Tunisia", kickoffUtc: "2026-06-15T02:00:00Z", venue: "Estadio BBVA", city: "Monterrey" },
  { id: "F3", group: "F", homeTeam: "Netherlands", awayTeam: "Sweden", kickoffUtc: "2026-06-20T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "F4", group: "F", homeTeam: "Tunisia", awayTeam: "Japan", kickoffUtc: "2026-06-21T04:00:00Z", venue: "Estadio BBVA", city: "Monterrey" },
  { id: "F5", group: "F", homeTeam: "Japan", awayTeam: "Sweden", kickoffUtc: "2026-06-25T23:00:00Z", venue: "AT&T Stadium", city: "Arlington" },
  { id: "F6", group: "F", homeTeam: "Tunisia", awayTeam: "Netherlands", kickoffUtc: "2026-06-25T23:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  // ── Group G ──
  { id: "G1", group: "G", homeTeam: "Belgium", awayTeam: "Egypt", kickoffUtc: "2026-06-15T19:00:00Z", venue: "Lumen Field", city: "Seattle" },
  { id: "G2", group: "G", homeTeam: "Iran", awayTeam: "New Zealand", kickoffUtc: "2026-06-16T01:00:00Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "G3", group: "G", homeTeam: "Belgium", awayTeam: "Iran", kickoffUtc: "2026-06-21T19:00:00Z", venue: "SoFi Stadium", city: "Los Angeles" },
  { id: "G4", group: "G", homeTeam: "New Zealand", awayTeam: "Egypt", kickoffUtc: "2026-06-22T01:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "G5", group: "G", homeTeam: "Egypt", awayTeam: "Iran", kickoffUtc: "2026-06-27T03:00:00Z", venue: "Lumen Field", city: "Seattle" },
  { id: "G6", group: "G", homeTeam: "New Zealand", awayTeam: "Belgium", kickoffUtc: "2026-06-27T03:00:00Z", venue: "BC Place", city: "Vancouver" },
  // ── Group H ──
  { id: "H1", group: "H", homeTeam: "Spain", awayTeam: "Cape Verde", kickoffUtc: "2026-06-15T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H2", group: "H", homeTeam: "Saudi Arabia", awayTeam: "Uruguay", kickoffUtc: "2026-06-15T22:00:00Z", venue: "Hard Rock Stadium", city: "Miami Gardens" },
  { id: "H3", group: "H", homeTeam: "Spain", awayTeam: "Saudi Arabia", kickoffUtc: "2026-06-21T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H4", group: "H", homeTeam: "Uruguay", awayTeam: "Cape Verde", kickoffUtc: "2026-06-21T22:00:00Z", venue: "Hard Rock Stadium", city: "Miami Gardens" },
  { id: "H5", group: "H", homeTeam: "Cape Verde", awayTeam: "Saudi Arabia", kickoffUtc: "2026-06-27T00:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "H6", group: "H", homeTeam: "Uruguay", awayTeam: "Spain", kickoffUtc: "2026-06-27T00:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  // ── Group I ──
  { id: "I1", group: "I", homeTeam: "France", awayTeam: "Senegal", kickoffUtc: "2026-06-16T19:00:00Z", venue: "MetLife Stadium", city: "East Rutherford" },
  { id: "I2", group: "I", homeTeam: "Iraq", awayTeam: "Norway", kickoffUtc: "2026-06-16T22:00:00Z", venue: "Gillette Stadium", city: "Foxborough" },
  { id: "I3", group: "I", homeTeam: "France", awayTeam: "Iraq", kickoffUtc: "2026-06-22T21:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
  { id: "I4", group: "I", homeTeam: "Norway", awayTeam: "Senegal", kickoffUtc: "2026-06-23T00:00:00Z", venue: "MetLife Stadium", city: "East Rutherford" },
  { id: "I5", group: "I", homeTeam: "Norway", awayTeam: "France", kickoffUtc: "2026-06-26T19:00:00Z", venue: "Gillette Stadium", city: "Foxborough" },
  { id: "I6", group: "I", homeTeam: "Senegal", awayTeam: "Iraq", kickoffUtc: "2026-06-26T19:00:00Z", venue: "BMO Field", city: "Toronto" },
  // ── Group J ──
  { id: "J1", group: "J", homeTeam: "Argentina", awayTeam: "Algeria", kickoffUtc: "2026-06-17T01:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J2", group: "J", homeTeam: "Austria", awayTeam: "Jordan", kickoffUtc: "2026-06-17T04:00:00Z", venue: "Levi's Stadium", city: "Santa Clara" },
  { id: "J3", group: "J", homeTeam: "Argentina", awayTeam: "Austria", kickoffUtc: "2026-06-22T17:00:00Z", venue: "AT&T Stadium", city: "Arlington" },
  { id: "J4", group: "J", homeTeam: "Jordan", awayTeam: "Algeria", kickoffUtc: "2026-06-23T03:00:00Z", venue: "Levi's Stadium", city: "Santa Clara" },
  { id: "J5", group: "J", homeTeam: "Algeria", awayTeam: "Austria", kickoffUtc: "2026-06-28T02:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J6", group: "J", homeTeam: "Jordan", awayTeam: "Argentina", kickoffUtc: "2026-06-28T02:00:00Z", venue: "AT&T Stadium", city: "Arlington" },
  // ── Group K ──
  { id: "K1", group: "K", homeTeam: "Portugal", awayTeam: "DR Congo", kickoffUtc: "2026-06-17T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "K2", group: "K", homeTeam: "Uzbekistan", awayTeam: "Colombia", kickoffUtc: "2026-06-18T02:00:00Z", venue: "Estadio Azteca", city: "Mexico City" },
  { id: "K3", group: "K", homeTeam: "Portugal", awayTeam: "Uzbekistan", kickoffUtc: "2026-06-23T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "K4", group: "K", homeTeam: "Colombia", awayTeam: "DR Congo", kickoffUtc: "2026-06-24T02:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "K5", group: "K", homeTeam: "Colombia", awayTeam: "Portugal", kickoffUtc: "2026-06-27T23:30:00Z", venue: "Hard Rock Stadium", city: "Miami Gardens" },
  { id: "K6", group: "K", homeTeam: "DR Congo", awayTeam: "Uzbekistan", kickoffUtc: "2026-06-27T23:30:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  // ── Group L ──
  { id: "L1", group: "L", homeTeam: "England", awayTeam: "Croatia", kickoffUtc: "2026-06-17T20:00:00Z", venue: "AT&T Stadium", city: "Arlington" },
  { id: "L2", group: "L", homeTeam: "Ghana", awayTeam: "Panama", kickoffUtc: "2026-06-17T23:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "L3", group: "L", homeTeam: "England", awayTeam: "Ghana", kickoffUtc: "2026-06-23T20:00:00Z", venue: "Gillette Stadium", city: "Foxborough" },
  { id: "L4", group: "L", homeTeam: "Panama", awayTeam: "Croatia", kickoffUtc: "2026-06-23T23:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "L5", group: "L", homeTeam: "Panama", awayTeam: "England", kickoffUtc: "2026-06-27T21:00:00Z", venue: "MetLife Stadium", city: "East Rutherford" },
  { id: "L6", group: "L", homeTeam: "Croatia", awayTeam: "Ghana", kickoffUtc: "2026-06-27T21:00:00Z", venue: "Lincoln Financial Field", city: "Philadelphia" },
];

export function getTeamByName(name: string): Wc2026Team | undefined {
  return WC2026_TEAMS.find((t) => t.name === name);
}

export function getTeamBySlug(slug: string): Wc2026Team | undefined {
  return WC2026_TEAMS.find((t) => t.slug === slug);
}

export function getMatchesForTeam(teamName: string): Wc2026Match[] {
  return WC2026_MATCHES.filter(
    (m) => m.homeTeam === teamName || m.awayTeam === teamName
  );
}
