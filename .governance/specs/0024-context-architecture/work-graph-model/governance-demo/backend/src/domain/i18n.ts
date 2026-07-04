// i18n.ts — typed product message contract.

export type MessageParams = Record<string, string | number | boolean | null | undefined>;

export type MessageDescriptor = {
  key: string;
  params?: MessageParams;
};

export type LocaleDictionary = {
  locale: string;
  messages: Record<string, string>;
};

export function interpolateMessage(template: string, params: MessageParams = {}): string {
  return template.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_match, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
}

export function translate(
  dictionary: LocaleDictionary,
  descriptor: MessageDescriptor | string,
  fallback = ""
): string {
  const key = typeof descriptor === "string" ? descriptor : descriptor.key;
  const params = typeof descriptor === "string" ? undefined : descriptor.params;
  const template = dictionary.messages[key] || fallback || key;
  return interpolateMessage(template, params);
}
