/**
 * Renderiza o header + navegação do app autenticado dentro do elemento alvo.
 * activePage: "home" | "community" | "animals" | "profile"
 */
function bbRenderNavigation(targetSelector, activePage) {
  const isAuth = typeof bbStorage !== "undefined" && bbStorage.isAuthenticated();
  const user = isAuth ? bbStorage.getUser() : null;
  const initials = user?.nome ? user.nome.trim().charAt(0).toUpperCase() : "U";

  const links = [
    { key: "home", label: "Home", href: "/pages/home/index.html", icon: "🏠" },
    { key: "animals", label: "Animais", href: "/pages/animals/index.html", icon: "🐾" },
    { key: "about", label: "Sobre Nós", href: "/pages/about/index.html", icon: "💙" },
  ];

  if (isAuth) {
    links.push({ key: "profile", label: "Meu Perfil", href: "/pages/auth/profile.html" });
  }

  const linksHtml = links
    .map(
      (link) => `
      <li>
        <a class="bb-nav__link" href="${link.href}" ${link.key === activePage ? 'aria-current="page"' : ""}>
          <span>${link.label}</span>
        </a>
      </li>`
    )
    .join("");

  const avatarContent = user?.avatar
    ? `<img src="${user.avatar}" alt="Avatar" class="w-full h-full rounded-full object-cover" />`
    : initials;

  const userAreaHtml = isAuth
    ? `
      <div class="bb-nav__user flex items-center gap-3">
        <a href="/pages/auth/profile.html" class="flex items-center gap-2 hover:opacity-80 transition-opacity text-slate-200">
          <span>Olá, ${user?.nome ? user.nome.split(" ")[0] : "Usuário"}</span>
          <div class="bb-nav__avatar overflow-hidden">${avatarContent}</div>
        </a>
        <button class="bb-btn bb-btn--secondary" id="bb-logout-btn" type="button">Sair</button>
      </div>
    `
    : `
      <div class="bb-nav__user flex items-center gap-2">
        <a href="/pages/auth/login.html" class="bb-btn bb-btn--secondary bb-btn--sm">Entrar</a>
        <a href="/pages/auth/register.html" class="bb-btn bb-btn--primary bb-btn--sm">Cadastre-se</a>
      </div>
    `;

  const el = document.querySelector(targetSelector);
  if (!el) return;

  el.innerHTML = `
    <div class="bb-topbar"></div>
    <header class="bb-header">
      <div class="bb-container bb-header__bar bb-header__bar--nav">
        <a href="/pages/home/index.html" class="bb-logo">
          <span class="bb-logo__text bb-logo__text--dark">Best</span><span class="bb-logo__text bb-logo__text--accent">Buddy</span>
        </a>
        <nav aria-label="Navegação principal" class="bb-header__nav-wrap">
          <ul class="bb-nav__links">${linksHtml}</ul>
        </nav>
        ${userAreaHtml}
      </div>
    </header>
  `;

  document.getElementById("bb-logout-btn")?.addEventListener("click", () => {
    if (typeof authService !== "undefined" && authService.logout) {
      authService.logout();
    } else {
      bbStorage.clearSession();
      window.location.href = "/pages/home/index.html";
    }
  });

  if (typeof bbInitHeaderScrollEffect === "function") {
    bbInitHeaderScrollEffect(el.querySelector(".bb-header"));
  }

  if (!window._bbNavAuthListenerAttached) {
    window._bbNavAuthListenerAttached = true;
    window.addEventListener("bb:auth-state-changed", () => {
      bbRenderNavigation(targetSelector, activePage);
    });
  }
}

