if (typeof bbRenderNavigation === "function") bbRenderNavigation("#bb-nav", "animals");
if (typeof bbRenderFooter === "function") bbRenderFooter("#bb-footer");

// Elementos principais
const bbLostGridEl = document.getElementById("bb-lost-grid");
const bbAdoptGridEl = document.getElementById("bb-adopt-grid");
const bbLostCountEl = document.getElementById("bb-lost-count");
const bbAdoptCountEl = document.getElementById("bb-adopt-count");
const bbLostToggleWrapEl = document.getElementById("bb-lost-toggle-wrap");
const bbAdoptToggleWrapEl = document.getElementById("bb-adopt-toggle-wrap");
const bbLostToggleBtn = document.getElementById("bb-lost-toggle-btn");
const bbAdoptToggleBtn = document.getElementById("bb-adopt-toggle-btn");
const bbAnimalsAlertEl = document.getElementById("bb-animals-alert");

// Elementos de Estatísticas & Animais Adotados
const bbAdoptedCountEl = document.getElementById("bb-adopted-count");
const bbAdoptedSubcountEl = document.getElementById("bb-adopted-subcount");
const bbStatAvailableCountEl = document.getElementById("bb-stat-available-count");
const bbStatLostCountEl = document.getElementById("bb-stat-lost-count");
const bbAdoptedShowcaseSectionEl = document.getElementById("bb-adopted-showcase-section");
const bbAdoptedGridEl = document.getElementById("bb-adopted-grid");
const bbToggleAdoptedGalleryBtn = document.getElementById("bb-toggle-adopted-gallery-btn");
const bbCloseAdoptedGalleryBtn = document.getElementById("bb-close-adopted-gallery-btn");
const bbAdoptionCelebrationToast = document.getElementById("bb-adoption-celebration-toast");

// Filtros e Abas
const tabAllPets = document.getElementById("tab-all-pets");
const tabMyPets = document.getElementById("tab-my-pets");
const filterBuscarPorSelect = document.getElementById("filter-buscar-por");
const filterEstadoSelect = document.getElementById("filter-estado");
const filterCidadeInput = document.getElementById("filter-cidade");
const filterCidadesDatalist = document.getElementById("filter-cidades-list");
const filterTipoAnimalSelect = document.getElementById("filter-tipo-animal");
const filterTempoSelect = document.getElementById("filter-tempo");
const filterApplyBtn = document.getElementById("filter-apply-btn");
const filterClearBtn = document.getElementById("filter-clear-btn");

// Modal
const announceBtn = document.getElementById("bb-announce-pet-btn");
const reportLostBtn = document.getElementById("bb-report-lost-btn");
const adoptModal = document.getElementById("adopt-modal");
const modalCloseBtn = document.getElementById("modal-adopt-close-btn");
const modalCancelBtn = document.getElementById("modal-adopt-cancel-btn");
const modalAlertEl = document.getElementById("modal-adopt-alert");
const formAdoptPet = document.getElementById("form-adopt-pet");
const modalSubmitBtn = document.getElementById("modal-adopt-submit-btn");
const petServicoSelect = document.getElementById("pet-servico");
const wrapPetLocal = document.getElementById("wrap-pet-local");
const petLocalInput = document.getElementById("pet-local");
const petEstadoSelect = document.getElementById("pet-estado");
const petCidadeInput = document.getElementById("pet-cidade");
const petCidadesDatalist = document.getElementById("pet-cidades-list");
const petPhoneInput = document.getElementById("pet-telefone");
const wrapPetStatus = document.getElementById("wrap-pet-status");
const petStatusSelect = document.getElementById("pet-status");
let currentEditingAnimalId = null;

const petImageInput = document.getElementById("pet-imagem");
const petImagePreviewWrap = document.getElementById("pet-imagem-preview-wrap");
const petImagePreview = document.getElementById("pet-imagem-preview");
const petImageFilename = document.getElementById("pet-imagem-filename");
const petImageFilesize = document.getElementById("pet-imagem-filesize");
const petImageClearBtn = document.getElementById("pet-imagem-clear-btn");

let optimizedImageFile = null;

const MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB (otimizado no front via Canvas antes do upload)
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isValidImageType(file) {
  if (!file) return false;
  const mime = (file.type || "").toLowerCase();
  const mimeValid = ALLOWED_IMAGE_TYPES.includes(mime);
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  const extValid = ALLOWED_IMAGE_EXTENSIONS.includes(ext);
  return mimeValid || extValid;
}

function resetImageInput() {
  optimizedImageFile = null;
  if (petImageInput) {
    petImageInput.value = "";
    petImageInput.classList.remove("bb-input--error");
  }
  const photoImg = document.getElementById("adopt-photo-img");
  if (photoImg) photoImg.innerHTML = "🐾";
  if (petImageFilename) petImageFilename.textContent = "Nenhuma foto selecionada";
  if (petImageFilesize) petImageFilesize.textContent = "JPEG, PNG ou WebP • máx 50MB (otimizada automaticamente)";
  if (petImageClearBtn) petImageClearBtn.classList.add("hidden");
  if (petImagePreviewWrap) {
    petImagePreviewWrap.classList.add("hidden");
    petImagePreviewWrap.style.display = "none";
  }
  if (petImagePreview) petImagePreview.src = "";
}

