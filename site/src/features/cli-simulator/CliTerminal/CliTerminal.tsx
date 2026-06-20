import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  flowOutcome,
  isStepActive,
  type PromptChoice,
  type PromptFlow,
  type PromptStep,
} from "@content/promptFlows";
import { TerminalFrame } from "@features/terminal/TerminalFrame/TerminalFrame";

import "./CliTerminal.css";
import copy from "./locales/pt-BR.json";

type Answer = string | string[] | boolean | "ack";
type Answers = Record<string, Answer>;

const BAR = "│";

function flatChoices(step: PromptStep): readonly PromptChoice[] {
  if (step.choices) return step.choices;
  return (step.groups ?? []).flatMap((group) => group.choices);
}

function findNextActive(steps: readonly PromptStep[], from: number, answers: Answers): number {
  let index = from;
  while (index < steps.length && !isStepActive(steps[index], answers)) index += 1;
  return index;
}

function choiceLabel(step: PromptStep, value: string): string {
  return flatChoices(step).find((choice) => choice.value === value)?.label ?? value;
}

function answerSummary(step: PromptStep, answer: Answer): string {
  if (step.kind === "confirm") return answer ? copy.yes : copy.no;
  if (step.kind === "multiselect" && Array.isArray(answer)) {
    return answer.map((value) => choiceLabel(step, value)).join(", ") || copy.none;
  }
  if (step.kind === "select" && typeof answer === "string") return choiceLabel(step, answer);
  if (step.kind === "input") return String(answer || copy.empty);
  return "";
}

/**
 * Emulador FIEL do terminal `@clack` do `npx ai-guidelines`. Lê a máquina de
 * prompts gerada do runtime (texto/opções/ramificação reais) e reproduz a
 * experiência: barra de início, gutter, navegação por teclado e clique, rádios
 * `● ○`, checkboxes `◼ ◻`, e o passo respondido colapsando no histórico — como
 * o clack faz. A SAÍDA é o transcript de dry-run REAL (não execução ao vivo);
 * o modo é declarado de forma visível.
 */
