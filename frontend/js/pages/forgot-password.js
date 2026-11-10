// RF03: Redireciona para Home se já estiver logado
if (typeof bbStorage !== "undefined" && bbStorage.isAuthenticated()) {
  window.location.href = "/pages/home/index.html";
}

bbRenderAuthHeader("#bb-header");

const bbRequestForm = document.getElementById("bb-request-form");
const bbConfirmForm = document.getElementById("bb-confirm-form");
const bbFormAlert = document.getElementById("bb-form-alert");
let bbResetEmail = "";

function bbClearErrors() {
  bbFormAlert.innerHTML = "";
  document.querySelectorAll(".bb-error-text").forEach((el) => (el.textContent = ""));
}

bbRequestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bbClearErrors();

  const email = document.getElementById("email").value.trim();
  if (!bbValidation.isEmail(email)) {
    document.getElementById("email-error").textContent = "Email inválido.";
    return;
  }

  const btn = document.getElementById("bb-request-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="bb-btn__spinner" aria-hidden="true"></span> Enviando...';

  try {
    const res = await authService.requestPasswordReset(email);
    bbResetEmail = email;
    bbRequestForm.style.display = "none";
    bbConfirmForm.style.display = "block";
    let msg = "Instruções enviadas! Confira seu e-mail para obter o token de redefinição.";
    if (res && res.token_dev) {
      msg += ` <div class="mt-2 text-xs text-amber-300 font-mono break-all bg-black/40 p-2 rounded border border-amber-500/30"><strong>Token de teste:</strong> ${res.token_dev}</div>`;
      const pinInput = document.getElementById("pin");
      if (pinInput && !pinInput.value) pinInput.value = res.token_dev;
    }
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--success">${msg}</div>`;
  } catch (err) {
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--error">${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar PIN";
  }
});

bbConfirmForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  bbClearErrors();

  const pin = document.getElementById("pin").value.trim();
  const novaSenha = document.getElementById("nova-senha").value;

  if (!bbValidation.isRequired(pin)) {
    document.getElementById("pin-error").textContent = "Informe o PIN recebido.";
    return;
  }
  if (!bbValidation.isRequired(novaSenha)) {
    document.getElementById("nova-senha-error").textContent = "Informe a nova senha.";
    return;
  }
  if (!bbValidation.isStrongPassword(novaSenha)) {
    document.getElementById("nova-senha-error").textContent = "A senha deve ter no mínimo 8 caracteres, contendo letra maiúscula, minúscula, número e caractere especial.";
    return;
  }

  const btn = document.getElementById("bb-confirm-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="bb-btn__spinner" aria-hidden="true"></span> Redefinindo...';

  try {
    await authService.confirmPasswordReset({ email: bbResetEmail, pin, password: novaSenha });
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--success">Senha redefinida! Redirecionando para o login...</div>`;
    setTimeout(() => (window.location.href = "login.html"), 1200);
  } catch (err) {
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--error">${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Redefinir senha";
  }
});
