export function isUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
  return false;
}