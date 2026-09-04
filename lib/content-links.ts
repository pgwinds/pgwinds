export function isSafeContentLink(url: string | null | undefined): url is string {
  return Boolean(url && (/^https?:\/\//.test(url) || (url.startsWith("/") && !url.startsWith("//"))));
}

export function isExternalContentLink(url: string) {
  return /^https?:\/\//.test(url);
}
