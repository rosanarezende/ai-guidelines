import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { Flex } from "./Flex";

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Flex justify="space-between" gap={2} align="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h2">{title}</Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
        </Flex>
        <Divider sx={{ my: 1.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}
