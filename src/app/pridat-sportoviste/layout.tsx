import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Přidat sportoviště",
  description:
    "Znáte sportoviště, které u nás chybí? Přidejte ho do databáze hraju.cz a pomozte rozšířit nabídku pro všechny sportovce v České republice.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
