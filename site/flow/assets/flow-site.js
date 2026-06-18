(function applyFlowCopy() {
  const copy = window.AI_GUIDELINES_FLOW_COPY;
  if (!copy) return;

  function fromPath(path) {
    return path.split(".").reduce((current, key) => {
      if (!current || typeof current !== "object") return undefined;
      return current[key];
    }, copy);
  }

  function setText(selector, resolver) {
    document.querySelectorAll(selector).forEach((element) => {
      const value = resolver(element);
      if (typeof value === "string" && value.trim()) {
        element.textContent = value;
      }
    });
  }

  setText("[data-copy]", (element) => fromPath(element.dataset.copy));
  setText("[data-copy-provider-label]", (element) => {
    return copy.providers?.[element.dataset.copyProviderLabel]?.label;
  });
  setText("[data-copy-provider-html-hint]", (element) => {
    return copy.providers?.[element.dataset.copyProviderHtmlHint]?.htmlHint;
  });
  setText("[data-copy-feature-html-label]", (element) => {
    return copy.features?.[element.dataset.copyFeatureHtmlLabel]?.htmlLabel;
  });
})();

(function initMiniCarousels() {
  document.querySelectorAll("[data-mini-carousel]").forEach((carousel) => {
    const tabs = Array.from(carousel.querySelectorAll("[data-mini-slide]"));
    const panels = Array.from(carousel.querySelectorAll("[data-mini-panel]"));
    if (tabs.length === 0 || panels.length === 0) return;

    function activate(slide) {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.miniSlide === slide;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.miniPanel === slide);
      });
    }

    tabs.forEach((tab) => {
      tab.setAttribute("type", "button");
      tab.addEventListener("click", () => activate(tab.dataset.miniSlide));
    });

    const initial = tabs.find((tab) => tab.classList.contains("is-active")) ?? tabs[0];
    activate(initial.dataset.miniSlide);
  });
})();
