/**
 * CookieBanner.js - Best Buddy
 * Componente global de aviso de transparência e consentimento de cookies e armazenamento local (LGPD / ANPD).
 * Permanece flutuante na tela até que o usuário escolha "Aceitar" ou "Descartar".
 */

function bbInitCookieBanner() {
  // Se o usuario ja esta autenticado, a sessao ja foi autorizada e nao deve exibir o banner
  if (typeof bbStorage !== "undefined" && bbStorage.isAuthenticated()) {
    return;
  }

  const consent = localStorage.getItem("bb_cookie_consent");
  // Permanece na tela ate que haja uma escolha explicita (accepted, necessary ou legado true)
  if (consent === "accepted" || consent === "necessary" || consent === "true") {
    return;
  }

  // Evita duplicatas se já renderizado
  if (document.getElementById("bb-cookie-banner")) {
    return;
  }

  const banner = document.createElement("aside");
  banner.id = "bb-cookie-banner";
  banner.setAttribute("aria-label", "Consentimento de Cookies e Privacidade");
  banner.setAttribute("role", "region");

  // Estilos flutuantes fixos para garantir presença permanente na viewport sobre qualquer conteúdo
  banner.style.position = "fixed";
  banner.style.bottom = "1.25rem";
  banner.style.right = "1.25rem";
  banner.style.zIndex = "99999";
  banner.style.maxWidth = "28rem";
  banner.style.width = "calc(100vw - 2.5rem)";
  banner.style.backgroundColor = "#ffffff";
  banner.style.color = "#1e293b";
  banner.style.border = "1px solid #cbd5e1";
  banner.style.borderRadius = "1rem";
  banner.style.padding = "1.25rem";
  banner.style.boxShadow = "0 20px 30px -10px rgba(15, 23, 42, 0.35), 0 4px 6px -2px rgba(15, 23, 42, 0.08)";
  banner.style.fontFamily = "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  banner.style.display = "flex";
  banner.style.flexDirection = "column";
  banner.style.gap = "0.875rem";
  banner.style.transition = "transform 0.3s ease, opacity 0.3s ease";
  banner.style.opacity = "1";
  banner.style.transform = "translateY(0)";

  banner.innerHTML = `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem;">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <div style="width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" aria-hidden="true">
          <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h4 style="font-size: 0.9375rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem 0; line-height: 1.3;">
            Privacidade e Armazenamento Local
          </h4>
          <p style="font-size: 0.78125rem; color: #475569; line-height: 1.5; margin: 0;">
            Utilizamos armazenamento estritamente necessário para manter sua conta segura e preferências salvas. Você pode aceitar todos os recursos ou manter apenas os necessários.
          </p>
        </div>
      </div>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
      <a href="/pages/legal/privacy.html"
         style="font-size: 0.75rem; color: #0284c7; font-weight: 600; text-decoration: underline; padding: 0.25rem 0;">
        Política de Privacidade
      </a>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button id="bb-cookie-necessary-btn"
                type="button"
                style="background: transparent; color: #475569; font-size: 0.75rem; font-weight: 600; padding: 0.45rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s;"
                onmouseover="this.style.backgroundColor='#f1f5f9'; this.style.color='#0f172a';"
                onmouseout="this.style.backgroundColor='transparent'; this.style.color='#475569';">
          Apenas Necessários
        </button>
        <button id="bb-cookie-accept-btn"
                type="button"
                style="background-color: #0284c7; color: #ffffff; font-size: 0.75rem; font-weight: 700; padding: 0.45rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s; box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);"
                onmouseover="this.style.backgroundColor='#0369a1';"
                onmouseout="this.style.backgroundColor='#0284c7';">
          Aceitar Cookies
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  const closeBanner = (status) => {
    localStorage.setItem("bb_cookie_consent", status);
    banner.style.opacity = "0";
    banner.style.transform = "translateY(1rem)";
    setTimeout(() => {
      banner.remove();
    }, 300);
  };

  const acceptBtn = document.getElementById("bb-cookie-accept-btn");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => closeBanner("accepted"));
  }

  const necessaryBtn = document.getElementById("bb-cookie-necessary-btn");
  if (necessaryBtn) {
    necessaryBtn.addEventListener("click", () => closeBanner("necessary"));
  }

}

// Auto-inicializa quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bbInitCookieBanner);
} else {
  bbInitCookieBanner();
}
