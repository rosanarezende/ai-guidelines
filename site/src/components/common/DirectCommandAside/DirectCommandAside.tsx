import "./DirectCommandAside.css";

export function DirectCommandAside({ command }: { readonly command?: string }): JSX.Element | null {
  if (!command) return null;
  return (
    <aside className="directCommandAside">
      <span>Atalho direto</span>
      <p>Para automação ou para quem já sabe exatamente o que quer.</p>
      <code>{command}</code>
    </aside>
  );
}
