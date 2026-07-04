const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const tokens = {
  color: {
    brand: "#145c9e",
    success: "#087f5b",
    warning: "#b7791f",
    danger: "#b42318",
    surface: "#ffffff",
  },
  radius: {
    control: "6px",
    card: "8px",
  },
};

export function Button({ label, variant = "primary", disabled = false }) {
  const palette = {
    primary: tokens.color.brand,
    success: tokens.color.success,
    warning: tokens.color.warning,
    danger: tokens.color.danger,
  };
  return `<button data-variant="${escapeHtml(variant)}" ${disabled ? "disabled" : ""} style="border-radius:${tokens.radius.control};background:${palette[variant] ?? palette.primary};color:white">${escapeHtml(label)}</button>`;
}

export function PlanCard({ name, price, cta = "Select" }) {
  return `<article data-component="plan-card" style="border-radius:${tokens.radius.card}"><h3>${escapeHtml(name)}</h3><p>${escapeHtml(price)}</p>${Button({ label: cta })}</article>`;
}

export function CheckoutSummary({ items, total }) {
  const rows = items.map((item) => `<li>${escapeHtml(item.name)} x${item.qty}</li>`).join("");
  return `<section data-component="checkout-summary"><ul>${rows}</ul><strong>${escapeHtml(total)}</strong></section>`;
}

export function ConsentBanner({ message, accepted = false }) {
  return `<aside data-component="consent-banner" data-accepted="${accepted}">${escapeHtml(message)} ${Button({ label: accepted ? "Accepted" : "Review", variant: accepted ? "success" : "warning" })}</aside>`;
}

export function OnboardingStep({ title, body, step, total }) {
  return `<section data-component="onboarding-step" aria-label="Step ${step} of ${total}"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></section>`;
}

export function renderDesignSystemCatalog() {
  return [
    PlanCard({ name: "Starter", price: "$29/mo" }),
    CheckoutSummary({ items: [{ name: "Starter", qty: 1 }], total: "$29.00" }),
    ConsentBanner({ message: "Analytics consent is required for experiments." }),
  ].join("\n");
}