function setImagePreview(src, name, sizeText) {
  const photoImg = document.getElementById("adopt-photo-img");
  if (photoImg) {
    photoImg.innerHTML = `<img src="${src}" alt="Foto do pet" style="width:100%;height:100%;object-fit:cover;" />`;
  }
  if (petImageFilename) petImageFilename.textContent = name || "Foto do pet";
  if (petImageFilesize) petImageFilesize.textContent = sizeText || "";
  if (petImageClearBtn) petImageClearBtn.classList.remove("hidden");
  if (petImagePreviewWrap) {
    petImagePreview.src = src;
  }
}

// Estado
const INITIAL_LIMIT = 4;
let allLostAnimals = [];
let allAdoptAnimals = [];
let allAdoptedAnimals = [];
let adoptedGalleryOpen = false;
let lostExpanded = false;
let adoptExpanded = false;
let activeTab = "all"; // "all" | "my"
let filterBuscarPor = "";
let filterEstado = "";
let filterCidade = "";
let filterTipoAnimal = "";
let filterTempo = "";

function renderLost() {
  bbLostCountEl.textContent = allLostAnimals.length;

  if (!allLostAnimals.length) {
    bbLostGridEl.innerHTML = bbStateHtml({
      title: "Nenhum animal desaparecido encontrado.",
      description: "Esperamos que todos estejam em segurança com suas famílias!",
    });
    bbLostToggleWrapEl.classList.add("hidden");
    return;
  }

  const items = lostExpanded ? allLostAnimals : allLostAnimals.slice(0, INITIAL_LIMIT);
  bbLostGridEl.innerHTML = items.map(bbAnimalCardHtml).join("");

  if (allLostAnimals.length > INITIAL_LIMIT) {
    bbLostToggleWrapEl.classList.remove("hidden");
    const remaining = allLostAnimals.length - INITIAL_LIMIT;
    bbLostToggleBtn.textContent = lostExpanded
      ? "Recolher vitrine de desaparecidos"
      : `Ver mais animais perdidos (${remaining})`;
  } else {
    bbLostToggleWrapEl.classList.add("hidden");
  }
}

function renderAdopt() {
  bbAdoptCountEl.textContent = allAdoptAnimals.length;

  if (!allAdoptAnimals.length) {
    bbAdoptGridEl.innerHTML = bbStateHtml({
      title: "Nenhum animal para adoção disponível no momento.",
      description: "Todos os pets cadastrados já encontraram um lar amoroso ou não há pets para os filtros selecionados!",
    });
    bbAdoptToggleWrapEl.classList.add("hidden");
    return;
  }

  const items = adoptExpanded ? allAdoptAnimals : allAdoptAnimals.slice(0, INITIAL_LIMIT);
  bbAdoptGridEl.innerHTML = items.map(bbAnimalCardHtml).join("");

  if (allAdoptAnimals.length > INITIAL_LIMIT) {
    bbAdoptToggleWrapEl.classList.remove("hidden");
    const remaining = allAdoptAnimals.length - INITIAL_LIMIT;
    bbAdoptToggleBtn.textContent = adoptExpanded
      ? "Recolher vitrine de adoção"
      : `Ver mais animais para adoção (${remaining})`;
  } else {
    bbAdoptToggleWrapEl.classList.add("hidden");
  }
}

function renderAdopted() {
  if (!bbAdoptedGridEl) return;

  if (!allAdoptedAnimals.length) {
    bbAdoptedGridEl.innerHTML = bbStateHtml({
      title: "Nenhum animal adotado registrado ainda.",
      description: "Assim que um tutor marcar o anúncio como ADOTADO, a história de sucesso aparecerá aqui!",
    });
    return;
  }

  bbAdoptedGridEl.innerHTML = allAdoptedAnimals.map(bbAnimalCardHtml).join("");
}

