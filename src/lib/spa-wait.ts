import type { Page } from "playwright";

/**
 * After clicks/fills on SPAs (React, YouTube, etc.), wait for JS to settle:
 * random 800–1500ms plus a best-effort network idle pass.
 */
export async function spaInteractionWait(page: Page): Promise<void> {
  const ms = 800 + Math.floor(Math.random() * 700);
  await page.waitForTimeout(ms);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}

export function isLikelySearchOrSubmitAction(clickText: string): boolean {
  const t = clickText.toLowerCase();
  return /search|suche|buscar|rechercher|magnify|🔍|\bgo\b|submit|suchen|find|query/.test(t);
}

/**
 * If navigation did not occur, try Enter (common SPA / search fallback). Returns true if URL changed.
 */
export async function tryEnterFallbackForSlowSpa(
  page: Page,
  urlBefore: string
): Promise<boolean> {
  if (page.url() !== urlBefore) return true;
  await page.keyboard.press("Enter");
  await spaInteractionWait(page);
  return page.url() !== urlBefore;
}
