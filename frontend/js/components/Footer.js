function bbRenderFooter(targetSelector) {
  const el = document.querySelector(targetSelector);
  if (!el) return;

  const aboutPath = window.location.protocol === "file:" ? "../about/index.html" : "/pages/about/index.html";

  el.innerHTML = `
    <footer class="bb-footer" style="background-color: #0c2340 !important; color: #e2e8f0; width: 100%; padding: 1.75rem 0; margin-top: 4rem; border-top: 1px solid #1a3a60;">
      <div class="bb-container" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-family: 'Baloo 2', 'Sora', sans-serif; font-size: 1.15rem; font-weight: 700; color: #ffffff;">
          <span>Best <span style="color: #6fb4ee;">Buddy</span></span>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 0.8rem;">
          &copy; 2026 Best Buddy | Adoção responsável com amor.
        </div>

        <div style="display: flex; align-items: center; gap: 1.5rem; font-size: 0.8rem; flex-wrap: wrap;">
          <a href="${aboutPath}" id="bb-footer-link-about" style="color: #cbd5e1; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#cbd5e1'">Sobre nós</a>
          <a href="/pages/animals/index.html" style="color: #cbd5e1; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#cbd5e1'">Contato</a>
          <a href="/pages/legal/terms.html" style="color: #cbd5e1; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#cbd5e1'">Termos de Uso</a>
          <a href="/pages/legal/privacy.html" style="color: #cbd5e1; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#cbd5e1'">Privacidade & Cookies</a>
        </div>
      </div>
    </footer>
  `;

  if (typeof bbInitCookieBanner === "function") {
    bbInitCookieBanner();
  }
}