async function bbLoadAnimals() {
  bbLostGridEl.innerHTML = bbSkeletonGridHtml(INITIAL_LIMIT);
  bbAdoptGridEl.innerHTML = bbSkeletonGridHtml(INITIAL_LIMIT);
  bbAnimalsAlertEl.innerHTML = "";

  const currentUser = typeof bbStorage !== "undefined" && bbStorage.getUser();

  const commonParams = {};
  if (filterEstado) commonParams.estado = filterEstado;
  if (filterCidade) commonParams.cidade = filterCidade;
  if (filterTipoAnimal) commonParams.tipo_animal = filterTipoAnimal;
  if (filterTempo) commonParams.tempo = filterTempo;
  if (activeTab === "my" && currentUser) commonParams.tutor_id = currentUser.id;

  const bbLostSection = document.getElementById("bb-lost-section");
  const bbAdoptSection = document.getElementById("bb-adopt-section");

  if (bbLostSection) {
    if (filterBuscarPor === "ADOCAO") {
      bbLostSection.classList.add("hidden");
    } else {
      bbLostSection.classList.remove("hidden");
    }
  }

  if (bbAdoptSection) {
    if (filterBuscarPor === "PERDIDO") {
      bbAdoptSection.classList.add("hidden");
    } else {
      bbAdoptSection.classList.remove("hidden");
    }
  }

  try {
    const fetchLost = filterBuscarPor !== "ADOCAO";
    const fetchAdopt = filterBuscarPor !== "PERDIDO";

    const [lostList, adoptList, stats] = await Promise.all([
      fetchLost ? animalService.list({ ...commonParams, tipo_servico: "PERDIDO" }) : Promise.resolve([]),
      fetchAdopt ? animalService.list({ ...commonParams, tipo_servico: "ADOCAO" }) : Promise.resolve([]),
      animalService.getStats().catch(() => null),
    ]);

    let rawLost = Array.isArray(lostList) ? lostList : [];
    let rawAdopt = Array.isArray(adoptList) ? adoptList : [];

    // Filtros de reforço no front-end para tempo
    if (filterTempo === "semana") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      rawLost = rawLost.filter((a) => !a.created_at || new Date(a.created_at).getTime() >= weekAgo);
      rawAdopt = rawAdopt.filter((a) => !a.created_at || new Date(a.created_at).getTime() >= weekAgo);
    } else if (filterTempo === "mes") {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      rawLost = rawLost.filter((a) => !a.created_at || new Date(a.created_at).getTime() >= monthAgo);
      rawAdopt = rawAdopt.filter((a) => !a.created_at || new Date(a.created_at).getTime() >= monthAgo);
    }

    // REGRA DE NEGÓCIO: Animais adotados saem da lista de animais para adoção!
    const availablePets = rawAdopt.filter((a) => (a.status || "").toUpperCase() !== "ADOTADO");
    const adoptedPets = rawAdopt.filter((a) => (a.status || "").toUpperCase() === "ADOTADO");

    allLostAnimals = rawLost;
    allAdoptAnimals = availablePets;
    allAdoptedAnimals = adoptedPets;

    // Atualização dos Contadores em Destaque
    const adoptedTotal = stats && typeof stats.total_adotados === "number"
      ? stats.total_adotados
      : adoptedPets.length;

    if (bbAdoptedCountEl) {
      bbAdoptedCountEl.textContent = adoptedTotal;
    }
    if (bbAdoptedSubcountEl) {
      bbAdoptedSubcountEl.textContent = adoptedTotal;
    }
    if (bbStatAvailableCountEl) {
      bbStatAvailableCountEl.textContent = availablePets.length;
    }
    if (bbStatLostCountEl) {
      bbStatLostCountEl.textContent = allLostAnimals.length;
    }

    renderLost();
    renderAdopt();
    renderAdopted();
  } catch (err) {
    bbLostGridEl.innerHTML = bbStateHtml({
      title: "Não foi possível carregar os animais desaparecidos.",
      description: err.message,
      isError: true,
    });
    bbAdoptGridEl.innerHTML = bbStateHtml({
      title: "Não foi possível carregar os animais para adoção.",
      description: err.message,
      isError: true,
    });
  }
}

// Expansão / Recolhimento
bbLostToggleBtn.addEventListener("click", () => {
  lostExpanded = !lostExpanded;
  renderLost();
});

bbAdoptToggleBtn.addEventListener("click", () => {
  adoptExpanded = !adoptExpanded;
  renderAdopt();
});

// Alternar Galeria de Pets Adotados (Finais Felizes)
if (bbToggleAdoptedGalleryBtn && bbAdoptedShowcaseSectionEl) {
  bbToggleAdoptedGalleryBtn.addEventListener("click", () => {
    adoptedGalleryOpen = !adoptedGalleryOpen;
    if (adoptedGalleryOpen) {
      bbAdoptedShowcaseSectionEl.classList.remove("hidden");
      renderAdopted();
      bbAdoptedShowcaseSectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      bbAdoptedShowcaseSectionEl.classList.add("hidden");
    }
  });
}

if (bbCloseAdoptedGalleryBtn && bbAdoptedShowcaseSectionEl) {
  bbCloseAdoptedGalleryBtn.addEventListener("click", () => {
    adoptedGalleryOpen = false;
    bbAdoptedShowcaseSectionEl.classList.add("hidden");
  });
}

// Ações de Filtro (RF08)
function applyFilters() {
  filterBuscarPor = filterBuscarPorSelect ? filterBuscarPorSelect.value : "";
  filterEstado = filterEstadoSelect ? filterEstadoSelect.value : "";
  filterCidade = filterCidadeInput ? filterCidadeInput.value.trim() : "";
  filterTipoAnimal = filterTipoAnimalSelect ? filterTipoAnimalSelect.value : "";
  filterTempo = filterTempoSelect ? filterTempoSelect.value : "";
  lostExpanded = false;
  adoptExpanded = false;
  bbLoadAnimals();
}

filterApplyBtn.addEventListener("click", applyFilters);
if (filterBuscarPorSelect) filterBuscarPorSelect.addEventListener("change", applyFilters);
filterCidadeInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applyFilters();
});
filterTipoAnimalSelect.addEventListener("change", applyFilters);
if (filterTempoSelect) filterTempoSelect.addEventListener("change", applyFilters);

if (filterEstadoSelect) {
  filterEstadoSelect.addEventListener("change", async () => {
    const uf = filterEstadoSelect.value;
    filterCidadeInput.value = "";
    if (filterCidadesDatalist) filterCidadesDatalist.innerHTML = "";

    if (!uf) {
      filterCidadeInput.placeholder = "Buscar por cidade...";
    } else {
      filterCidadeInput.placeholder = "Carregando cidades...";
      try {
        const cidades = await ibgeService.getCidadesPorEstado(uf);
        if (filterCidadesDatalist) {
          filterCidadesDatalist.innerHTML = cidades.map((c) => `<option value="${c.nome}">`).join("");
        }
        filterCidadeInput.placeholder = `Cidades de ${uf} (digite para filtrar)...`;
      } catch (err) {
        filterCidadeInput.placeholder = "Digite o nome da cidade...";
      }
    }
    applyFilters();
  });
}

