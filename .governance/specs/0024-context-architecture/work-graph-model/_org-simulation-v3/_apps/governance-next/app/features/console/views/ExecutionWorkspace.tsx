import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import {
  DataPill,
  EntityCard,
  Flex,
  ResponsiveGrid,
  SectionCard,
} from "@/app/ui/shared/components";

export default function ExecutionWorkspace({ snapshot }: { snapshot: GovernanceSnapshot }) {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <SectionCard
        title="Execution Workspace"
        subtitle="Visao de tech lead: repo-work, contratos, repos adotados e evidencias publicadas."
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Intent</TableCell>
                <TableCell>Peça</TableCell>
                <TableCell>Repo</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {snapshot.portfolio.intents.flatMap((intent) =>
                intent.works.map((work) => (
                  <TableRow key={`${intent.id}-${work.id}`}>
                    <TableCell>{intent.id}</TableCell>
                    <TableCell>{work.id}</TableCell>
                    <TableCell>{work.repo}</TableCell>
                    <TableCell>{work.purpose}</TableCell>
                    <TableCell>{work.review}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <ResponsiveGrid min={380}>
        {snapshot.contracts.map((contract) => (
          <SectionCard
            key={contract.id}
            title={contract.id}
            subtitle={`${contract.revision} · owner repo ${contract["owner-repo"]}`}
            action={<Chip size="small" label={`${contract.consumers.length} consumers`} />}
          >
            <Flex wrap gap={1}>
              {contract.consumers.map((consumer) => (
                <DataPill key={consumer} label={consumer} />
              ))}
            </Flex>
            <Box sx={{ display: "grid", gap: 1, mt: 1.5 }}>
              {(contract["revision-proposals"] || []).map((proposal) => (
                <EntityCard
                  key={proposal.id}
                  title={proposal.id}
                  subtitle={`${proposal.revision} · decision ${proposal.decision}`}
                />
              ))}
            </Box>
          </SectionCard>
        ))}
      </ResponsiveGrid>

      <ResponsiveGrid min={320}>
        {snapshot.repos.map((repo) => (
          <EntityCard
            key={repo.id}
            title={repo.id}
            subtitle={`owner ${repo.owner} · ${repo.context ? "contexto publicado" : "sem contexto"}`}
          >
            <Flex wrap gap={1}>
              <DataPill label={`${repo.works.length} work ack`} />
              <DataPill label={`${repo.contracts.length} contrato(s)`} />
            </Flex>
          </EntityCard>
        ))}
      </ResponsiveGrid>
    </Box>
  );
}
