function bbRenderAuthHeader(targetSelector) {
  const el = document.querySelector(targetSelector);
  if (!el) return;
  el.innerHTML = `
    <header class="bb-auth-header">
      <a href="/pages/home/index.html" class="bb-auth-logo-badge" title="Best Buddy - Ir para a Home">
        <span class="bb-logo__text bb-logo__text--dark">Best</span><span class="bb-logo__text bb-logo__text--accent">Buddy</span>
      </a>
    </header>
  `;
}
