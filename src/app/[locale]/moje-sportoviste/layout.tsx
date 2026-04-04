import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Správa sportoviště",
  robots: { index: false, follow: false },
};

export default function MojeSportovisteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
