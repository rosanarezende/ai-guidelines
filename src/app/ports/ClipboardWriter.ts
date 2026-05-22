/**
 * Porta para escrita no clipboard do sistema.
 *
 * Implementação default em `src/infrastructure/io/NodeClipboard.ts`
 * (detecta `pbcopy`/`wl-copy`/`xclip` em runtime). Tests injetam fakes.
 *
 * Convenção: `copy()` retorna `false` quando não foi possível copiar
 * (sem clipboard disponível, subprocess falhou, etc.), nunca throw —
 * clipboard é conveniência, não barreira operacional.
 */
export interface ClipboardWriter {
  copy(text: string): Promise<boolean>;
}
