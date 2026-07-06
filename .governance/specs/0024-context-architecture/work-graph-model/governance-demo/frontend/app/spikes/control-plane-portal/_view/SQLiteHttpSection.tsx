"use client";

import { Alert, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import NoEncryptionGmailerrorredIcon from "@mui/icons-material/NoEncryptionGmailerrorred";
import { SectionCard } from "@/app/_ui/shared";
import { BoundaryCard } from "./SpikeCards";

export type SQLiteHttpReport = {
  ok: boolean;
  migration: {
    requiredTablesPresent: boolean;
    createdTables: string[];
  };
  http: {
    signUpEmailStatus: number;
    createOrganizationStatus: number;
    listOrganizationsStatus: number;
    sessionCookieIssued: boolean;
  };
  persisted: {
    userCount: number;
    sessionCount: number;
    organizationCount: number;
    memberCount: number;
    createdOrganizationSlug: string | null;
    creatorRole: string | null;
  };
  boundary: {
    governanceAuthorityGrantedByPortal: false;
    neo4jUsedAsAccountStore: false;
    contentPlaneRead: false;
  };
};

export function SQLiteHttpSection({
  report,
  messages,
}: {
  report: SQLiteHttpReport;
  messages: Record<string, string>;
}) {
  return (
    <SectionCard title={messages.sqliteHttpTitle} subtitle={messages.sqliteHttpSubtitle}>
      <Box sx={{ display: "grid", gridTemplateColumns: { md: "1fr 1fr 1fr" }, gap: 2 }}>
        <BoundaryCard
          icon={
            report.ok ? <CheckCircleIcon color="success" /> : <LockIcon color="error" />
          }
          title={messages.sqliteHttpFlow}
          items={[
            `sign-up/email: ${report.http.signUpEmailStatus}`,
            `organization/create: ${report.http.createOrganizationStatus}`,
            `organization/list: ${report.http.listOrganizationsStatus}`,
            report.http.sessionCookieIssued ? "cookie emitido" : "sem cookie",
          ]}
        />
        <BoundaryCard
          icon={<CheckCircleIcon color="success" />}
          title={messages.sqliteHttpPersistence}
          items={[
            `${report.persisted.userCount} usuario`,
            `${report.persisted.sessionCount} sessao`,
            `${report.persisted.organizationCount} organizacao`,
            `${report.persisted.memberCount} membership`,
            `role: ${report.persisted.creatorRole ?? "sem role"}`,
          ]}
        />
        <BoundaryCard
          icon={<NoEncryptionGmailerrorredIcon color="primary" />}
          title={messages.sqliteHttpBoundary}
          items={[
            report.boundary.governanceAuthorityGrantedByPortal
              ? "authority vazou"
              : "zero authority governada",
            report.boundary.neo4jUsedAsAccountStore
              ? "Neo4j usado em conta"
              : "Neo4j fora do store",
            report.boundary.contentPlaneRead ? "conteudo lido" : "sem leitura do content plane",
          ]}
        />
      </Box>
      <Alert severity={report.ok ? "success" : "error"} variant="outlined" sx={{ mt: 2 }}>
        {report.ok ? messages.sqliteHttpProofOk : messages.sqliteHttpProofRisk}
      </Alert>
    </SectionCard>
  );
}
