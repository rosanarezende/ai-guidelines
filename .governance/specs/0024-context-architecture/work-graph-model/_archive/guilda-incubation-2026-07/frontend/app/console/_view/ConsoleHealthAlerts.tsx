import { Alert } from "@mui/material";
import type { GovernanceIssue } from "@demo/contracts";

export function ConsoleHealthAlerts({
  loadError,
  blockingErrors,
  warnings,
}: {
  loadError: string | null;
  blockingErrors: GovernanceIssue[];
  warnings: GovernanceIssue[];
}) {
  return (
    <>
      {loadError ? <Alert severity="error">Falha ao recarregar: {loadError}</Alert> : null}
      {blockingErrors.length ? (
        <Alert severity="error">
          Existem erros bloqueantes. Esta UI nao esconde problemas de resolver.
        </Alert>
      ) : warnings.length ? (
        <Alert severity="warning">
          Avisos ativos: {warnings.length}. Eles ficam visiveis e nao viram verde implicito.
        </Alert>
      ) : (
        <Alert severity="success">Resolver sem erros e sem avisos neste snapshot.</Alert>
      )}
    </>
  );
}