filterClearBtn.addEventListener("click", () => {
  if (filterBuscarPorSelect) filterBuscarPorSelect.value = "";
  if (filterEstadoSelect) filterEstadoSelect.value = "";
  if (filterCidadesDatalist) filterCidadesDatalist.innerHTML = "";
  if (filterCidadeInput) {
    filterCidadeInput.value = "";
    filterCidadeInput.placeholder = "Buscar por cidade...";
  }
  if (filterTipoAnimalSelect) filterTipoAnimalSelect.value = "";
  if (filterTempoSelect) filterTempoSelect.value = "";
  filterBuscarPor = "";
  filterEstado = "";
  filterCidade = "";
  filterTipoAnimal = "";
  filterTempo = "";
  lostExpanded = false;
  adoptExpanded = false;
  bbLoadAnimals();
});

// Abas (Todos os pets vs Meus Anúncios)
function updateTabStyles() {
  if (activeTab === "all") {
    tabAllPets.className = "px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all bg-brand-500 text-white shadow-sm";
    tabMyPets.className = "px-4 py-2 text-xs md:text-sm font-medium rounded-lg text-ink-300 hover:text-ink-100 hover:bg-black/5 transition-all";
  } else {
    tabMyPets.className = "px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all bg-brand-500 text-white shadow-sm";
    tabAllPets.className = "px-4 py-2 text-xs md:text-sm font-medium rounded-lg text-ink-300 hover:text-ink-100 hover:bg-black/5 transition-all";
  }
}

tabAllPets.addEventListener("click", () => {
  if (activeTab === "all") return;
  activeTab = "all";
  updateTabStyles();
  lostExpanded = false;
  adoptExpanded = false;
  bbLoadAnimals();
});

tabMyPets.addEventListener("click", () => {
  if (!bbStorage.isAuthenticated()) {
    window.location.href = `/pages/auth/login.html?next=${encodeURIComponent(window.location.pathname)}`;
    return;
  }
  if (activeTab === "my") return;
  activeTab = "my";
  updateTabStyles();
  lostExpanded = false;
  adoptExpanded = false;
  bbLoadAnimals();
});

// Máscara de telefone brasileiro (XX) XXXXX-XXXX
function applyPhoneMask(input) {
  if (!input) return;
  input.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 6) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else if (value.length > 2) {
      e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      e.target.value = `(${value}`;
    }
  });
}

applyPhoneMask(petPhoneInput);

// Controle de Abas do Modal de Criação / Anúncio (#adopt-modal)
const adoptTabs = Array.from(document.querySelectorAll("#adopt-tabs .bb-edit-tab"));
const adoptPanels = [
  document.getElementById("adopt-panel-0"),
  document.getElementById("adopt-panel-1"),
  document.getElementById("adopt-panel-2"),
];
const adoptPrevBtn = document.getElementById("adopt-prev-btn");
const adoptNextBtn = document.getElementById("adopt-next-btn");
const adoptPhotoChooseBtn = document.getElementById("adopt-photo-choose-btn");
const petDescInput = document.getElementById("pet-descricao");
const petDescCount = document.getElementById("pet-descricao-count");
let activeAdoptTab = 0;

function goToAdoptTab(index) {
  activeAdoptTab = Math.max(0, Math.min(index, adoptPanels.length - 1));
  adoptTabs.forEach((tab, i) => {
    const active = i === activeAdoptTab;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  adoptPanels.forEach((panel, i) => {
    if (panel) panel.classList.toggle("is-active", i === activeAdoptTab);
  });

  if (adoptPrevBtn) adoptPrevBtn.classList.toggle("hidden", activeAdoptTab === 0);
  if (adoptNextBtn) adoptNextBtn.classList.toggle("hidden", activeAdoptTab === adoptPanels.length - 1);
  if (modalSubmitBtn) modalSubmitBtn.classList.toggle("hidden", activeAdoptTab !== adoptPanels.length - 1);

  const body = document.querySelector("#adopt-modal .bb-edit-body");
  if (body) body.scrollTop = 0;
}

adoptTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    goToAdoptTab(Number(tab.dataset.adoptTab || 0));
  });
});

if (adoptPrevBtn) {
  adoptPrevBtn.addEventListener("click", () => goToAdoptTab(activeAdoptTab - 1));
}

if (adoptNextBtn) {
  adoptNextBtn.addEventListener("click", () => {
    modalAlertEl.innerHTML = "";
    if (activeAdoptTab === 0) {
      const nome = document.getElementById("pet-nome")?.value.trim();
      const desc = document.getElementById("pet-descricao")?.value.trim();
      if (!nome) {
        modalAlertEl.innerHTML = '<div class="bb-alert bb-alert--error">Informe o nome do pet antes de avançar.</div>';
        document.getElementById("pet-nome")?.focus();
        return;
      }
      if (!desc) {
        modalAlertEl.innerHTML = '<div class="bb-alert bb-alert--error">Escreva uma breve descrição antes de avançar.</div>';
        document.getElementById("pet-descricao")?.focus();
        return;
      }
    } else if (activeAdoptTab === 1) {
      const estado = document.getElementById("pet-estado")?.value;
      const cidade = document.getElementById("pet-cidade")?.value.trim();
      const servico = document.getElementById("pet-servico")?.value;
      const local = document.getElementById("pet-local")?.value.trim();
      if (servico === "PERDIDO" && !local) {
        modalAlertEl.innerHTML = '<div class="bb-alert bb-alert--error">Informe o último local onde o pet foi visto.</div>';
        document.getElementById("pet-local")?.focus();
        return;
      }
      if (!estado) {
        modalAlertEl.innerHTML = '<div class="bb-alert bb-alert--error">Selecione o estado (UF) antes de avançar.</div>';
        document.getElementById("pet-estado")?.focus();
        return;
      }
      if (!cidade) {
        modalAlertEl.innerHTML = '<div class="bb-alert bb-alert--error">Informe a cidade antes de avançar.</div>';
        document.getElementById("pet-cidade")?.focus();
        return;
      }
    }
    goToAdoptTab(activeAdoptTab + 1);
  });
}

