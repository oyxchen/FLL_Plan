import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLL Plan · Team Hub",
  description: "A shared workspace for your FIRST LEGO League BIOGLOW team.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
