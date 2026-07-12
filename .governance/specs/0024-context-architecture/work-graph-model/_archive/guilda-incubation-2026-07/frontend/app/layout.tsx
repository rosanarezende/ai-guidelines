import type { Metadata } from "next";
import type { ReactNode } from "react";
import QueryProvider from "./_providers/QueryProvider";
import "./styles.css";

export const metadata: Metadata = {
  title: "Guilda Governance",
  description: "Governanca de trabalho open-source: pessoas decidem, o sistema apoia.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
