if (typeof bbRenderNavigation === "function") bbRenderNavigation("#bb-nav", "adoption");
if (typeof bbRenderFooter === "function") bbRenderFooter("#bb-footer");

const bbAnimalId = new URLSearchParams(window.location.search).get("animal_id");
const bbSummaryEl = document.getElementById("bb-animal-summary");
const bbForm = document.getElementById("bb-adoption-form");
const bbSubmitBtn = document.getElementById("bb-submit-btn");
const bbFormAlert = document.getElementById("bb-form-alert");
let bbHasSubmitted = false; // trava de envio duplicado

async function bbLoadSummary() {
  if (!bbAnimalId) {
    bbSummaryEl.innerHTML = bbStateHtml({
      title: "Nenhum animal selecionado.",
      description: 'Volte para a lista de animais e escolha um antes de continuar.',
    });
    bbForm.style.display = "none";
    return;
  }
  try {
    const animal = await animalService.getById(bbAnimalId);
    const imageHtml = animal.imagem
      ? `<img src="${animal.imagem}" alt="${animal.nome}" class="w-full h-full object-cover" />`
      : "";
    bbSummaryEl.innerHTML = `
      <div class="bb-card bb-card--tight mb-6 flex gap-4 items-center animate-fade-in-up">
        <div class="bb-animal-card__image w-20 h-20 rounded-lg shrink-0${animal.imagem ? "" : " bb-animal-card__image--empty"}">${imageHtml}</div>
        <div>
          <strong class="text-ink-100">${animal.nome}</strong>
          <p class="mt-1 mb-0 text-ink-300 text-sm">
            ${animal.raca || "SRD"} | ${animal.idade_aproximada}
          </p>
        </div>
      </div>
    `;
  } catch (err) {
    bbSummaryEl.innerHTML = bbStateHtml({ title: "Animal não encontrado.", description: err.message, isError: true });
    bbForm.style.display = "none";
  }
}

function bbClearErrors() {
  bbFormAlert.innerHTML = "";
  document.querySelectorAll(".bb-error-text").forEach((el) => (el.textContent = ""));
}

bbForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (bbHasSubmitted) return; // previne envio duplicado
  bbClearErrors();

  const data = {
    animal_id: bbAnimalId,
    nome_adotante: document.getElementById("nome").value.trim(),
    email_adotante: document.getElementById("email").value.trim(),
    telefone_adotante: document.getElementById("telefone").value.trim(),
    ja_teve_animais: bbForm.querySelector('input[name="ja_teve"]:checked')?.value || "",
    ja_vacinado: bbForm.querySelector('input[name="ja_vacinado"]:checked')?.value || "",
    motivacao: document.getElementById("motivacao").value.trim(),
  };

  const errors = bbValidation.runRules(data, {
    nome_adotante: [{ test: bbValidation.isRequired, message: "Informe seu nome." }],
    email_adotante: [
      { test: bbValidation.isRequired, message: "Informe seu email." },
      { test: bbValidation.isEmail, message: "Email inválido." },
    ],
    telefone_adotante: [{ test: bbValidation.isRequired, message: "Informe um telefone de contato." }],
    motivacao: [{ test: bbValidation.isRequired, message: "Conte um pouco sobre você." }],
  });

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => {
      const id = field.replace("_adotante", "");
      const errorEl = document.getElementById(`${id}-error`);
      if (errorEl) errorEl.textContent = message;
    });
    return;
  }

  bbHasSubmitted = true;
  bbSubmitBtn.disabled = true;
  bbSubmitBtn.innerHTML = '<span class="bb-btn__spinner" aria-hidden="true"></span> Enviando...';

  try {
    await adoptionService.create(data);
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--success">Solicitação enviada! Nossa equipe entrará em contato em breve.</div>`;
    bbForm.style.display = "none";
  } catch (err) {
    bbHasSubmitted = false;
    bbSubmitBtn.disabled = false;
    bbSubmitBtn.textContent = "Finalizar solicitação";
    bbFormAlert.innerHTML = `<div class="bb-alert bb-alert--error">${err.message}</div>`;
  }
});

bbLoadSummary();
