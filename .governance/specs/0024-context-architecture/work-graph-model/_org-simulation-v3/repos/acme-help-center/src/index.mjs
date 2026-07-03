import { resolveUserContext } from "../../acme-web-host/src/index.mjs";

const articles = [
  { id: "art-billing-upgrade", tags: ["billing", "upgrade"], title: "Upgrade your plan" },
  {
    id: "art-checkout-coupon",
    tags: ["checkout", "coupon"],
    title: "Troubleshoot coupon failures",
  },
  { id: "art-consent", tags: ["privacy", "consent"], title: "Manage consent preferences" },
];

export function searchArticles(query) {
  const needle = query.toLowerCase();
  return articles.filter((article) =>
    [article.title, ...article.tags].some((value) => value.toLowerCase().includes(needle))
  );
}

export function openTicket({ sessionId, subject, tags = [] }) {
  const context = resolveUserContext(sessionId);
  return {
    id: `ticket-${subject.toLowerCase().replaceAll(" ", "-")}`,
    accountId: context.accountId,
    subject,
    tags,
    status: "open",
  };
}

export function chatbotReply({ query }) {
  const matches = searchArticles(query);
  return matches.length
    ? { answer: `Suggested article: ${matches[0].title}`, article: matches[0].id }
    : { answer: "No article found; opening a support ticket is recommended.", article: null };
}
