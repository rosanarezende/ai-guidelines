import "./DirectCommandAside.css";
import copy from "./locales/pt-BR.json";

export function DirectCommandAside({ command }: { readonly command?: string }): JSX.Element | null {
  if (!command) return null;
  return (
    <aside className="directCommandAside">
      <span>{copy.label}</span>
      <p>{copy.text}</p>
      <code>{command}</code>
    </aside>
  );
}