if (adoptPhotoChooseBtn && petImageInput) {
  adoptPhotoChooseBtn.addEventListener("click", () => petImageInput.click());
}

if (petDescInput && petDescCount) {
  petDescInput.addEventListener("input", () => {
    petDescCount.textContent = `${petDescInput.value.length}/255`;
  });
}

// Atualização de UI conforme o serviço (Adoção vs Animal Perdido)
function updateModalServiceUI(service) {
  const modalHeading = document.getElementById("modal-adopt-title");
  const modalDesc = document.getElementById("modal-adopt-desc");
  const modalThumb = document.getElementById("modal-adopt-thumb");
  const modalChip = document.getElementById("modal-adopt-chip");
  const modalEyebrow = document.getElementById("modal-adopt-eyebrow");
  const headerWrap = document.getElementById("adopt-header-wrap");

  if (service === "PERDIDO") {
    if (wrapPetLocal) wrapPetLocal.classList.remove("hidden");
    if (petLocalInput) petLocalInput.required = true;
    if (modalHeading) modalHeading.textContent = "Reportar Animal Perdido";
    if (modalThumb) modalThumb.textContent = "🚨";
    if (modalEyebrow) modalEyebrow.textContent = "🚨 ANIMAL DESAPARECIDO";
    if (modalChip) {
      modalChip.className = "bb-edit-chip bb-edit-chip--perdido";
      modalChip.textContent = "🚨 Animal Perdido";
    }
    if (headerWrap) {
      headerWrap.style.background = "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0) 70%)";
    }
    if (modalDesc) modalDesc.textContent = "Preencha as informações do animal desaparecido para que a comunidade possa ajudar a localizá-lo.";
    if (modalSubmitBtn) modalSubmitBtn.textContent = "Publicar Animal Perdido";
  } else {
    if (wrapPetLocal) wrapPetLocal.classList.add("hidden");
    if (petLocalInput) {
      petLocalInput.required = false;
      petLocalInput.value = "";
    }
    if (modalHeading) modalHeading.textContent = "Anunciar Pet para Adoção";
    if (modalThumb) modalThumb.textContent = "🐾";
    if (modalEyebrow) modalEyebrow.textContent = "🐾 NOVO ANÚNCIO";
    if (modalChip) {
      modalChip.className = "bb-edit-chip bb-edit-chip--adocao";
      modalChip.textContent = "🐾 Adoção";
    }
    if (headerWrap) {
      headerWrap.style.background = "linear-gradient(135deg, rgba(47, 138, 224, 0.08) 0%, rgba(255, 255, 255, 0) 70%)";
    }
    if (modalDesc) modalDesc.textContent = "Preencha os dados do animal. O telefone informado será o canal direto para interessados entrarem em contato via WhatsApp.";
    if (modalSubmitBtn) modalSubmitBtn.textContent = "Publicar Anúncio";
  }
}

