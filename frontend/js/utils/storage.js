/**
 * Wrapper fino sobre localStorage para dados de sessão.
 * Centralizado aqui para facilitar trocar a estratégia depois
 * (ex.: cookies httpOnly) sem mexer nos services.
 */
const BB_STORAGE_KEYS = {
  ACCESS_TOKEN: "bb_access_token",
  REFRESH_TOKEN: "bb_refresh_token",
  USER: "bb_user",
};

const bbStorage = {
  setSession({ access, refresh, user }) {
    if (access || refresh) {
      localStorage.setItem("bb_cookie_consent", "accepted");
      const banner = document.getElementById("bb-cookie-banner");
      if (banner) banner.remove();
    }
    if (access) localStorage.setItem(BB_STORAGE_KEYS.ACCESS_TOKEN, access);
    if (refresh) localStorage.setItem(BB_STORAGE_KEYS.REFRESH_TOKEN, refresh);
    if (user) localStorage.setItem(BB_STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getAccessToken() {
    return localStorage.getItem(BB_STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken() {
    return localStorage.getItem(BB_STORAGE_KEYS.REFRESH_TOKEN);
  },

  setAccessToken(access) {
    if (access) {
      localStorage.setItem(BB_STORAGE_KEYS.ACCESS_TOKEN, access);
    } else {
      localStorage.removeItem(BB_STORAGE_KEYS.ACCESS_TOKEN);
    }
  },

  getUser() {
    const raw = localStorage.getItem(BB_STORAGE_KEYS.USER);
    let user = raw ? JSON.parse(raw) : null;
    if (user && !user.id) {
      const token = this.getAccessToken();
      if (token) {
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            ));
            if (payload.user_id) {
              user.id = payload.user_id;
              this.setUser(user);
            }
          }
        } catch (_) {}
      }
    }
    return user;
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(BB_STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(BB_STORAGE_KEYS.USER);
    }
  },

  isTokenExpired(token) {
    if (!token || typeof token !== "string") return true;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return false; // Mock ou formato não-JWT

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;

      // exp está em segundos, Date.now() em milissegundos
      return Date.now() >= payload.exp * 1000;
    } catch (_) {
      return false;
    }
  },

  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;

    // Se o token de acesso já expirou
    if (this.isTokenExpired(token)) {
      const refresh = this.getRefreshToken();
      // Se não há refresh token ou ele também já expirou, limpa a sessão
      if (!refresh || this.isTokenExpired(refresh)) {
        this.clearSession();
        return false;
      }
      // Se o refresh ainda é válido, a sessão ainda pode ser salva via silent refresh
      return true;
    }

    return true;
  },

  clearSession() {
    localStorage.removeItem(BB_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(BB_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(BB_STORAGE_KEYS.USER);
  },

  handleSessionExpired() {
    this.clearSession();
    window.dispatchEvent(new CustomEvent("bb:auth-state-changed", { detail: { authenticated: false } }));

    const isProtected =
      Boolean(window.BB_IS_PROTECTED_PAGE) ||
      window.location.pathname.includes("/auth/profile.html") ||
      window.location.pathname.includes("/adoption/create.html");

    if (isProtected) {
      window.location.href = "/pages/home/index.html?session=expired";
    }
  },
};
