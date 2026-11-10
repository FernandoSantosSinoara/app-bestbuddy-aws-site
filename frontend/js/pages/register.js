// RF03: Redireciona para Home se já estiver logado
if (typeof bbStorage !== "undefined" && bbStorage.isAuthenticated()) {
  window.location.href = "/pages/home/index.html";
}

bbRenderAuthHeader("#bb-header");

const bbRegisterForm = document.getElementById("bb-register-form");
const bbSubmitBtn = document.getElementById("bb-submit-btn");
const bbFormAlert = document.getElementById("bb-form-alert");
const bbTelefoneInput = document.getElementById("telefone");

// Máscara dinâmica para o campo de telefone e validação ao perder o foco (blur)
let isPhoneChecking = false;
let phoneAlreadyInUse = false;

if (bbTelefoneInput) {
  bbTelefoneInput.addEventListener("input", (e) => {
    e.target.value = bbValidation.formatPhone(e.target.value);
    phoneAlreadyInUse = false;
  });

  bbTelefoneInput.addEventListener("blur", async () => {
    const val = bbTelefoneInput.value.trim();
    if (!val) {
      bbShowFieldError("telefone", "Informe seu número de telefone.");
      return;
    }

    if (!bbValidation.isValidBrazilianPhone(val)) {
      bbShowFieldError("telefone", "Informe um telefone válido com DDD (ex: (11) 99999-9999).");
      return;
    }

    // Se o formato é válido, checa se já está em uso
    const errorEl = document.getElementById("telefone-error");
    if (errorEl) errorEl.textContent = "";
    bbTelefoneInput.classList.remove("bb-input--error");

    isPhoneChecking = true;
    try {
      const check = await authService.checkPhoneAvailability(val);
      if (check && check.available === false) {
        phoneAlreadyInUse = true;
        bbShowFieldError("telefone", check.message || "Este telefone já está cadastrado em outra conta.");
      } else {
        phoneAlreadyInUse = false;
      }
    } catch (_) {
      // Ignora falhas temporárias de rede na checagem em tempo real
    } finally {
      isPhoneChecking = false;
    }
  });
}

const bbOpenTermsLink = document.getElementById("open-terms-link");
const bbTermosCheckbox = document.getElementById("termos-aceite");

if (bbTermosCheckbox) {
  bbTermosCheckbox.addEventListener("change", () => {
    if (bbTermosCheckbox.checked) {
      const errorEl = document.getElementById("termos-error");
      if (errorEl) errorEl.textContent = "";
    }
  });
}

if (bbOpenTermsLink) {
  bbOpenTermsLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof bbOpenTermsModal === "function") {
      bbOpenTermsModal(() => {
        if (bbTermosCheckbox) {
          bbTermosCheckbox.checked = true;
          const errorEl = document.getElementById("termos-error");
          if (errorEl) errorEl.textContent = "";
        }
      });
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
    ? '<span class="bb-btn__spinner" aria-hidden="true"></span> Criando conta...'
    : "Criar conta";
}

bbRegisterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bbClearErrors();

  const data = {
    nome: document.getElementById("nome").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    senha: document.getElementById("senha").value,
    confirmar_senha: document.getElementById("confirmar-senha").value,
  };

  const errors = bbValidation.runRules(data, {
    nome: [
      { test: bbValidation.isRequired, message: "Informe seu nome." },
      { test: (v) => bbValidation.minLength(v, 3), message: "O nome deve ter no mínimo 3 caracteres." },
      { test: bbValidation.isAlphanumericName, message: "O nome deve conter apenas letras, sem caracteres especiais proibidos." },
    ],
    email: [
      { test: bbValidation.isRequired, message: "Informe seu email." },
      { test: bbValidation.isEmail, message: "Informe um email válido." },
    ],
    telefone: [
      { test: bbValidation.isRequired, message: "Informe seu número de telefone." },
      { test: bbValidation.isValidBrazilianPhone, message: "Informe um telefone válido com DDD (ex: (11) 99999-9999)." },
    ],
    senha: [
      { test: bbValidation.isRequired, message: "Informe sua senha." },
      { test: (v) => bbValidation.minLength(v, 8), message: "A senha deve ter no mínimo 8 caracteres." },
      { test: (v) => /[A-Z]/.test(v || ""), message: "A senha deve conter ao menos uma letra maiúscula." },
      { test: (v) => /[a-z]/.test(v || ""), message: "A senha deve conter ao menos uma letra minúscula." },
      { test: (v) => /[0-9]/.test(v || ""), message: "A senha deve conter ao menos um número." },
      { test: (v) => /[^A-Za-z0-9]/.test(v || ""), message: "A senha deve conter ao menos um caractere especial (ex: @, #, $, !)." },
    ],
    confirmar_senha: [
      { test: bbValidation.isRequired, message: "Confirme sua senha." },
      { test: (v, all) => bbValidation.passwordsMatch(v, all.senha), message: "As senhas não coincidem." },
    ],
  });

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) =>
      bbShowFieldError(field.replace("_", "-"), message)
    );
    const firstField = Object.keys(errors)[0].replace("_", "-");
    const firstInput = document.getElementById(firstField);
    if (firstInput) firstInput.focus();
    return;
  }

  if (phoneAlreadyInUse) {
    bbShowFieldError("telefone", "Este telefone já está cadastrado em outra conta.");
    document.getElementById("telefone")?.focus();
    return;
  }

  // Validação síncrona dos termos ANTES de qualquer requisição e antes do estado de loading
  if (bbTermosCheckbox && !bbTermosCheckbox.checked) {
    const errorEl = document.getElementById("termos-error");
    if (errorEl) errorEl.textContent = "Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar sua conta.";
    bbTermosCheckbox.focus();
    return;
  }

  bbSetLoading(true);

  // Validação prévia de disponibilidade do telefone antes da submissão
  try {
    const check = await authService.checkPhoneAvailability(data.telefone);
    if (check && check.available === false) {
      phoneAlreadyInUse = true;
      bbShowFieldError("telefone", check.message || "Este telefone já está cadastrado em outra conta.");
      document.getElementById("telefone")?.focus();
      bbSetLoading(false);
      return;
    }
  } catch (_) {
    // Prossiga se a rota de verificação não estiver disponível
  }

  try {
    await authService.register({
      nome: data.nome,
      email: data.email.toLowerCase(),
      telefone: data.telefone.replace(/\D/g, ""),
      password: data.senha,
      tipo: "PF",
      termos_aceitos: true,
    });
    localStorage.setItem("bb_cookie_consent", "accepted");
    const banner = document.getElementById("bb-cookie-banner");
    if (banner) banner.remove();
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--success">Conta criada com sucesso! Redirecionando para o login...</div>`;
    setTimeout(() => (window.location.href = "login.html"), 1200);
  } catch (err) {
    // Trata erros de campo retornados pelo backend (DRF)
    let handledField = false;
    if (err.payload && typeof err.payload === "object") {
      if (err.payload.nome) {
        const msg = Array.isArray(err.payload.nome) ? err.payload.nome.join(" ") : String(err.payload.nome);
        bbShowFieldError("nome", msg);
        handledField = true;
      }
      if (err.payload.telefone) {
        const msg = Array.isArray(err.payload.telefone) ? err.payload.telefone.join(" ") : String(err.payload.telefone);
        bbShowFieldError("telefone", msg);
        handledField = true;
      }
      if (err.payload.email) {
        const msg = Array.isArray(err.payload.email) ? err.payload.email.join(" ") : String(err.payload.email);
        bbShowFieldError("email", msg);
        handledField = true;
      }
      if (err.payload.password) {
        const msg = Array.isArray(err.payload.password) ? err.payload.password.join(" ") : String(err.payload.password);
        bbShowFieldError("senha", msg);
        handledField = true;
      }
    }

    if (!handledField && err.message && err.message.toLowerCase().includes("telefone")) {
      bbShowFieldError("telefone", err.message);
    }

    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--error">${err.message}</div>`;
  } finally {
    bbSetLoading(false);
  }
});

