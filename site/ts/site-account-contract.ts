export const ACCOUNT_APPS = [
  "https://dashboard.all-ai-network.org",
  "https://sponsors.all-ai-network.org",
] as const;

const DESTINATIONS = {
  chapter: { origin: ACCOUNT_APPS[0], href: `${ACCOUNT_APPS[0]}/your-chapter`, label: "Chapter dashboard" },
  member: { origin: ACCOUNT_APPS[0], href: `${ACCOUNT_APPS[0]}/me`, label: "Student dashboard" },
  sponsor: { origin: ACCOUNT_APPS[1], href: `${ACCOUNT_APPS[1]}/app`, label: "Sponsor dashboard" },
};
export type SiteAccount = {
  kind: keyof typeof DESTINATIONS;
  name: string;
  imageUrl: string | null;
  href: string;
  label: string;
};

/** Validate the display-only contract. Navigation is fixed here, never taken
 * from a message. Callers must also verify event.source is their own iframe. */
export function readAccountMessage(origin: string, value: unknown): SiteAccount[] | null {
  if (!ACCOUNT_APPS.some((app) => app === origin) || !value || typeof value !== "object") return null;
  const message = value as Record<string, unknown>;
  if (message.type !== "all-ai:account-status" || !Array.isArray(message.accounts)) return null;
  const accounts: SiteAccount[] = [];
  for (const item of message.accounts) {
    if (!item || typeof item !== "object") return null;
    const { kind, name, imageUrl } = item as Record<string, unknown>;
    if (kind !== "chapter" && kind !== "member" && kind !== "sponsor") return null;
    const destination = DESTINATIONS[kind];
    if (destination.origin !== origin || typeof name !== "string" || !name.trim()) return null;
    if (accounts.some((account) => account.kind === kind)) return null;
    let image: string | null = null;
    if (typeof imageUrl === "string") {
      try { const url = new URL(imageUrl); if (url.protocol === "https:") image = url.href; } catch { /* initials fallback */ }
    }
    accounts.push({ kind, name: name.trim().slice(0, 120), imageUrl: image, href: destination.href, label: destination.label });
  }
  return accounts;
}

export function orderAccounts(accounts: SiteAccount[]): SiteAccount[] {
  const priority = { chapter: 0, sponsor: 1, member: 2 };
  return accounts.slice().sort((a, b) => priority[a.kind] - priority[b.kind]);
}
