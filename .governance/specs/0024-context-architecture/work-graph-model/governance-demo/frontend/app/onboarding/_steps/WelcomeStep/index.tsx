import { Box, Button, Typography } from "@mui/material";
import BalanceIcon from "@mui/icons-material/Balance";
import FolderIcon from "@mui/icons-material/Folder";
import LockIcon from "@mui/icons-material/Lock";
import { Flex } from "@/app/_ui/shared";
import { WelcomeCard } from "../../_components";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

const cardIcons = {
  files: <FolderIcon />,
  privacy: <LockIcon />,
  honesty: <BalanceIcon />,
};

export function WelcomeStep() {
  const { setStep } = useOnboarding();
  return (
    <Box sx={{ maxWidth: 660, mx: "auto", display: "grid", gap: 2 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 0.6, color: "text.secondary" }}
      >
        {copy.eyebrow}
      </Typography>
      <Typography sx={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.2 }}>
        {copy.title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {copy.lead}
      </Typography>
      <Box sx={{ display: "grid", gap: 1.5, mt: 1 }}>
        {copy.cards.map((card) => (
          <WelcomeCard
            key={card.id}
            icon={cardIcons[card.id as keyof typeof cardIcons]}
            title={card.title}
            text={card.text}
          />
        ))}
      </Box>
      <Flex align="center" gap={2} sx={{ mt: 1 }}>
        <Button variant="contained" onClick={() => setStep(1)}>
          {copy.cta}
        </Button>
        <Typography variant="body2" color="text.secondary">
          {copy.note}
        </Typography>
      </Flex>
    </Box>
  );
}
