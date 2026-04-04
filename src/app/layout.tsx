import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

// Root layout is a pass-through — the actual HTML structure
// is provided by [locale]/layout.tsx which sets <html lang> dynamically.
export default function RootLayout({ children }: Props) {
  return children;
}
