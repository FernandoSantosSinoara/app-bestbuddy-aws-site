/**
 * Utilitário de Limitação de Cliques (Anti-Spam / Rate Limiting de Botões)
 * Previne múltiplos cliques excessivos, abusos de requisições e ataques de repetição.
 * Suporta contagem máxima de cliques, tempo de recarga (cooldown) e persistência via localStorage.
 */
const bbClickLimiter = {
  /**
   * Conecta a proteção de limite de cliques a um botão específico.
   *
   * @param {HTMLElement|string} buttonOrSelector - O elemento HTML do botão ou seletor CSS
   * @param {Object} options
   * @param {number} [options.maxClicks=10] - Quantidade máxima de cliques permitidos antes do bloqueio
   * @param {number} [options.cooldownSeconds=15] - Tempo de espera (em segundos) após atingir o limite
   * @param {string} [options.storageKey] - Chave única para salvar o bloqueio no localStorage (resiste ao F5)
   * @param {string} [options.blockedText='Aguarde {s}s...'] - Texto exibido no botão durante o bloqueio ({s} é o tempo)
   * @param {Function} [options.onLimitReached] - Chamado quando o botão entra em bloqueio
   * @param {Function} [options.onUnlocked] - Chamado quando o tempo de bloqueio encerra
   * @returns {Object} Controle da instância com { isBlocked, recordClick, reset, getRemainingSeconds }
   */
  attach(buttonOrSelector, options = {}) {
    const btn = typeof buttonOrSelector === "string"
      ? document.querySelector(buttonOrSelector)
      : buttonOrSelector;

    if (!btn) {
      return null;
    }

    // Se já estiver com limitador anexado, reutiliza a instância existente
    if (btn._bbLimiterInstance) {
      return btn._bbLimiterInstance;
    }

    const maxClicks = options.maxClicks ?? 10;
    const cooldownSeconds = options.cooldownSeconds ?? 15;
    const storageKey = options.storageKey ? `bb_limiter_${options.storageKey}` : null;
    let originalText = btn.innerHTML;
    let timerId = null;
    let lastRecordedTimestamp = 0;

    function getState() {
      if (!storageKey) return { clicks: 0, blockedUntil: 0 };
      try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : { clicks: 0, blockedUntil: 0 };
      } catch {
        return { clicks: 0, blockedUntil: 0 };
      }
    }

    function saveState(state) {
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (e) {
        console.warn("[bbClickLimiter] Erro ao salvar estado:", e);
      }
    }

    let state = getState();

    function getRemainingSeconds() {
      const now = Date.now();
      if (!state.blockedUntil || state.blockedUntil <= now) return 0;
      return Math.ceil((state.blockedUntil - now) / 1000);
    }

    function isBlocked() {
      return getRemainingSeconds() > 0;
    }

    function startCooldown(initialSeconds) {
      if (timerId) clearInterval(timerId);

      btn.disabled = true;
      btn.classList.add("bb-btn--disabled", "opacity-70", "cursor-not-allowed");

      const updateUI = () => {
        const remaining = getRemainingSeconds();
        if (remaining <= 0) {
          clearInterval(timerId);
          timerId = null;
          state = { clicks: 0, blockedUntil: 0 };
          saveState(state);

          btn.disabled = false;
          btn.classList.remove("bb-btn--disabled", "opacity-70", "cursor-not-allowed");
          btn.innerHTML = originalText;

          if (typeof options.onUnlocked === "function") {
            options.onUnlocked();
          }
          return;
        }

        const template = options.blockedText || "Aguarde {s}s...";
        btn.innerHTML = template.replace("{s}", remaining);

        if (typeof options.onLimitReached === "function") {
          options.onLimitReached(remaining);
        }
      };

      updateUI();
      timerId = setInterval(updateUI, 1000);
    }

    // Se já estava com bloqueio ativo (ex: recarregou a página)
    const activeRemaining = getRemainingSeconds();
    if (activeRemaining > 0) {
      startCooldown(activeRemaining);
    }

    /**
     * Registra um clique. Se atingir o limite, inicia o cooldown e retorna false.
     * Retorna true se o clique for autorizado.
     */
    function recordClick() {
      const now = Date.now();
      // Debounce para evitar duplo incremento no mesmo evento de clique
      if (now - lastRecordedTimestamp < 80) {
        return !isBlocked();
      }
      lastRecordedTimestamp = now;

      if (isBlocked()) return false;

      state.clicks = (state.clicks || 0) + 1;

      if (state.clicks >= maxClicks) {
        state.blockedUntil = Date.now() + cooldownSeconds * 1000;
        saveState(state);
        startCooldown(cooldownSeconds);
        return false;
      }

      saveState(state);
      return true;
    }

    function reset() {
      if (timerId) clearInterval(timerId);
      timerId = null;
      state = { clicks: 0, blockedUntil: 0 };
      saveState(state);

      btn.disabled = false;
      btn.classList.remove("bb-btn--disabled", "opacity-70", "cursor-not-allowed");
      btn.innerHTML = originalText;
    }

    function setOriginalText(newText) {
      originalText = newText;
      if (!isBlocked()) {
        btn.innerHTML = newText;
      }
    }

    // Interceptor de clique para bloquear a propagação se o botão estiver em cooldown
    btn.addEventListener("click", (e) => {
      if (isBlocked()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
      recordClick();
    }, true);

    const instance = {
      btn,
      isBlocked,
      recordClick,
      reset,
      getRemainingSeconds,
      setOriginalText,
      triggerCooldown: (sec = cooldownSeconds) => {
        state.blockedUntil = Date.now() + sec * 1000;
        saveState(state);
        startCooldown(sec);
      }
    };

    btn._bbLimiterInstance = instance;
    btn._bbClickLimiterAttached = true;

    return instance;
  },

  /**
   * Varre a página e aplica automaticamente o limitador a todos os botões de ação e submissão.
   */
  autoProtectAll(options = {}) {
    if (typeof document === "undefined") return;

    // Protege apenas botões de submissão de formulários para evitar spam/repetição,
    // nunca botões comuns de interface (type="button") ou links de navegação.
    const selector = options.selector || "button[type='submit'], input[type='submit'], form button:not([type])";
    const buttons = document.querySelectorAll(selector);

    buttons.forEach((btn, index) => {
      // Ignora links normais, abas, botões de modal ou expressamente desmarcados com data-no-limit
      if (btn.tagName === "A" || btn.type === "button" || btn.matches("a, [data-no-limit], .modal-close")) {
        return;
      }

      if (btn._bbClickLimiterAttached) return;

      const pathSlug = (window.location.pathname || "page").replace(/\W/g, "_");
      const buttonId = btn.id || (btn.name ? `name_${btn.name}` : `btn_${pathSlug}_${index}`);

      this.attach(btn, {
        maxClicks: options.maxClicks ?? 10,
        cooldownSeconds: options.cooldownSeconds ?? 15,
        storageKey: options.storageKey ? `${options.storageKey}_${buttonId}` : buttonId,
        blockedText: options.blockedText || "Aguarde {s}s...",
      });
    });
  }
};

// Intercepta envio de formulários via Enter ou submit caso o botão correspondente esteja bloqueado
if (typeof document !== "undefined") {
  document.addEventListener("submit", (e) => {
    const submitBtn = e.target.querySelector("button[type='submit'], input[type='submit'], button:not([type='button'])");
    if (submitBtn && submitBtn._bbLimiterInstance && submitBtn._bbLimiterInstance.isBlocked()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Auto-inicia a proteção em todos os botões da página
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bbClickLimiter.autoProtectAll());
  } else {
    bbClickLimiter.autoProtectAll();
  }
}

if (typeof window !== "undefined") {
  window.bbClickLimiter = bbClickLimiter;
}