// Modal de Criação / Relato de Animal
async function openAdoptModal(defaultService = "ADOCAO") {
  if (!bbStorage.isAuthenticated()) {
    window.location.href = `/pages/auth/login.html?next=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  currentEditingAnimalId = null;
  modalAlertEl.innerHTML = "";
  formAdoptPet.reset();
  resetImageInput();
  goToAdoptTab(0);

  if (petDescCount) petDescCount.textContent = "0/255";

  const labelImg = document.getElementById("label-pet-imagem");
  if (labelImg) {
    labelImg.textContent = "Foto Principal * (JPEG, PNG ou WebP, máx 50MB - otimizada automaticamente)";
  }

  if (wrapPetStatus) wrapPetStatus.classList.add("hidden");

  if (petServicoSelect) {
    petServicoSelect.value = defaultService;
    updateModalServiceUI(defaultService);
  }

  if (petCidadeInput) {
    petCidadeInput.disabled = true;
    petCidadeInput.placeholder = "Selecione a UF primeiro...";
  }
  if (petCidadesDatalist) {
    petCidadesDatalist.innerHTML = "";
  }

  // Carrega e vincula automaticamente o telefone da conta do tutor (sem digitação livre)
  let currentProfilePhone = "";
  const phoneWarning = document.getElementById("pet-telefone-warning");
  if (phoneWarning) phoneWarning.classList.add("hidden");
  if (petPhoneInput) {
    petPhoneInput.value = "";
    petPhoneInput.placeholder = "Carregando telefone do perfil...";
  }

  try {
    const profile = await authService.getProfile();
    currentProfilePhone = profile && profile.telefone ? String(profile.telefone).trim() : "";
    if (petPhoneInput) {
      if (currentProfilePhone) {
        petPhoneInput.value = bbValidation.formatPhone(currentProfilePhone);
        if (phoneWarning) phoneWarning.classList.add("hidden");
        if (modalSubmitBtn) modalSubmitBtn.disabled = false;
      } else {
        petPhoneInput.value = "";
        petPhoneInput.placeholder = "Nenhum telefone cadastrado no perfil";
        if (phoneWarning) phoneWarning.classList.remove("hidden");
        if (modalSubmitBtn) {
          modalSubmitBtn.disabled = true;
          modalSubmitBtn.textContent = "Cadastre seu telefone no perfil para anunciar";
        }
      }
    }
  } catch (err) {
    console.warn("Não foi possível carregar dados do perfil:", err);
  }

  if (adoptModal) adoptModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

// Edição de Anúncio: usa o pop-up dedicado (#edit-modal), definido em js/pages/animals-edit.js.
// Ele confere se o usuário logado é o dono do anúncio antes de abrir e antes de salvar.
function openEditPetModal(animalOrId) {
  if (typeof window.bbOpenEditModal === "function") {
    window.bbOpenEditModal(animalOrId);
  }
}

function closeAdoptModal() {
  currentEditingAnimalId = null;
  resetImageInput();
  if (wrapPetStatus) wrapPetStatus.classList.add("hidden");
  if (adoptModal) adoptModal.classList.add("hidden");
  document.body.style.overflow = "";
}

if (announceBtn) announceBtn.addEventListener("click", () => openAdoptModal("ADOCAO"));
if (reportLostBtn) reportLostBtn.addEventListener("click", () => openAdoptModal("PERDIDO"));

document.querySelectorAll(".btn-trigger-adopt-modal").forEach((btn) => {
  btn.addEventListener("click", () => openAdoptModal("ADOCAO"));
});

if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeAdoptModal);
if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeAdoptModal);
if (adoptModal) {
  adoptModal.addEventListener("click", (e) => {
    if (e.target === adoptModal) closeAdoptModal();
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && adoptModal && !adoptModal.classList.contains("hidden")) {
    closeAdoptModal();
  }
});

if (petImageInput) {
  petImageInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    modalAlertEl.innerHTML = "";
    petImageInput.classList.remove("bb-input--error");
    optimizedImageFile = null;
    if (!file) {
      resetImageInput();
      return;
    }

    if (!isValidImageType(file)) {
      modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">Formato de arquivo inválido. Permitidos: JPEG, PNG ou WebP (.jpg, .jpeg, .png, .webp).</div>`;
      resetImageInput();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">O arquivo selecionado tem ${sizeMB} MB. O tamanho máximo permitido é de 50 MB.</div>`;
      resetImageInput();
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl, file.name, "Otimizando imagem...");

    // Compacta com Canvas em background enquanto o usuário preenche o restante do formulário
    try {
      if (typeof bbImageCompressor !== "undefined") {
        const result = await bbImageCompressor.compress(file);
        optimizedImageFile = result.file;
        const newPreviewUrl = URL.createObjectURL(result.file);
        const originalText = bbImageCompressor.formatBytes(result.originalSize);
        const compressedText = bbImageCompressor.formatBytes(result.compressedSize);
        const savedText = result.ratioSaved > 0 ? ` (-${result.ratioSaved}%)` : "";
        setImagePreview(
          newPreviewUrl,
          result.file.name,
          `${compressedText}${savedText} | original: ${originalText}`
        );
      } else {
        const sizeKB = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(1)} KB`;
        setImagePreview(previewUrl, file.name, sizeKB);
      }
    } catch (err) {
      console.warn("Erro na compressão preliminar da imagem:", err);
    }
  });
}

if (petImageClearBtn) {
  petImageClearBtn.addEventListener("click", () => {
    resetImageInput();
  });
}

if (petServicoSelect) {
  petServicoSelect.addEventListener("change", (e) => {
    updateModalServiceUI(e.target.value);
  });
}

if (petEstadoSelect) {
  petEstadoSelect.addEventListener("change", async () => {
    const uf = petEstadoSelect.value;
    petCidadeInput.value = "";
    if (petCidadesDatalist) petCidadesDatalist.innerHTML = "";

    if (!uf) {
      petCidadeInput.disabled = true;
      petCidadeInput.placeholder = "Selecione a UF primeiro...";
      return;
    }

    petCidadeInput.disabled = true;
    petCidadeInput.placeholder = "Carregando cidades do IBGE...";

    try {
      const cidades = await ibgeService.getCidadesPorEstado(uf);
      if (petCidadesDatalist) {
        petCidadesDatalist.innerHTML = cidades.map((c) => `<option value="${c.nome}">`).join("");
      }
      petCidadeInput.disabled = false;
      petCidadeInput.placeholder = "Digite ou selecione a cidade...";
      petCidadeInput.focus();
    } catch (err) {
      console.error("Erro ao carregar cidades do IBGE:", err);
      petCidadeInput.disabled = false;
      petCidadeInput.placeholder = "Digite sua cidade manualmente...";
    }
  });
}

formAdoptPet.addEventListener("submit", async (e) => {
  e.preventDefault();
  modalAlertEl.innerHTML = "";

  const isEdit = Boolean(currentEditingAnimalId);
  const servico = (document.getElementById("pet-servico")?.value || "ADOCAO");
  // Validação: Contato vinculado automaticamente à conta do tutor (sem digitação livre)
  let effectivePhone = "";
  try {
    const profile = await authService.getProfile();
    effectivePhone = profile && profile.telefone ? String(profile.telefone).trim() : "";
  } catch (_) {
    effectivePhone = petPhoneInput ? petPhoneInput.value.trim() : "";
  }

  const nomeVal = document.getElementById("pet-nome")?.value.trim() || "";
  const tipoVal = document.getElementById("pet-tipo")?.value || "CACHORRO";
  const sexoVal = document.getElementById("pet-sexo")?.value || "M";
  const racaVal = document.getElementById("pet-raca")?.value.trim() || "";
  const idadeVal = document.getElementById("pet-idade")?.value.trim() || "";
  const descVal = document.getElementById("pet-descricao")?.value.trim() || "";
  const castradoVal = document.getElementById("pet-castrado")?.value.trim() || "";
  const medVal = document.getElementById("pet-medicamento")?.value.trim() || "";
  const localVal = document.getElementById("pet-local")?.value.trim() || "";

  if (!nomeVal) {
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">Por favor, informe o nome do pet.</div>`;
    goToAdoptTab(0);
    document.getElementById("pet-nome")?.focus();
    return;
  }

  if (!descVal) {
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">Por favor, escreva uma breve descrição do pet.</div>`;
    goToAdoptTab(0);
    document.getElementById("pet-descricao")?.focus();
    return;
  }

  if (servico === "PERDIDO" && !localVal) {
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">Por favor, informe o último local onde o pet foi visto.</div>`;
    goToAdoptTab(1);
    document.getElementById("pet-local")?.focus();
    return;
  }

  if (!effectivePhone && !isEdit) {
    const errorMsg = "É necessário ter um telefone cadastrado na sua conta para anunciar um animal.";
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error font-semibold">⚠️ ${errorMsg} <a href="/pages/auth/profile.html" class="underline font-bold text-brand-300 ml-1">Cadastrar no Perfil →</a></div>`;
    goToAdoptTab(1);
    return;
  }

  const estado = (document.getElementById("pet-estado")?.value || "").trim().toUpperCase();
  const cidade = document.getElementById("pet-cidade")?.value.trim() || "";

  if (!estado) {
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">Por favor, selecione o Estado (UF).</div>`;
    goToAdoptTab(1);
    document.getElementById("pet-estado")?.focus();
    return;
  }
  if (!cidade) {
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">Por favor, selecione ou informe a Cidade.</div>`;
    goToAdoptTab(1);
    document.getElementById("pet-cidade")?.focus();
    return;
  }

  const statusVal = isEdit
    ? (document.getElementById("pet-status")?.value || (servico === "PERDIDO" ? "PERDIDO" : "DISPONIVEL"))
    : (servico === "PERDIDO" ? "PERDIDO" : "DISPONIVEL");

  const selectedFile = petImageInput && petImageInput.files && petImageInput.files[0];

  // A foto é obrigatória ao criar um novo anúncio
  if (!isEdit && !selectedFile && !optimizedImageFile) {
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">A foto do animal é obrigatória para publicar o anúncio.</div>`;
    goToAdoptTab(2);
    if (petImageInput) {
      petImageInput.classList.add("bb-input--error");
    }
    modalAlertEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }

  if (selectedFile) {
    if (!isValidImageType(selectedFile)) {
      modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">Formato de arquivo inválido. Apenas imagens JPEG, PNG ou WebP (.jpg, .jpeg, .png, .webp) são permitidas.</div>`;
      goToAdoptTab(2);
      return;
    }
    if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">O arquivo de imagem excede o tamanho máximo de 50 MB (${sizeMB} MB).</div>`;
      goToAdoptTab(2);
      return;
    }
  }

  let fileToUpload = selectedFile;
  if (selectedFile) {
    if (optimizedImageFile) {
      fileToUpload = optimizedImageFile;
    } else if (typeof bbImageCompressor !== "undefined") {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.innerHTML = '<span class="bb-btn__spinner" aria-hidden="true"></span> Otimizando imagem...';
      try {
        const result = await bbImageCompressor.compress(selectedFile);
        fileToUpload = result.file;
        optimizedImageFile = result.file;
      } catch (err) {
        console.warn("Falha ao compactar antes do envio, usando original:", err);
      }
    }
  }

  let payload;
  if (selectedFile) {
    payload = new FormData();
    payload.append("tipo_servico", servico);
    payload.append("status", statusVal);
    payload.append("nome", nomeVal);
    payload.append("tipo_animal", tipoVal);
    payload.append("sexo", sexoVal);
    if (racaVal) payload.append("raca", racaVal);
    if (idadeVal) payload.append("idade_aproximada", idadeVal);
    payload.append("estado", estado);
    payload.append("cidade", cidade);
    payload.append("telefone_contato", effectivePhone);
    payload.append("descricao", descVal);
    if (castradoVal) payload.append("castrado", castradoVal);
    if (medVal) payload.append("medicamento", medVal);
    if (servico === "PERDIDO" && localVal) payload.append("local", localVal);
    payload.append("imagem", fileToUpload);
  } else {
    payload = {
      tipo_servico: servico,
      status: statusVal,
      nome: nomeVal,
      tipo_animal: tipoVal,
      sexo: sexoVal,
      raca: racaVal || undefined,
      idade_aproximada: idadeVal || undefined,
      estado,
      cidade,
      telefone_contato: effectivePhone || undefined,
      descricao: descVal,
      castrado: castradoVal || undefined,
      medicamento: medVal || undefined,
      local: servico === "PERDIDO" ? (localVal || undefined) : undefined,
    };
  }

  modalSubmitBtn.disabled = true;
  modalSubmitBtn.innerHTML = isEdit
    ? '<span class="bb-btn__spinner" aria-hidden="true"></span> Salvando alterações...'
    : '<span class="bb-btn__spinner" aria-hidden="true"></span> Publicando...';

  try {
    if (isEdit) {
      await animalService.update(currentEditingAnimalId, payload);
      modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--success">Anúncio do pet atualizado com sucesso!</div>`;
    } else {
      await animalService.create(payload);
      modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--success">Animal anunciado com sucesso!</div>`;
    }
    setTimeout(() => {
      closeAdoptModal();
      bbLoadAnimals();
    }, 1000);
  } catch (err) {
    let errorMsg = err.message || "Ocorreu um erro ao salvar o anúncio.";
    if (err.payload && err.payload.imagem) {
      errorMsg = Array.isArray(err.payload.imagem) ? err.payload.imagem.join(" ") : String(err.payload.imagem);
      if (petImageInput) {
        petImageInput.classList.add("bb-input--error");
      }
    } else if (errorMsg.startsWith("imagem: ")) {
      errorMsg = errorMsg.replace(/^imagem:\s*/, "");
      if (petImageInput) {
        petImageInput.classList.add("bb-input--error");
      }
    }
    modalAlertEl.innerHTML = `<div class="bb-alert bb-alert--error">${errorMsg}</div>`;
    modalAlertEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } finally {
    modalSubmitBtn.disabled = false;
    modalSubmitBtn.textContent = isEdit
      ? "Salvar Alterações"
      : (servico === "PERDIDO" ? "Publicar Animal Perdido" : "Publicar Anúncio");
  }
});

