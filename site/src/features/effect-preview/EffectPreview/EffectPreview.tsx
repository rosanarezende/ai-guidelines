import type { CatalogScenario, EffectStatus } from "@content/scenarios/types";

import "./EffectPreview.css";
import copy from "./locales/pt-BR.json";

const STATUS_LABEL: Record<EffectStatus, string> = copy.status;

/**
 * Preview de efeitos: o que seria escrito, bloqueado, validado ou decidido —
 * com estados disponível / bloqueado / proibido. Também lista bloqueios e gaps.
 */
export function EffectPreview({ scenario }: { readonly scenario: CatalogScenario }): JSX.Element {
  return (
    <aside className="effectPreview" aria-label={copy.aria}>
      <h3 className="effectTitle">{copy.title}</h3>
      <ul className="effectList" role="list">
        {scenario.effects.map((effect, index) => (
          <li key={index} className={`effect effect-${effect.status}`}>
            <span className="effectStatus">{STATUS_LABEL[effect.status]}</span>
            <span className="effectLabel">{effect.label}</span>
            {effect.detail ? <span className="effectDetail">{effect.detail}</span> : null}
          </li>
        ))}
      </ul>

      {scenario.blocks.length > 0 ? (
        <div className="effectBlocks">
          <h4>{copy.blocksTitle}</h4>
          <ul role="list">
            {scenario.blocks.map((block, index) => (
              <li key={index}>{block}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {scenario.gaps.length > 0 ? (
        <div className="effectGaps">
          <h4>{copy.gapsTitle}</h4>
          <ul role="list">
            {scenario.gaps.map((gap, index) => (
              <li key={index}>{gap}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
