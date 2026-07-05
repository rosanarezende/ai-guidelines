"use client";

// GovernedActionBar — simulação de ação governada sobre linhas selecionadas.
// SEMPRE dry-run: o runtime revalida payload e base-revision no servidor.
// Com o dataset real a revisão atual passa; com a fixture o comando falha
// fechado (command-stale) — prova de que projeção derivada não autoriza ação.
import { Alert, Button, Chip, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { Flex } from "@/app/_ui/shared";
import { JsonBlock } from "@/app/_ui/shared/JsonBlock";

export function GovernedActionBar({
  selectedIds,
  sourceRevision,
}: {
  selectedIds: string[];
  sourceRevision: string;
}) {
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);

  async function runDryRun() {
    setBusy(true);
    counter.current += 1;
    const body = {
      id: `spike-table-action-${counter.current}`,
      type: "proposal.create",
      envelope: {
        actor: "spike-visual-stack",
        authority: "pm-growth",
        "base-revision": sourceRevision,
        "idempotency-key": `spike-table-action-${counter.current}-${sourceRevision}`,
        "issued-at": new Date().toISOString(),
        nonce: `spike-table-nonce-${counter.current}`,
      },
      payload: {
        proposal: {
          id: `spike-table-proposal-${counter.current}`,
          title: `Ação governada simulada sobre ${selectedIds.length} linha(s) selecionada(s)`,
          "raised-by": "incident:incidente-checkout",
          "authorized-by": "obj-efficiency",
          target: "tgt-sre-incidents",
          status: "proposed",
        },
      },
    };
    try {
      const response = await fetch("/api/commands/dry-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      setResult({ status: response.status, body: (await response.json()) as unknown });
    } catch (error) {
      setResult({ error: String(error) });
    }
    setBusy(false);
  }

  return (
    <Flex direction="column" gap={1}>
      <Flex align="center" gap={1} wrap>
        <Button
          size="small"
          variant="contained"
          disabled={selectedIds.length === 0 || busy}
          onClick={runDryRun}
        >
          simular ação governada (dry-run) · {selectedIds.length} linha(s)
        </Button>
        <Chip size="small" variant="outlined" label={`base-revision: ${sourceRevision}`} />
        <Typography variant="caption" color="text.secondary">
          O runtime relê a fonte autoritativa; nada é gravado. Fixture sintética deve falhar fechado
          (command-stale).
        </Typography>
      </Flex>
      {result !== null ? (
        <>
          <Alert
            severity={(result as { status?: number }).status === 200 ? "success" : "warning"}
            variant="outlined"
          >
            {(result as { status?: number }).status === 200
              ? "Dry-run aceito na revisão atual — a ação seria válida."
              : "Dry-run rejeitado (fail-closed) — a projeção não autoriza ação."}
          </Alert>
          <JsonBlock value={result} />
        </>
      ) : null}
    </Flex>
  );
}
