export function checkUnsafeTyping(content) {
  if (/\bas\s+any\b/.test(content) || /\bas\s+unknown\b/.test(content)) {
    return "Unsafe typing detected (e.g. 'as any' or 'as unknown')";
  }
  return null;
}

export function checkEmptyCatch(content) {
  if (/catch\s*\([^)]*\)?\s*\{\s*\}/.test(content) || /catch\s*\{\s*\}/.test(content)) {
    return "Empty catch block detected";
  }
  return null;
}

export function checkAsyncMisuse(content) {
  if (/await.*[\r\n]+\s*await/.test(content) && !/Promise\.all/.test(content)) {
    return "Potential async misuse detected (multiple awaits without Promise.all)";
  }
  return null;
}

export const tagDetectors = {
  typing: checkUnsafeTyping,
  errors: checkEmptyCatch,
  concurrency: checkAsyncMisuse,
};
