/**
 * Renderiza o header + navegação do app autenticado dentro do elemento alvo.
 * activePage: "home" | "community" | "animals" | "profile" | "about"
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
    links.push({ key: "profile", label: "Meu Perfil", href: "/pages/auth/profile.html", icon: "👤" });
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
      <div class="bb-nav__user flex items-center gap-2 sm:gap-3">
        <a href="/pages/auth/profile.html" class="flex items-center gap-2 hover:opacity-80 transition-opacity text-slate-700">
          <span class="hidden sm:inline font-medium text-xs md:text-sm">Olá, ${user?.nome ? user.nome.split(" ")[0] : "Usuário"}</span>
          <div class="bb-nav__avatar overflow-hidden shrink-0">${avatarContent}</div>
        </a>
        <button class="bb-btn bb-btn--secondary !px-2.5 sm:!px-4 !py-1 sm:!py-1.5 !text-xs" id="bb-logout-btn" type="button">Sair</button>
      </div>
    `
    : `
      <div class="bb-nav__user flex items-center gap-1.5 sm:gap-2">
        <a href="/pages/auth/login.html" class="bb-btn bb-btn--secondary !px-2.5 sm:!px-4 !py-1 sm:!py-1.5 !text-xs whitespace-nowrap">Entrar</a>
        <a href="/pages/auth/register.html" class="bb-btn bb-btn--primary !px-2.5 sm:!px-4 !py-1 sm:!py-1.5 !text-xs whitespace-nowrap">Cadastre-se</a>
      </div>
    `;

  // Itens da barra inferior (Hotbar Mobile)
  const hotbarLinks = [
    { key: "home", label: "Home", href: "/pages/home/index.html", icon: "🏠" },
    { key: "animals", label: "Animais", href: "/pages/animals/index.html", icon: "🐾" },
    { key: "about", label: "Sobre", href: "/pages/about/index.html", icon: "💙" },
    isAuth
      ? { key: "profile", label: "Perfil", href: "/pages/auth/profile.html", icon: "👤" }
      : { key: "login", label: "Entrar", href: "/pages/auth/login.html", icon: "🔑" },
  ];

  const hotbarHtml = `
    <nav class="bb-hotbar-mobile" aria-label="Navegação inferior mobile">
      ${hotbarLinks
      .map(
        (link) => `
        <a href="${link.href}" class="bb-hotbar-item${link.key === activePage ? " is-active" : ""}">
          <span class="bb-hotbar-icon">${link.icon}</span>
          <span class="bb-hotbar-label">${link.label}</span>
        </a>
      `
      )
      .join("")}
    </nav>
  `;

  const el = document.querySelector(targetSelector);
  if (!el) return;

  const existingHeader = el.querySelector(".bb-header");
  if (!existingHeader || isAuth) {
    el.innerHTML = `
    <div class="bb-topbar"></div>
    <header class="bb-header">
      <div class="bb-container bb-header__bar bb-header__bar--nav">
        <a href="/pages/home/index.html" class="bb-logo shrink-0">
          <span class="bb-logo__text bb-logo__text--dark">Best</span><span class="bb-logo__text bb-logo__text--accent">Buddy</span>
        </a>
        <nav aria-label="Navegação principal" class="bb-header__nav-wrap">
          <ul class="bb-nav__links">${linksHtml}</ul>
        </nav>
        ${userAreaHtml}
      </div>
    </header>
    ${hotbarHtml}
  `;
  }

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

