// Store dos Objetivos (intents) em localStorage — o "banco" da app (Lente 5: backend plugável).
// Hoje localStorage; amanhã um backend escreveria os arquivos/banco. A app só conhece este contrato.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { AppIntent } from "./types";

const KEY = "org-sim-v2-intents";

/** Seed: o login (intent-0001) com q1 já respondida+decidida e q2 respondida aguardando decisão. */
const SEED: AppIntent[] = [
  {
    id: "intent-0001",
    title: "Novo fluxo de login (com ajuda sob demanda e proativa)",
    objective: "login navegável atrás de flag, com ajuda ao usuário que falha",
    details: "Feature cross-repo. As entregas só nascem depois das perguntas respondidas.",
    references: [{ label: "modelagem do login (produto)", url: "https://docs.acme.example/login" }],
    questions: [
      {
        id: "q1",
        question: "o design system tem um formulário validado, ou cada MFE reimplementa?",
        verdict:
          "não — o DS não tem form validado; cada MFE reimplementa → precisa criar o componente",
      },
      {
        id: "q2",
        question: "suporte proativo é viável (detectar N falhas por pub/sub e abordar o usuário)?",
        verdict:
          "viável (pub/sub conta as falhas e dispara após N); SE ajuda é hipótese → experiment",
      },
    ],
    decisions: [
      {
        id: "d1",
        decides: "q1",
        status: "accepted",
        rationale: "verdict claro: criar o componente de form validado",
        at: "2026-06-27",
      },
    ],
    createdAt: "2026-06-27",
  },
];

interface Store {
  intents: AppIntent[];
  addIntent: (intent: AppIntent) => void;
  updateIntent: (id: string, fn: (i: AppIntent) => AppIntent) => void;
}

const Ctx = createContext<Store | null>(null);

export function IntentsProvider({ children }: { children: ReactNode }) {
  const [intents, setIntents] = useState<AppIntent[]>(() => {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AppIntent[]) : SEED;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(intents));
  }, [intents]);

  const addIntent = (intent: AppIntent) => setIntents((xs) => [...xs, intent]);
  const updateIntent = (id: string, fn: (i: AppIntent) => AppIntent) =>
    setIntents((xs) => xs.map((i) => (i.id === id ? fn(i) : i)));

  return <Ctx.Provider value={{ intents, addIntent, updateIntent }}>{children}</Ctx.Provider>;
}

export function useIntents(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useIntents fora do IntentsProvider");
  return ctx;
}