export function CliTerminal({ flow }: { readonly flow: PromptFlow }): JSX.Element {
  const steps = flow.steps;
  const [answers, setAnswers] = useState<Answers>({});
  const [pointer, setPointer] = useState<number>(() => findNextActive(steps, 0, {}));
  const [cursor, setCursor] = useState(0);
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const [showRealNote, setShowRealNote] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  const active = pointer < steps.length ? steps[pointer] : undefined;
  const done = pointer >= steps.length;
  const outcome = flowOutcome(flow);
  // O passo de aplicar é o último confirm (mensagem "Aplicar este plano?").
  const applyStep = useMemo(
    () => steps.find((step) => step.kind === "confirm" && step.message.includes("Aplicar")),
    [steps]
  );
  const applied = done && (applyStep ? answers[applyStep.id] !== false : true);

  // Reinicia a interação ao trocar de cenário.
  useEffect(() => {
    setAnswers({});
    setPointer(findNextActive(steps, 0, {}));
    setShowRealNote(false);
  }, [steps]);

  // Inicializa o estado do controle ao entrar em cada passo.
  useEffect(() => {
    if (!active) return;
    if (active.kind === "select") {
      const list = flatChoices(active);
      const suggested = typeof active.suggested === "string" ? active.suggested : undefined;
      setCursor(
        Math.max(
          0,
          list.findIndex((choice) => choice.value === suggested)
        )
      );
    } else if (active.kind === "confirm") {
      setCursor(active.defaultBool ? 0 : 1);
    } else if (active.kind === "multiselect") {
      setChecked(new Set(active.defaultValues ?? []));
      setCursor(0);
    } else if (active.kind === "input") {
      setInputValue(active.defaultText ?? "");
    }
  }, [active]);

  const commit = useCallback(
    (step: PromptStep, value: Answer) => {
      const next = { ...answers, [step.id]: value };
      setAnswers(next);
      setPointer(findNextActive(steps, pointer + 1, next));
    },
    [answers, pointer, steps]
  );

  const restart = useCallback(() => {
    setAnswers({});
    setPointer(findNextActive(steps, 0, {}));
    setShowRealNote(false);
    screenRef.current?.focus();
  }, [steps]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!active) return;
      const list = flatChoices(active);
      const key = event.key;
      const isVertical = key === "ArrowDown" || key === "ArrowUp";
      if (active.kind === "note") {
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          commit(active, "ack");
        }
        return;
      }
      if (active.kind === "select" || active.kind === "multiselect") {
        if (isVertical) {
          event.preventDefault();
          setCursor((c) => (c + (key === "ArrowDown" ? 1 : list.length - 1)) % list.length);
          return;
        }
        if (active.kind === "multiselect" && key === " ") {
          event.preventDefault();
          const value = list[cursor]?.value;
          if (value) {
            setChecked((set) => {
              const copySet = new Set(set);
              if (copySet.has(value)) copySet.delete(value);
              else copySet.add(value);
              return copySet;
            });
          }
          return;
        }
        if (key === "Enter") {
          event.preventDefault();
          if (active.kind === "select") commit(active, list[cursor]?.value ?? "");
          else commit(active, [...checked]);
          return;
        }
        return;
      }
      if (active.kind === "confirm") {
        if (isVertical || key === "ArrowLeft" || key === "ArrowRight") {
          event.preventDefault();
          setCursor((c) => (c === 0 ? 1 : 0));
          return;
        }
        if (key.toLowerCase() === "y") {
          event.preventDefault();
          commit(active, true);
          return;
        }
        if (key.toLowerCase() === "n") {
          event.preventDefault();
          commit(active, false);
          return;
        }
        if (key === "Enter") {
          event.preventDefault();
          commit(active, cursor === 0);
          return;
        }
        return;
      }
      if (active.kind === "input") {
        if (key === "Enter") {
          event.preventDefault();
          commit(active, inputValue.trim() || (active.defaultText ?? ""));
          return;
        }
        if (key === "Backspace") {
          event.preventDefault();
          setInputValue((v) => v.slice(0, -1));
          return;
        }
        if (key.length === 1 && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          setInputValue((v) => v + key);
        }
      }
    },
    [active, checked, commit, cursor, inputValue]
  );

  const history = steps
    .slice(0, pointer)
    .filter((step) => isStepActive(step, answers) && step.id in answers);

  return (
    <section className="cliTerminal" aria-label={copy.aria.region}>
      <header className="cliTerminalBar">
        <span className="cliDots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <code className="cliCommand">{flow.command}</code>
        <span className="cliMode" title={copy.modeHint}>
          {copy.modeProjected}
        </span>
        <span className="cliBarActions">
          <button type="button" className="cliGhostButton" onClick={restart}>
            {copy.restart}
          </button>
          <button
            type="button"
            className="cliGhostButton cliRealButton"
            onClick={() => setShowRealNote((v) => !v)}
          >
            {copy.runReal}
          </button>
        </span>
      </header>

      {showRealNote ? (
        <p className="cliRealNote" role="note">
          {copy.runRealNote}
        </p>
      ) : null}

      <div
        ref={screenRef}
        className="cliScreen"
        role="application"
        aria-label={copy.aria.screen}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <p className="cliLine cliIntro">
          <span className="cliGlyph cliCyan">◆</span> ai-guidelines
        </p>

        {history.map((step) => (
          <ResolvedStep key={step.id} step={step} answer={answers[step.id]!} />
        ))}

        {active ? (
          <ActiveStep
            step={active}
            cursor={cursor}
            checked={checked}
            inputValue={inputValue}
            onPick={(value) => commit(active, value)}
            onToggle={(value) =>
              setChecked((set) => {
                const copySet = new Set(set);
                if (copySet.has(value)) copySet.delete(value);
                else copySet.add(value);
                return copySet;
              })
            }
            onCursor={setCursor}
            onInput={setInputValue}
          />
        ) : null}

        {done ? (
          <div className="cliOutcome">
            <p className="cliLine">
              <span className="cliGlyph cliGreen">└</span>{" "}
              {applied ? copy.outroApplied : copy.outroCancelled}
            </p>
            {applied && outcome ? (
              <>
                <p className="cliOutcomeBadge">{copy.outcomeBadge}</p>
                <TerminalFrame title={outcome.command} kind="real" exitCode={outcome.exitCode}>
                  {outcome.lines.join("\n")}
                </TerminalFrame>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="cliHint">{copy.keyboardHint}</p>
    </section>
  );
}

function ResolvedStep({ step, answer }: { readonly step: PromptStep; readonly answer: Answer }) {
  if (step.kind === "note") {
    return (
      <div className="cliNote">
        <p className="cliLine">
          <span className="cliGlyph cliGreen">◇</span> {step.title || step.message}
        </p>
        {(step.lines ?? []).map((line, index) => (
          <p key={index} className="cliLine cliMuted">
            {BAR} {line}
          </p>
        ))}
      </div>
    );
  }
  return (
    <div className="cliResolved">
      <p className="cliLine">
        <span className="cliGlyph cliGreen">◇</span> {step.message}
      </p>
      <p className="cliLine cliAnswer">
        {BAR} <span className="cliGreen">{answerSummary(step, answer)}</span>
      </p>
    </div>
  );
}

function ActiveStep({
  step,
  cursor,
  checked,
  inputValue,
  onPick,
  onToggle,
  onCursor,
  onInput,
}: {
  readonly step: PromptStep;
  readonly cursor: number;
  readonly checked: ReadonlySet<string>;
  readonly inputValue: string;
  readonly onPick: (value: Answer) => void;
  readonly onToggle: (value: string) => void;
  readonly onCursor: (index: number) => void;
  readonly onInput: (value: string) => void;
}) {
  if (step.kind === "note") {
    return (
      <div className="cliNote cliActive">
        <p className="cliLine">
          <span className="cliGlyph cliCyan">◆</span> {step.title || step.message}
        </p>
        {(step.lines ?? []).map((line, index) => (
          <p key={index} className="cliLine">
            {BAR} {line}
          </p>
        ))}
        <button type="button" className="cliContinue" onClick={() => onPick("ack")}>
          {copy.continueLabel}
        </button>
      </div>
    );
  }

  if (step.kind === "input") {
    return (
      <div className="cliActive">
        <p className="cliLine">
          <span className="cliGlyph cliCyan">◆</span> {step.message}
        </p>
        <p className="cliLine">
          {BAR}{" "}
          <input
            className="cliInput"
            value={inputValue}
            placeholder={step.defaultText}
            onChange={(event) => onInput(event.target.value)}
            aria-label={step.message}
          />
        </p>
      </div>
    );
  }

  if (step.kind === "confirm") {
    return (
      <div className="cliActive">
        <p className="cliLine">
          <span className="cliGlyph cliCyan">◆</span> {step.message}
        </p>
        <p className="cliLine cliOptions">
          {BAR}{" "}
          <button
            type="button"
            className={`cliOpt ${cursor === 0 ? "cliOptActive" : ""}`}
            onClick={() => onPick(true)}
            onMouseEnter={() => onCursor(0)}
          >
            <span className="cliGlyph">{cursor === 0 ? "●" : "○"}</span> {copy.yes}
          </button>
          <button
            type="button"
            className={`cliOpt ${cursor === 1 ? "cliOptActive" : ""}`}
            onClick={() => onPick(false)}
            onMouseEnter={() => onCursor(1)}
          >
            <span className="cliGlyph">{cursor === 1 ? "●" : "○"}</span> {copy.no}
          </button>
        </p>
      </div>
    );
  }

  // select / multiselect
  const list = flatChoices(step);
  return (
    <div className="cliActive">
      <p className="cliLine">
        <span className="cliGlyph cliCyan">◆</span> {step.message}
      </p>
      {list.map((choice, index) => {
        const isCursor = index === cursor;
        const isOn = step.kind === "multiselect" ? checked.has(choice.value) : isCursor;
        const glyph = step.kind === "multiselect" ? (isOn ? "◼" : "◻") : isCursor ? "●" : "○";
        return (
          <p key={choice.value} className={`cliLine cliOptionLine ${isCursor ? "cliCursor" : ""}`}>
            {BAR}{" "}
            <button
              type="button"
              className={`cliOpt ${isCursor ? "cliOptActive" : ""}`}
              onMouseEnter={() => onCursor(index)}
              onClick={() =>
                step.kind === "multiselect" ? onToggle(choice.value) : onPick(choice.value)
              }
            >
              <span className="cliGlyph">{glyph}</span> {choice.label}
              {choice.hint ? <span className="cliOptHint">({choice.hint})</span> : null}
            </button>
          </p>
        );
      })}
      {step.kind === "multiselect" ? (
        <button type="button" className="cliContinue" onClick={() => onPick([...checked])}>
          {copy.confirmSelection}
        </button>
      ) : null}
    </div>
  );
}
