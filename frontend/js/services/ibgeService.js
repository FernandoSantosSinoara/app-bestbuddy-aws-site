/**
 * ibgeService.js - Integração com API de Localidades do IBGE.
 * Documentação completa: vault/01 - Frontend/03 - Serviços e Camada de API.md
 */

const ESTADOS_BRASIL = Object.freeze([
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
]);

const _memoryCache = new Map();
const CACHE_PREFIX = "bb_ibge_cidades_";
const REQUEST_TIMEOUT_MS = 8000;

const ibgeService = {
  /**
   * Retorna as 27 UFs do Brasil de forma síncrona.
   */
  getEstados() {
    return ESTADOS_BRASIL;
  },

  /**
   * Valida se a sigla da UF existe.
   */
  isUfValida(uf) {
    if (!uf || typeof uf !== "string") return false;
    const cleanUf = uf.trim().toUpperCase();
    return ESTADOS_BRASIL.some((e) => e.sigla === cleanUf);
  },

  /**
   * Obtém cidades por UF com cache (RAM -> sessionStorage -> API IBGE).
   */
  async getCidadesPorEstado(uf) {
    if (!uf) return [];

    const cleanUf = uf.trim().toUpperCase();
    if (!this.isUfValida(cleanUf)) {
      throw new Error(`UF inválida: "${uf}". Informe uma das 27 siglas da federação.`);
    }

    // 1. Cache RAM
    if (_memoryCache.has(cleanUf)) {
      return _memoryCache.get(cleanUf);
    }

    // 2. Cache sessionStorage
    const storageKey = `${CACHE_PREFIX}${cleanUf}`;
    try {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          _memoryCache.set(cleanUf, parsed);
          return parsed;
        }
      }
    } catch (storageErr) {
      console.warn("[ibgeService] Leitura de sessionStorage indisponível:", storageErr);
    }

    // 3. Consulta à API do IBGE com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${cleanUf}/municipios?orderBy=nome`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Erro IBGE: status ${response.status} (${response.statusText})`);
      }

      const rawData = await response.json();
      const cidades = Array.isArray(rawData)
        ? rawData
            .filter((item) => item && item.nome)
            .map((item) => ({
              id: item.id,
              nome: item.nome,
            }))
        : [];

      _memoryCache.set(cleanUf, cidades);

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(cidades));
      } catch (storageWriteErr) {
        console.warn("[ibgeService] Gravação em sessionStorage indisponível:", storageWriteErr);
      }

      return cidades;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`Tempo limite excedido ao consultar o IBGE para o estado ${cleanUf}.`);
      }
      console.error(`[ibgeService] Erro ao buscar cidades de ${cleanUf}:`, err);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * Limpa os dados em cache (RAM e sessionStorage).
   */
  clearCache() {
    _memoryCache.clear();
    try {
      ESTADOS_BRASIL.forEach((estado) => {
        sessionStorage.removeItem(`${CACHE_PREFIX}${estado.sigla}`);
      });
    } catch (e) {
      // noop
    }
  },
};

if (typeof window !== "undefined") {
  window.ibgeService = ibgeService;
}
