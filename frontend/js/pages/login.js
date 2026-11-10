// RF03: Redireciona para Home se já estiver logado
if (typeof bbStorage !== "undefined" && bbStorage.isAuthenticated()) {
  window.location.href = "/pages/home/index.html";
}

bbRenderAuthHeader("#bb-header");

const bbLoginForm = document.getElementById("bb-login-form");
const bbSubmitBtn = document.getElementById("bb-submit-btn");
const bbFormAlert = document.getElementById("bb-form-alert");
const bbConsentCheckbox = document.getElementById("login-cookie-consent");
const bbConsentError = document.getElementById("cookie-consent-error");

function bbHasCookieConsent() {
  const c = localStorage.getItem("bb_cookie_consent");
  return c === "accepted" || c === "necessary" || c === "true";
}

// Sincroniza o checkbox com o status atual de consentimento
if (bbConsentCheckbox) {
  if (bbHasCookieConsent()) {
    bbConsentCheckbox.checked = true;
  }
  bbConsentCheckbox.addEventListener("change", () => {
    if (bbConsentCheckbox.checked) {
      if (bbConsentError) bbConsentError.textContent = "";
      localStorage.setItem("bb_cookie_consent", "accepted");
      const banner = document.getElementById("bb-cookie-banner");
      if (banner) banner.remove();
    }
  });
}

function bbClearErrors() {
  bbFormAlert.innerHTML = "";
  document.querySelectorAll(".bb-error-text").forEach((el) => (el.textContent = ""));
  document.querySelectorAll(".bb-input").forEach((el) => el.classList.remove("bb-input--error"));
}

function bbShowFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (input) input.classList.add("bb-input--error");
  if (errorEl) errorEl.textContent = message;
}

function bbSetLoading(isLoading) {
  bbSubmitBtn.disabled = isLoading;
  bbSubmitBtn.innerHTML = isLoading
    ? '<span class="bb-btn__spinner" aria-hidden="true"></span> Entrando...'
    : "Entrar";
}

bbLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bbClearErrors();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const errors = bbValidation.runRules(
    { email, password },
    {
      email: [
        { test: bbValidation.isRequired, message: "Informe seu email." },
        { test: bbValidation.isEmail, message: "Email invalido." },
      ],
      password: [{ test: bbValidation.isRequired, message: "Informe sua senha." }],
    }
  );

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => bbShowFieldError(field, message));
    return;
  }

  // Validacao estrita de consentimento para armazenamento de sessao e cookies essenciais
  const checkboxEl = document.getElementById("login-cookie-consent");
  const consentGiven = (checkboxEl && checkboxEl.checked) || bbHasCookieConsent();

  if (!consentGiven) {
    const errorMsg = "Para poder utilizar este recurso, precisamos que aceite os termos de uso e armazenamento.";
    const errorEl = document.getElementById("cookie-consent-error");
    if (errorEl) {
      errorEl.textContent = errorMsg;
    }
    if (checkboxEl) checkboxEl.focus();
    return;
  }

  bbSetLoading(true);
  try {
    const session = await authService.login({ email, password });

    // Assegura registro de consentimento aceito e remove o banner flutuante
    localStorage.setItem("bb_cookie_consent", "accepted");
    const banner = document.getElementById("bb-cookie-banner");
    if (banner) banner.remove();

    bbStorage.setSession(session);

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/pages/home/index.html";
    window.location.href = next;
  } catch (err) {
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--error">${err.message}</div>`;
  } finally {
    bbSetLoading(false);
  }
});
