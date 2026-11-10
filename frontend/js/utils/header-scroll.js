/**
 * Ao dar scroll na página, marca o header com a classe "bb-header--scrolled".
 * O CSS (ver .bb-header__nav-wrap / .bb-nav__user / .bb-header--scrolled em
 * input.css) cuida de encolher os links de navegação e as infos do usuário,
 * fazendo o título "BestBuddy" deslizar suavemente para o centro da barra.
 *
 * Chamado tanto por Navigation.js (app autenticado) quanto por
 * AuthHeader.js (telas de login/cadastro), então funciona em todas as
 * páginas do site.
 */
function bbInitHeaderScrollEffect(headerEl) {
  if (!headerEl) return;

  const THRESHOLD = 40;

  function onScroll() {
    const isScrolled = window.scrollY > THRESHOLD;
    headerEl.classList.toggle("bb-header--scrolled", isScrolled);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