// Ações do Dono no Card (Concluir status, Editar e Excluir) + Navegação
document.addEventListener("click", async (e) => {
  // 1. Finalizar Anúncio (Marcar como Adotado ou Encontrado)
  const finishBtn = e.target.closest(".btn-finish-animal");
  if (finishBtn) {
    const id = finishBtn.dataset.id;
    const targetStatus = finishBtn.dataset.status;
    const isPerdido = targetStatus === "ENCONTRADO";
    const confirmMsg = isPerdido
      ? "Deseja marcar este pet como ENCONTRADO? O anúncio será dado como concluído."
      : "Deseja marcar este pet como ADOTADO? Ele sairá da lista de animais para adoção e entrará no contador de adotados.";

    if (!confirm(confirmMsg)) return;

    finishBtn.disabled = true;
    try {
      await animalService.update(id, { status: targetStatus });

      if (targetStatus === "ADOTADO") {
        if (bbAdoptionCelebrationToast) {
          bbAdoptionCelebrationToast.classList.remove("hidden");
          bbAdoptionCelebrationToast.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (bbAdoptedCountEl) {
          bbAdoptedCountEl.classList.add("scale-125", "transition-transform", "duration-300");
          setTimeout(() => {
            bbAdoptedCountEl.classList.remove("scale-125");
          }, 600);
        }
      }

      await bbLoadAnimals();
    } catch (err) {
      alert("Erro ao atualizar anúncio: " + err.message);
      finishBtn.disabled = false;
    }
    return;
  }

  // 2. Editar Informações do Pet
  const editBtn = e.target.closest(".btn-edit-animal");
  if (editBtn) {
    const id = editBtn.dataset.id;
    const allPets = [...allLostAnimals, ...allAdoptAnimals, ...allAdoptedAnimals];
    let animal = allPets.find((a) => String(a.id) === String(id));
    if (!animal) {
      try {
        animal = await animalService.getById(id);
      } catch (err) {
        alert("Não foi possível carregar os dados para edição: " + err.message);
        return;
      }
    }
    if (animal) {
      openEditPetModal(animal);
    }
    return;
  }

  // 3. Excluir Anúncio do Pet
  const deleteBtn = e.target.closest(".btn-delete-animal");
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (!confirm("Tem certeza que deseja excluir permanentemente este anúncio?")) return;

    deleteBtn.disabled = true;
    try {
      await animalService.delete(id);
      bbLoadAnimals();
    } catch (err) {
      alert("Erro ao excluir anúncio: " + err.message);
      deleteBtn.disabled = false;
    }
    return;
  }

  // 4. Clique geral no card (Navegação para página de detalhes)
  const card = e.target.closest(".bb-pet-card, .bb-animal-card");
  if (card) {
    if (
      e.target.closest("button") ||
      e.target.closest("a") ||
      e.target.closest(".bb-owner-actions")
    ) {
      return;
    }
    const cardId = card.dataset.cardId || card.getAttribute("data-card-id");
    if (cardId) {
      window.location.href = `/pages/animals/detail.html?id=${cardId}`;
    }
  }
});

