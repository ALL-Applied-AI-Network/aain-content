# Signed-in navigation on the public website

The public website is static GitHub Pages (`aain-content`). Its shared `site/ts/site-account.ts` module reads display-only account status from `/site-account` in the dashboard and sponsor apps, then replaces the header's Sign in/Get started actions with a direct dashboard link and the user's photo or chapter logo. Officers retain their student dashboard in the dashboard switcher; users signed into both apps also get the sponsor option. No public page automatically navigates away.

Each app's bridge uses its existing Clerk provider to resolve and refresh its own session. A simple cross-origin API probe is insufficient because Clerk's session JWT expires after about 60 seconds while the longer-lived browser session can remain valid. The bridge does not sign anyone in, switch active organizations, send email, or modify data.

## Security contract

- The bridges are frameable only by `https://all-ai-network.org` and `https://www.all-ai-network.org`. The exact `/site-account` route is excluded from the apps' default frame denial; all other protected pages remain unframeable.
- A bridge replies only to its actual parent and an exact allowed origin. It does nothing when visited as a top-level page.
- The public script checks both `event.origin` and `event.source` against its own iframe. It validates each role against the sending app and chooses dashboard URLs from its own fixed allowlist.
- Messages contain only a display name, optional HTTPS image and dashboard persona/destination. They contain no email address, user/org ID, session token or authorization grant. Labels are assigned using `textContent`.
- Sign-out sends an empty account list. The other app's state is retained independently. Header data is kept only in memory, never cookies or local storage.
- The main site and apps are same-site subdomains. Other top-level domains, localhost and arbitrary preview domains are deliberately unsupported; those visitors keep the ordinary sign-in links. This is navigation convenience, never an authorization boundary. Each destination still applies its normal auth checks.

## Deployment and checks

Deploy the dashboard and sponsor app bridges before publishing the static site's header update. A missing/unavailable bridge safely leaves the existing sign-in navigation intact.

Run `node --test scripts/test-site-account.cjs` in each app and `npx tsx --test scripts/test-site-account.ts` in `aain-content`. Check signed-out, member, organizer, sponsor, and combined accounts on desktop and mobile; verify the dashboard switcher and that signing out removes only the relevant app's account.
