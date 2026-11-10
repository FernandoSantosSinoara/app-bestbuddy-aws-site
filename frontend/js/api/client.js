/**
 * Cliente HTTP fino sobre fetch, usado somente quando
 * BB_CONFIG.USE_MOCKS === false.
 */
class BBApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

/**
 * O DRF, quando a validação de um serializer falha, devolve um objeto
 * tipo { "password": ["Este campo é obrigatório."], "email": [...] }
 * (sem uma chave "detail"). Sem isso, o front mostrava sempre uma
 * mensagem genérica, escondendo o motivo real do erro.
 */
function bbExtractErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  if (typeof data === "object") {
    const parts = Object.entries(data).map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      return field === "non_field_errors" || field === "error" || field === "detail" ? text : `${field}: ${text}`;
    });
    if (parts.length) return parts.join(" | ");
  }
  return fallback;
}

const bbClient = {
  _refreshPromise: null,

  async refreshAccessToken() {
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = (async () => {
      if (typeof bbStorage === "undefined") return null;

      const refresh = bbStorage.getRefreshToken();
      if (!refresh || bbStorage.isTokenExpired(refresh)) {
        return null;
      }

      try {
        const response = await fetch(`${window.BB_CONFIG.API_BASE_URL}/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        if (data && data.access) {
          bbStorage.setAccessToken(data.access);
          return data.access;
        }
      } catch (_) {
        return null;
      } finally {
        this._refreshPromise = null;
      }
      return null;
    })();

    return this._refreshPromise;
  },

  async request(path, { method = "GET", body, auth = true, isRetry = false } = {}) {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const headers = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (auth && typeof bbStorage !== "undefined") {
      let token = bbStorage.getAccessToken();

      // Se o token de acesso estiver expirado, tenta renovar silenciosamente antes de disparar
      if (token && bbStorage.isTokenExpired(token) && !isRetry) {
        token = await this.refreshAccessToken();
        if (!token) {
          bbStorage.handleSessionExpired();
          // Se for requisição GET (como listar animais públicos), tenta novamente sem auth
          if (method === "GET") {
            return this.request(path, { method, body, auth: false, isRetry: true });
          }
          throw new BBApiError("Sessão expirada. Faça login novamente.", 401, null);
        }
      }

      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${window.BB_CONFIG.API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      });
    } catch (networkError) {
      throw new BBApiError("Não foi possível conectar ao servidor.", 0, null);
    }

    // Se receber 401 Unauthorized em requisição autenticada
    if (response.status === 401 && auth && !isRetry && !path.includes("/token/")) {
      const refreshedToken = await this.refreshAccessToken();
      if (refreshedToken) {
        // Tenta novamente a requisição original com o novo token
        return this.request(path, { method, body, auth, isRetry: true });
      } else {
        // Refresh token expirou ou falhou: encerra a sessão e redireciona se necessário
        if (typeof bbStorage !== "undefined") {
          bbStorage.handleSessionExpired();
        }
        // Se for requisição GET pública, tenta sem auth em vez de travar a tela
        if (method === "GET") {
          return this.request(path, { method, body, auth: false, isRetry: true });
        }
        throw new BBApiError("Sua sessão expirou.", 401, null);
      }
    }

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      // corpo vazio, ok
    }

    if (!response.ok) {
      throw new BBApiError(
        bbExtractErrorMessage(data, "Ocorreu um erro ao processar sua solicitação."),
        response.status,
        data
      );
    }

    return data;
  },

  get(path, opts) {
    return this.request(path, { ...opts, method: "GET" });
  },
  post(path, body, opts) {
    return this.request(path, { ...opts, method: "POST", body });
  },
  patch(path, body, opts) {
    return this.request(path, { ...opts, method: "PATCH", body });
  },
  delete(path, opts) {
    return this.request(path, { ...opts, method: "DELETE" });
  },
};
