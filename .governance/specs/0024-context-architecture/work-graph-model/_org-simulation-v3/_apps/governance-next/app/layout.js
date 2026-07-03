import "./styles.css";

export const metadata = {
  title: "acme governance",
  description: "Aplicação operacional da org simulada v3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
