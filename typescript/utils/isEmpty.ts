export function isEmpty(text: string | null | undefined): boolean {
  if (text == null) return true;
  if (text.trim() == "") return true;
  return false;
}
