/**
 * Helpers para gerar mensagens de orientação ao usuário (guidance)
 */

export function buildFormatterRivalGuidance(formatterContext, packageManager) {
  if (formatterContext.rival) {
    return [
      `atenção: formatador rival detectado (${formatterContext.rival.label})`,
      `sugestão: considere usar apenas um formatador para evitar conflitos de estilo`,
    ];
  }
  return [];
}

export function buildMonorepoGuidance(monorepoContext) {
  if (monorepoContext.isMonorepo) {
    return [
      `atenção: estrutura de monorepo detectada (${monorepoContext.type})`,
      `sugestão: aplique a governança em cada pacote individual se necessário`,
    ];
  }
  return [];
}