// Suporte para filtros e edição via URL query params
function checkUrlFilters() {
  const urlParams = new URLSearchParams(window.location.search);
  const buscarPor = (urlParams.get("buscar_por") || urlParams.get("tipo_servico") || "").toUpperCase();
  if (buscarPor === "ADOCAO" || buscarPor === "PERDIDO") {
    filterBuscarPor = buscarPor;
    if (filterBuscarPorSelect) {
      filterBuscarPorSelect.value = buscarPor;
    }
  }
}

async function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");
  if (editId) {
    openEditPetModal(editId);
  }
}

// Inicialização dos selects do IBGE
function initIbgeUI() {
  if (typeof ibgeService === "undefined") return;
  const estados = ibgeService.getEstados();
  const optionsHtml = estados.map((e) => `<option value="${e.sigla}">${e.sigla} - ${e.nome}</option>`).join("");

  if (filterEstadoSelect) {
    filterEstadoSelect.innerHTML = '<option value="">Todos os estados</option>' + optionsHtml;
  }
  if (petEstadoSelect) {
    petEstadoSelect.innerHTML = '<option value="">Selecione a UF...</option>' + optionsHtml;
  }
}

// Carregamento inicial
initIbgeUI();
checkUrlFilters();
bbLoadAnimals().then(() => checkUrlParams());

