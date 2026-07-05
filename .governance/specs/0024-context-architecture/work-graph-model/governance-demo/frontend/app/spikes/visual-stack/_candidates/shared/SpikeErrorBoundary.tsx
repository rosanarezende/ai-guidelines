"use client";

// SpikeErrorBoundary — captura erro de render de um candidato sem derrubar a
// tela comparativa; o erro vira evidência do spike, não crash da página.
import { Alert } from "@mui/material";
import { Component, type ReactNode } from "react";

type Props = { candidate: string; children: ReactNode; onError?: (message: string) => void };
type State = { error: string | null };

export class SpikeErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  override componentDidCatch(error: unknown): void {
    this.props.onError?.(error instanceof Error ? error.message : String(error));
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <Alert severity="error" variant="outlined">
          {this.props.candidate}: erro de render — {this.state.error}
        </Alert>
      );
    }
    return this.props.children;
  }
}
