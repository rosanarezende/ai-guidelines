import type { Metadata } from "next";
import type { ReactNode } from "react";
import QueryProvider from "./_providers/QueryProvider";
import "./styles.css";

export const metadata: Metadata = {
  title: "acme governance",
  description: "Aplicacao operacional da org simulada v3",
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
