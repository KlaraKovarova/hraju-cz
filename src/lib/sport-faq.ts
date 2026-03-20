interface FaqItem {
  question: string;
  answer: string;
}

const SPORT_FAQS: Record<string, FaqItem[]> = {
  tenis: [
    {
      question: "Kolik stojí hodina tenisu?",
      answer:
        "Cena se liší podle města a sezóny. V Praze se pohybuje mezi 200–500 Kč/h, mimo Prahu obvykle 150–350 Kč/h. V letní sezóně na venkovních kurtech bývá levněji než v zimě v halách.",
    },
    {
      question: "Potřebuji vlastní raketu?",
      answer:
        "Většina sportovišť nabízí půjčení raket přímo na místě. Pokud začínáte, můžete si nejprve půjčit a později investovat do vlastní rakety. Doporučujeme se předem informovat u konkrétního sportoviště.",
    },
    {
      question: "Jak rezervovat tenisový kurt?",
      answer:
        "Najděte sportoviště na hraju.cz, zkontrolujte kontaktní údaje a rezervujte telefonicky nebo online. Mnohá sportoviště nabízejí i online rezervační systém přímo na svých stránkách.",
    },
    {
      question: "Jaký je rozdíl mezi antukou a tvrdým povrchem?",
      answer:
        "Antuka (clay) je pomalejší povrch, šetrnější ke kloubům a vhodný pro začátečníky. Tvrdý povrch (hard court) je rychlejší a vyžaduje dynamičtější hru. V ČR převažují antukové kurty venku a tvrdé povrchy v halách.",
    },
  ],
  squash: [
    {
      question: "Kolik stojí hodina squashe?",
      answer:
        "Hodina squashe v ČR stojí obvykle 150–350 Kč. V Praze jsou ceny vyšší (200–400 Kč), v menších městech levnější. Většina hal nabízí zvýhodněné dopolední nebo studentské ceny.",
    },
    {
      question: "Co potřebuji na squash?",
      answer:
        "Stačí sportovní oblečení, sálová obuv s nebarvicí podrážkou a squashová raketa. Raketu i míček si většinou půjčíte přímo na místě. Nezapomeňte na ručník a láhev s vodou.",
    },
    {
      question: "Je squash vhodný pro začátečníky?",
      answer:
        "Ano, squash se dá snadno naučit. Základní pravidla jsou jednoduchá a mnoho sportovišť nabízí lekce s trenérem. Doporučujeme začít pomalejším míčkem (modrá tečka) pro delší výměny.",
    },
    {
      question: "Jak rezervovat squashový kurt?",
      answer:
        "Najděte squashové centrum na hraju.cz a kontaktujte ho telefonicky nebo přes webové stránky. Většina hal umožňuje rezervaci online nebo telefonicky s předstihem.",
    },
  ],
  badminton: [
    {
      question: "Kolik stojí hodina badmintonu?",
      answer:
        "Hodina badmintonu stojí obvykle 150–300 Kč za kurt. V Praze a větších městech 200–350 Kč, v menších městech od 100 Kč. Některé haly nabízejí zvýhodněné ranní hodiny.",
    },
    {
      question: "Potřebuji vlastní raketu na badminton?",
      answer:
        "Pro začátek si raketu můžete půjčit přímo ve sportovním centru. Pokud budete hrát pravidelně, vyplatí se vlastní raketa — základní modely začínají kolem 500 Kč.",
    },
    {
      question: "Kolik hráčů potřebuji na badminton?",
      answer:
        "Badminton se hraje jako dvouhra (1 vs 1) nebo čtyřhra (2 vs 2). Na jeden kurt tedy potřebujete 2–4 hráče. Některá centra pořádají i otevřené turnaje, kde najdete spoluhráče.",
    },
    {
      question: "Jak se liší badminton od crossmintonu?",
      answer:
        "Badminton se hraje v hale se sítí, crossminton (speed badminton) se hraje venku bez sítě. Badmintonový košíček je lehčí a pomalejší, crossmintonový je těžší a navržený pro venkovní hru.",
    },
  ],
  volejbal: [
    {
      question: "Kde hrát volejbal v Česku?",
      answer:
        "Na hraju.cz najdete přehled volejbalových hřišť a hal po celé ČR. Volejbal se hraje v tělocvičnách, sportovních halách i na venkovních beachvolejbalových kurtech.",
    },
    {
      question: "Kolik hráčů potřebuji na volejbal?",
      answer:
        "Klasický volejbal se hraje 6 vs 6, ale populární je i beachvolejbal (2 vs 2). Pro rekreační hru stačí i menší počet hráčů. Mnoho sportovišť nabízí volné hodiny, kde se můžete přidat.",
    },
    {
      question: "Kolik stojí pronájem volejbalového hřiště?",
      answer:
        "Pronájem tělocvičny nebo haly na volejbal stojí 300–800 Kč/h podle lokality. Beachvolejbalové kurty se pronajímají za 200–500 Kč/h. Venkovní veřejná hřiště jsou často zdarma.",
    },
    {
      question: "Jaká obuv je vhodná na volejbal?",
      answer:
        "Na halový volejbal potřebujete sálovou obuv s nebarvicí podrážkou a dobrým tlumením. Na beachvolejbal se hraje naboso. Investice do kvalitní sálové obuvi se vyplatí kvůli prevenci zranění.",
    },
  ],
  plavani: [
    {
      question: "Kolik stojí vstup do bazénu?",
      answer:
        "Vstupné do veřejných bazénů v ČR se pohybuje od 60 do 150 Kč za hodinu. Aquaparky a wellness centra mají ceny vyšší (200–500 Kč). Mnoho bazénů nabízí zvýhodněné permanentky.",
    },
    {
      question: "Jaké bazény jsou vhodné pro děti?",
      answer:
        "Většina veřejných bazénů má dětský bazének s nižší hladinou vody. Na hraju.cz najdete informace o vybavení jednotlivých bazénů. Aquaparky nabízejí navíc tobogány a vodní atrakce.",
    },
    {
      question: "Potřebuji plaveckou čepici?",
      answer:
        "Většina veřejných bazénů v ČR vyžaduje plaveckou čepici z hygienických důvodů. Čepici si můžete koupit přímo na místě za 50–100 Kč nebo si přinést vlastní.",
    },
    {
      question: "Kdy jsou bazény nejméně plné?",
      answer:
        "Nejméně vytížené jsou bazény v dopoledních hodinách ve všední dny. Ráno před prací (6:00–8:00) a odpoledne (13:00–15:00) bývá také klid. Víkendy a večery jsou obvykle nejrušnější.",
    },
  ],
  golf: [
    {
      question: "Kolik stojí hra golfu v Česku?",
      answer:
        "Green fee na 18 jamek stojí 500–2 500 Kč podle hřiště a sezóny. Cvičné driving range vyjdou na 50–150 Kč za košík míčků. Mnoho hřišť nabízí zvýhodněné odpolední nebo zimní tarify.",
    },
    {
      question: "Potřebuji vlastní golfové vybavení?",
      answer:
        "Pro začátek ne — většina golfových hřišť a akademií nabízí půjčení holí. Základní set na začátek stačí poloviční (7 holí) a vyjde od 3 000 Kč za použité hole.",
    },
    {
      question: "Jak začít s golfem?",
      answer:
        "Doporučujeme začít kurzem s trenérem na driving range nebo v golfové akademii. Po zvládnutí základů složíte zkoušku (green card) a můžete hrát na hřištích. Kurzy pro začátečníky nabízí většina areálů.",
    },
    {
      question: "Co je to handicap a green card?",
      answer:
        "Green card je osvědčení o znalosti pravidel a základních dovedností — potřebujete ji k samostatné hře na hřišti. Handicap (HCP) vyjadřuje vaši herní úroveň — čím nižší, tím lepší hráč.",
    },
  ],
  fitness: [
    {
      question: "Kolik stojí členství ve fitness centru?",
      answer:
        "Měsíční členství ve fitness centru v ČR stojí 500–1 500 Kč. V Praze je to obvykle 800–2 000 Kč. Mnoho center nabízí jednorázové vstupy (100–250 Kč) nebo zkušební týden zdarma.",
    },
    {
      question: "Co vzít s sebou do posilovny?",
      answer:
        "Sportovní oblečení, čistou sálovou obuv, ručník a láhev s vodou. Některé posilovny vyžadují vlastní ručník na cvičení. Šatny se zámky na klíč nebo mince jsou standardem.",
    },
    {
      question: "Je fitness vhodné pro začátečníky?",
      answer:
        "Ano, většina fitness center nabízí úvodní instruktáž zdarma. Trenér vám ukáže správnou techniku a sestaví tréninkový plán. Nebojte se začít — každý jednou začínal.",
    },
    {
      question: "Jaký je rozdíl mezi posilovnou a fitness centrem?",
      answer:
        "Posilovna se zaměřuje hlavně na silový trénink s činkami a stroji. Fitness centrum obvykle nabízí i kardio zónu, skupinové lekce (jóga, spinning, aerobik) a další služby jako sauna nebo masáže.",
    },
  ],
  padel: [
    {
      question: "Co je to padel?",
      answer:
        "Padel je raketový sport kombinující prvky tenisu a squashe. Hraje se na menším kurtu obehnaném skleněnými stěnami, od kterých se míč odráží. Vždy se hraje ve čtyřhře (2 vs 2).",
    },
    {
      question: "Kolik stojí hodina padelu?",
      answer:
        "Pronájem padelového kurtu stojí 400–800 Kč za hodinu v závislosti na lokalitě a denní době. V Praze je to 500–900 Kč, v menších městech od 300 Kč. Mnoho center nabízí zvýhodněné dopolední ceny.",
    },
    {
      question: "Potřebuji vlastní padelovou raketu?",
      answer:
        "Pro začátek ne — většina padelových center nabízí půjčení raket. Padelová raketa je kratší než tenisová, bez výpletu, s perforovanou plochou. Pokud začnete hrát pravidelně, vlastní raketa stojí od 1 500 Kč.",
    },
    {
      question: "Je padel vhodný pro začátečníky?",
      answer:
        "Ano, padel je ideální pro začátečníky. Menší kurt a pomalejší míč umožňují delší výměny od prvního dne. Mnoho center nabízí úvodní lekce s trenérem, kde se naučíte základní údery a pravidla.",
    },
  ],
  "stolni-tenis": [
    {
      question: "Kde hrát stolní tenis v Česku?",
      answer:
        "Na hraju.cz najdete přehled pingpongových heren, sportovních center a klubů po celé ČR. Stolní tenis se dá hrát i venku na veřejných stolech v parcích — ty jsou většinou zdarma.",
    },
    {
      question: "Kolik stojí hodina stolního tenisu?",
      answer:
        "Pronájem stolu stojí obvykle 80–200 Kč za hodinu. V klubech a sportovních centrech 100–250 Kč, v menších městech od 60 Kč. Některá centra nabízejí měsíční permanentky pro pravidelné hráče.",
    },
    {
      question: "Potřebuji vlastní pálku na stolní tenis?",
      answer:
        "Pro rekreační hru si pálky půjčíte na místě. Pro pravidelnou hru doporučujeme vlastní pálku — začátečnická stojí od 300 Kč, pokročilejší od 800 Kč. Rozdíl v kvalitě potah výrazně ovlivňuje hru.",
    },
    {
      question: "Je stolní tenis dobrý sport pro děti?",
      answer:
        "Ano, stolní tenis rozvíjí koordinaci, postřeh a strategické myšlení. Začít se dá od 6 let. Mnoho klubů nabízí juniorské tréninky. ČR má silnou tradici ve stolním tenise s kvalitními trenéry.",
    },
  ],
  florbal: [
    {
      question: "Kde hrát florbal v Česku?",
      answer:
        "Na hraju.cz najdete sportovní haly a centra, kde se florbal hraje. Florbal se hraje v tělocvičnách a sportovních halách. Mnoho měst má otevřené tréninky, kam se můžete přidat i bez zkušeností.",
    },
    {
      question: "Kolik stojí pronájem haly na florbal?",
      answer:
        "Pronájem sportovní haly na florbal stojí 500–1 500 Kč za hodinu podle velikosti a lokality. V Praze 800–2 000 Kč, v menších městech od 400 Kč. Náklady se obvykle dělí mezi hráče.",
    },
    {
      question: "Co potřebuji na florbal?",
      answer:
        "Sálovou obuv s nebarvicí podrážkou, sportovní oblečení a florbalovou hokejku. Hokejku si na začátek půjčíte v klubu. Brankáři navíc potřebují speciální výstroj — tu většinou poskytuje tým.",
    },
    {
      question: "Je florbal vhodný pro začátečníky?",
      answer:
        "Ano, florbal je přístupný sport s jednoduchými pravidly. Začít se dá v každém věku. Mnoho klubů pořádá volné tréninky a amatérské ligy pro rekreační hráče bez zkušeností.",
    },
  ],
};

export function getSportFaqs(sportSlug: string): FaqItem[] {
  return SPORT_FAQS[sportSlug] ?? [];
}
