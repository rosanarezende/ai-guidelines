import "./DirectCommandAside.css";
import copy from "./locales/pt-BR.json";

export function DirectCommandAside({ command }: { readonly command?: string }): JSX.Element | null {
  if (!command) return null;
  return (
    <details className="directCommandAside">
      <summary>{copy.label}</summary>
      <p>{copy.text}</p>
      <code>{command}</code>
    </details>
  );
}
