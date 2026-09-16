import "../site-account.css";
import { ACCOUNT_APPS, orderAccounts, readAccountMessage, type SiteAccount } from "./site-account-contract";

const nav = document.querySelector<HTMLElement>(".nav__cta");
// Embedded learning-tree views have no public navigation to personalize.
if (nav && window.parent === window) initializeAccountNavigation(nav);

function initializeAccountNavigation(container: HTMLElement) {
  const original = Array.from(container.childNodes).map((node) => node.cloneNode(true));
  const frames = new Map<string, HTMLIFrameElement>();
  const accountsByOrigin = new Map<string, SiteAccount[]>();
  let lastView = "";

  const render = () => {
    const accounts = orderAccounts(Array.from(accountsByOrigin.values()).flat());
    const view = JSON.stringify(accounts);
    if (view === lastView) return;
    lastView = view;
    container.replaceChildren();
    container.classList.toggle("nav__cta--signed-in", accounts.length > 0);
    if (!accounts.length) {
      container.append(...original.map((node) => node.cloneNode(true)));
      return;
    }
    container.append(accountLink(accounts[0]));
    if (accounts.length > 1) {
      const switcher = document.createElement("details");
      switcher.className = "nav-account-switcher";
      const summary = document.createElement("summary");
      summary.setAttribute("aria-label", "Switch dashboard");
      summary.title = "Switch dashboard";
      summary.textContent = "⌄";
      const menu = document.createElement("div");
      menu.className = "nav-account-menu";
      for (const account of accounts.slice(1)) menu.append(accountLink(account));
      switcher.append(summary, menu);
      container.append(switcher);
    }
  };

  window.addEventListener("message", (event: MessageEvent) => {
    const frame = frames.get(event.origin);
    if (!frame || event.source !== frame.contentWindow) return;
    const accounts = readAccountMessage(event.origin, event.data);
    if (accounts === null) return;
    accountsByOrigin.set(event.origin, accounts);
    render();
  });
  const refresh = () => {
    for (const [origin, frame] of frames) {
      frame.contentWindow?.postMessage({ type: "all-ai:account-request" }, origin);
    }
  };
  for (const origin of ACCOUNT_APPS) {
    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.title = "Account status";
    frame.setAttribute("aria-hidden", "true");
    frame.src = `${origin}/site-account`;
    frame.addEventListener("load", refresh);
    frames.set(origin, frame);
    document.body.append(frame);
  }
  window.addEventListener("focus", refresh);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !container.contains(event.target)) closeSwitcher();
  });
  container.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const summary = container.querySelector<HTMLElement>("details[open] summary");
      closeSwitcher();
      summary?.focus();
    }
  });
  function closeSwitcher() {
    container.querySelectorAll("details[open]").forEach((details) => details.removeAttribute("open"));
  }
}

function accountLink(account: SiteAccount): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "nav-account";
  link.href = account.href;
  link.title = `${account.label} — ${account.name}`;
  const avatar = document.createElement("span");
  avatar.className = "nav-account__avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = account.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  if (account.imageUrl) {
    const image = document.createElement("img");
    image.src = account.imageUrl;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => image.remove(), { once: true });
    avatar.append(image);
  }
  const text = document.createElement("span");
  text.className = "nav-account__text";
  const name = document.createElement("span");
  name.className = "nav-account__name";
  name.textContent = account.name;
  const label = document.createElement("span");
  label.className = "nav-account__label";
  label.textContent = account.label;
  text.append(name, label);
  link.append(avatar, text);
  return link;
}
