interface FaqItem {
  question: string;
  answer: string;
}

const SPORT_FAQS: Record<string, FaqItem[]> = {
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
  lezeni: [
    {
      question: "Kolik stojí vstup do lezeckého centra?",
      answer:
        "Jednorázový vstup do lezeckého centra stojí obvykle 150–300 Kč. V Praze 200–350 Kč, v menších městech od 120 Kč. Většina center nabízí zvýhodněné permanentky a studentské ceny.",
    },
    {
      question: "Co potřebuji na lezení?",
      answer:
        "Na bouldering stačí sportovní oblečení a lezečky (půjčení 50–100 Kč). Na lezení s lanem navíc potřebujete sedací úvazek a jistící pomůcku — vše si půjčíte na místě. Doporučujeme magnézium na ruce.",
    },
    {
      question: "Je lezení vhodné pro začátečníky?",
      answer:
        "Ano, bouldering je ideální start — lezete do výšky 4 m nad měkkými matracemi bez lana. Většina center nabízí úvodní lekce s instruktorem. Cesty jsou barevně označené podle obtížnosti od nejlehčích.",
    },
    {
      question: "Jaký je rozdíl mezi boulderingem a lezením s lanem?",
      answer:
        "Bouldering je lezení na nízké stěně (do 4,5 m) bez lana nad matracemi. Lezení s lanem probíhá na vyšších stěnách (10–15 m) se jištěním. Bouldering je přístupnější pro začátečníky, lezení s lanem vyžaduje kurz jištění.",
    },
  ],
  ferraty: [
    {
      question: "Co je to ferrata?",
      answer:
        "Ferrata (via ferrata) je zajištěná cesta v horském terénu s ocelovými lany, stupadly a žebříky. Vznikly v Alpách pro bezpečný pohyb ve skalách. V ČR najdete ferraty různé obtížnosti, od snadných po náročné.",
    },
    {
      question: "Co potřebuji na ferratu?",
      answer:
        "Ferratový set (sedací úvazek, tlumič pádu, dvě karabiny), helmu a vhodnou obuv s pevnou podrážkou. Vybavení si lze půjčit v blízkých půjčovnách nebo outdoorových centrech. Doporučujeme rukavice.",
    },
    {
      question: "Jsou ferraty v ČR vhodné pro začátečníky?",
      answer:
        "Ano, v ČR je řada ferrat obtížnosti A a B (snadné až mírně obtížné), vhodných pro začátečníky. Populární jsou ferraty v Děčínském Sněžníku, na Pastýřské stěně nebo v Českém Švýcarsku. Vždy respektujte obtížnost.",
    },
    {
      question: "Kde najdu ferraty v České republice?",
      answer:
        "Ferraty v ČR najdete hlavně v severních Čechách (Labské pískovce, Český ráj), na Vysočině a v Moravském krasu. Na hraju.cz máte přehled ferrat s popisem obtížnosti, délky a potřebného vybavení.",
    },
  ],
};

export function getSportFaqs(sportSlug: string): FaqItem[] {
  return SPORT_FAQS[sportSlug] ?? [];
}
