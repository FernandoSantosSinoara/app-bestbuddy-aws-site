/**
 * Configuração central do front-end Best Buddy.
 *
 * USE_MOCKS controla se os services usam dados fake (js/mocks/*) ou
 * batem no backend real.
 *
 * API_BASE_URL detecta automaticamente se está em ambiente de desenvolvimento
 * local (porta 5500 -> 8000) ou se está em produção/Docker atrás do Nginx (/api),
 * evitando problemas de Mixed Content e falhas de conexão de dispositivos externos.
 */
(function () {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const port = typeof window !== "undefined" ? window.location.port : "";
  const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1";

  // Se rodando via Live Server (ex: porta 5500), conecta na porta 8000 da API
  // Caso contrário (Docker, Nginx na porta 80, ou domínio real de produção), usa '/api' relativo
  const defaultBaseUrl =
    isLocalDev && port && port !== "80" && port !== "8000"
      ? "http://127.0.0.1:8000/api"
      : "/api";

  window.BB_CONFIG = {
    USE_MOCKS: false,
    API_BASE_URL: (window.BB_OVERRIDE_API_URL || defaultBaseUrl).replace(/\/+$/, ""),
    MOCK_LATENCY_MS: 0,
  };
})();
