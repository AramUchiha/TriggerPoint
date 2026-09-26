/** Demo mode is on only when the first `demo` search param is exactly "1". */
export function parseDemoFlag(value: string | string[] | undefined): boolean {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "1";
}
