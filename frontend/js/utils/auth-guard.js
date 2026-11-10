/**
 * Inclua este script nas páginas que exigem login.
 * Se não houver sessão ativa ou se tiver expirado, redireciona para a Home.
 */
window.BB_IS_PROTECTED_PAGE = true;

(function bbAuthGuard() {
  if (typeof bbStorage !== "undefined" && !bbStorage.isAuthenticated()) {
    bbStorage.clearSession();
    window.location.href = "/pages/home/index.html?session=expired";
  }
})();

