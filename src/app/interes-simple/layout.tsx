import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interés simple",
  description:
    "Calculadora de interés simple. Los intereses no se acumulan al capital. I = P·r·t, M = P + I.",
};

export default function InteresSimpleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
