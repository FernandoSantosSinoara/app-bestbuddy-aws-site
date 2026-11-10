/**
 * Pop-up de Edição de Anúncio de Animal (pages/animals/index.html)
 *
 * - Só abre para o DONO do anúncio (tutor_id do animal === usuário logado).
 *   O backend (AnimaisDetailView.perform_update) também bloqueia com 403
 *   qualquer tentativa de editar anúncio de outra pessoa.
 * - Dividido em 3 abas para não amontoar informações.
 * - Envia via PATCH apenas os campos que realmente mudaram.
 *
 * Depende de: bbStorage, animalService, ibgeService, bbImageCompressor (opcional)
 * e das variáveis globais de animals.js (allLostAnimals, allAdoptAnimals, bbLoadAnimals).
 */
(function () {
  const modal = document.getElementById("edit-modal");
  if (!modal) return;

  const $ = (id) => document.getElementById(id);

  const form = $("form-edit-pet");
  const alertEl = $("edit-modal-alert");
  const submitBtn = $("edit-modal-submit-btn");
  const cancelBtn = $("edit-modal-cancel-btn");
  const closeBtn = $("edit-modal-close-btn");
  const dirtyIndicator = $("edit-dirty-indicator");

  const headerThumb = $("edit-header-thumb");
  const headerTitle = $("edit-modal-title");
  const headerChip = $("edit-header-chip");

  const tabs = Array.from(modal.querySelectorAll(".bb-edit-tab"));
  const panels = [$("edit-panel-sobre"), $("edit-panel-local"), $("edit-panel-status")];

  const nomeInput = $("edit-nome");
  const racaInput = $("edit-raca");
  const idadeSelect = $("edit-idade");
  const descInput = $("edit-descricao");
  const descCount = $("edit-descricao-count");
  const castradoSelect = $("edit-castrado");
  const medSelect = $("edit-medicamento");
  const estadoSelect = $("edit-estado");
  const cidadeInput = $("edit-cidade");
  const cidadesList = $("edit-cidades-list");
  const wrapLocal = $("edit-wrap-local");
  const localInput = $("edit-local");
  const statusList = $("edit-status-list");

  const photoImg = $("edit-photo-img");
  const photoName = $("edit-photo-name");
  const photoMeta = $("edit-photo-meta");
  const photoChangeBtn = $("edit-photo-change-btn");
  const photoUndoBtn = $("edit-photo-undo-btn");
  const imageInput = $("edit-imagem");

  const MAX_IMAGE_SIZE = 50 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
  const DEFAULT_PHOTO_META = "JPEG, PNG ou WebP • otimizada automaticamente";

  const STATUS_OPTIONS = {
    ADOCAO: [
      { value: "DISPONIVEL", icon: "🐾", title: "Disponível para adoção", desc: "O anúncio aparece normalmente para os interessados." },
      { value: "ADOTADO", icon: "✅", title: "Adotado", desc: "O pet já encontrou um lar. O anúncio é concluído." },
      { value: "INATIVO", icon: "⏸️", title: "Pausado", desc: "Oculta temporariamente o anúncio, sem excluí-lo." },
    ],
    PERDIDO: [
      { value: "PERDIDO", icon: "🚨", title: "Ainda desaparecido", desc: "A comunidade continua vendo o alerta." },
      { value: "ENCONTRADO", icon: "🎉", title: "Encontrado", desc: "O pet voltou para casa. O alerta é concluído." },
      { value: "INATIVO", icon: "⏸️", title: "Pausado", desc: "Oculta temporariamente o alerta, sem excluí-lo." },
    ],
  };

  let currentAnimal = null;
  let originalValues = null;
  let newImageFile = null;
  let activeTabIndex = 0;
  let isSaving = false;

  // ---------------------------------------------------------------------------
  // Utilitários
  // ---------------------------------------------------------------------------
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getCurrentUser() {
    return typeof bbStorage !== "undefined" ? bbStorage.getUser() : null;
  }

  /** Regra de propriedade: o anúncio só pode ser editado pelo próprio tutor. */
  function isOwner(animal) {
    const user = getCurrentUser();
    if (!user || !animal) return false;
    if (animal.tutor_id != null && user.id != null) {
      return Number(animal.tutor_id) === Number(user.id);
    }
    if (animal.tutor_email && user.email) {
      return String(animal.tutor_email).toLowerCase() === String(user.email).toLowerCase();
    }
    return false;
  }

  function showAlert(type, html) {
    alertEl.innerHTML = `<div class="bb-alert bb-alert--${type}" style="margin-bottom: 1rem;">${html}</div>`;
    alertEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearAlert() {
    alertEl.innerHTML = "";
  }

  function getRadioValue(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  function setRadioValue(name, value) {
    form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = input.value === value;
    });
  }

  function setPhoto(target, src) {
    if (src) {
      target.innerHTML = `<img src="${escapeHtml(src)}" alt="Foto do pet" onerror="this.parentElement.textContent='🐾'" />`;
    } else {
      target.textContent = "🐾";
    }
  }

  // ---------------------------------------------------------------------------
  // Abas
  // ---------------------------------------------------------------------------
  function goToTab(index) {
    activeTabIndex = index;
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((panel, i) => panel.classList.toggle("is-active", i === index));
    const body = modal.querySelector(".bb-edit-body");
    if (body) body.scrollTop = 0;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => goToTab(Number(tab.dataset.editTab)));
  });

  // ---------------------------------------------------------------------------
  // Leitura / comparação do formulário
  // ---------------------------------------------------------------------------
  function readForm() {
    return {
      nome: nomeInput.value.trim(),
      tipo_animal: getRadioValue("edit-tipo"),
      sexo: getRadioValue("edit-sexo"),
      raca: racaInput.value.trim(),
      idade_aproximada: idadeSelect.value,
      descricao: descInput.value.trim(),
      castrado: castradoSelect.value,
      medicamento: medSelect.value,
      estado: estadoSelect.value,
      cidade: cidadeInput.value.trim(),
      local: localInput.value.trim(),
      status: getRadioValue("edit-status"),
    };
  }

  function getChanges() {
    if (!originalValues || !currentAnimal) return {};
    const current = readForm();
    const changes = {};
    Object.keys(current).forEach((key) => {
      if (key === "local" && currentAnimal.tipo_servico !== "PERDIDO") return;
      if ((current[key] || "") !== (originalValues[key] || "")) {
        changes[key] = current[key];
      }
    });
    return changes;
  }

  function updateDirtyState() {
    if (!currentAnimal || !originalValues) {
      if (dirtyIndicator) dirtyIndicator.classList.remove("is-visible");
      return;
    }
    const dirty = Object.keys(getChanges()).length > 0 || Boolean(newImageFile);
    dirtyIndicator.classList.toggle("is-visible", dirty);
  }

  function updateDescCount() {
    if (descCount && descInput) {
      descCount.textContent = `${descInput.value.length}/255`;
    }
  }

  form.addEventListener("input", updateDirtyState);
  form.addEventListener("change", updateDirtyState);
  descInput.addEventListener("input", updateDescCount);

  // ---------------------------------------------------------------------------
  // Validação (marca a aba com erro e leva o usuário até ela)
  // ---------------------------------------------------------------------------
  function clearErrors() {
    form.querySelectorAll(".bb-input--error").forEach((el) => el.classList.remove("bb-input--error"));
    tabs.forEach((tab) => tab.classList.remove("has-error"));
  }

  function validate(values) {
    const errors = [];
    if (!values.nome) errors.push({ tab: 0, el: nomeInput, msg: "Informe o nome do pet." });
    if (!values.descricao) errors.push({ tab: 0, el: descInput, msg: "Escreva uma breve descrição do pet." });
    if (!values.estado) errors.push({ tab: 1, el: estadoSelect, msg: "Selecione o estado (UF)." });
    if (!values.cidade) errors.push({ tab: 1, el: cidadeInput, msg: "Informe a cidade." });
    if (currentAnimal?.tipo_servico === "PERDIDO" && !values.local) {
      errors.push({ tab: 1, el: localInput, msg: "Informe o último local onde o pet foi visto." });
    }
    if (!values.status) errors.push({ tab: 2, el: null, msg: "Escolha a situação do anúncio." });
    return errors;
  }

  // ---------------------------------------------------------------------------
  // Localização (IBGE)
  // ---------------------------------------------------------------------------
  function fillEstados() {
    if (!estadoSelect || typeof ibgeService === "undefined") return;
    const estados = ibgeService.getEstados();
    if (Array.isArray(estados)) {
      estadoSelect.innerHTML =
        '<option value="">Selecione...</option>' +
        estados
          .filter((e) => e && e.nome)
          .map((e) => `<option value="${e.sigla}">${e.sigla} - ${escapeHtml(e.nome)}</option>`)
          .join("");
    }
  }

  async function loadCidades(uf) {
    if (!cidadesList) return;
    cidadesList.innerHTML = "";
    if (!uf || typeof ibgeService === "undefined") return;
    try {
      const cidades = await ibgeService.getCidadesPorEstado(uf);
      if (Array.isArray(cidades)) {
        cidadesList.innerHTML = cidades
          .filter((c) => c && c.nome)
          .map((c) => `<option value="${escapeHtml(c.nome)}">`)
          .join("");
      }
    } catch (_) {
      /* Sem lista de sugestões: o usuário ainda pode digitar a cidade. */
    }
  }

  estadoSelect.addEventListener("change", async () => {
    cidadeInput.value = "";
    cidadeInput.placeholder = "Carregando cidades...";
    await loadCidades(estadoSelect.value);
    cidadeInput.placeholder = "Digite a cidade...";
    updateDirtyState();
  });

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------
  function renderStatusOptions(servico, selected) {
    const options = STATUS_OPTIONS[servico] || STATUS_OPTIONS.ADOCAO;
    statusList.innerHTML = options
      .map(
        (opt) => `
        <label class="bb-edit-status">
          <input type="radio" name="edit-status" value="${opt.value}" ${opt.value === selected ? "checked" : ""} />
          <span class="bb-edit-status__icon">${opt.icon}</span>
          <span class="bb-edit-status__text">
            <strong>${opt.title}</strong>
            <small>${opt.desc}</small>
          </span>
          <span class="bb-edit-status__check" aria-hidden="true"></span>
        </label>`
      )
      .join("");
  }

  // ---------------------------------------------------------------------------
  // Foto
  // ---------------------------------------------------------------------------
  function resetPhoto() {
    newImageFile = null;
    imageInput.value = "";
    setPhoto(photoImg, currentAnimal && currentAnimal.imagem);
    photoName.textContent = currentAnimal && currentAnimal.imagem ? "Foto atual" : "Nenhuma foto cadastrada";
    photoMeta.textContent = DEFAULT_PHOTO_META;
    photoUndoBtn.classList.add("hidden");
    updateDirtyState();
  }

  photoChangeBtn.addEventListener("click", () => imageInput.click());
  photoUndoBtn.addEventListener("click", resetPhoto);

  imageInput.addEventListener("change", async () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) return;
    clearAlert();

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_TYPES.includes((file.type || "").toLowerCase()) && !ALLOWED_EXT.includes(ext)) {
      showAlert("error", "Formato inválido. Use uma imagem JPEG, PNG ou WebP.");
      imageInput.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      showAlert("error", "A imagem excede o tamanho máximo de 50 MB.");
      imageInput.value = "";
      return;
    }

    newImageFile = file;
    setPhoto(photoImg, URL.createObjectURL(file));
    photoName.textContent = file.name;
    photoMeta.textContent = "Otimizando imagem...";
    photoUndoBtn.classList.remove("hidden");
    updateDirtyState();

    if (typeof bbImageCompressor !== "undefined") {
      try {
        const result = await bbImageCompressor.compress(file);
        if (newImageFile !== file) return; // usuário trocou/desfez no meio da compressão
        newImageFile = result.file;
        const saved = result.ratioSaved > 0 ? ` (-${result.ratioSaved}%)` : "";
        photoMeta.textContent = `Nova foto • ${bbImageCompressor.formatBytes(result.compressedSize)}${saved}`;
      } catch (_) {
        photoMeta.textContent = "Nova foto selecionada";
      }
    } else {
      photoMeta.textContent = "Nova foto selecionada";
    }
  });

  // ---------------------------------------------------------------------------
  // Abrir / fechar
  // ---------------------------------------------------------------------------
  function fillForm(animal) {
    const servico = animal.tipo_servico === "PERDIDO" ? "PERDIDO" : "ADOCAO";
    const defaultStatus = servico === "PERDIDO" ? "PERDIDO" : "DISPONIVEL";
    const validStatuses = STATUS_OPTIONS[servico].map((o) => o.value);
    const status = validStatuses.includes(animal.status) ? animal.status : defaultStatus;

    // Cabeçalho
    headerTitle.textContent = animal.nome || "Pet sem nome";
    setPhoto(headerThumb, animal.imagem);
    headerChip.className = `bb-edit-chip bb-edit-chip--${servico === "PERDIDO" ? "perdido" : "adocao"}`;
    headerChip.textContent = servico === "PERDIDO" ? "🚨 Animal perdido" : "🐾 Adoção";

    // Aba 1
    nomeInput.value = animal.nome || "";
    setRadioValue("edit-tipo", animal.tipo_animal || "CACHORRO");
    setRadioValue("edit-sexo", animal.sexo || "I");
    racaInput.value = animal.raca || "";
    idadeSelect.value = animal.idade_aproximada || "";
    descInput.value = animal.descricao || "";
    updateDescCount();

    // Aba 2
    castradoSelect.value = animal.castrado || "";
    medSelect.value = animal.medicamento || "";
    estadoSelect.value = animal.estado || "";
    cidadeInput.value = animal.cidade || "";
    wrapLocal.classList.toggle("hidden", servico !== "PERDIDO");
    localInput.value = animal.local || "";

    // Aba 3
    renderStatusOptions(servico, status);

    // Snapshot dos valores ANTES de chamar resetPhoto() para não quebrar checagem de dirty state
    originalValues = readForm();
    if (status !== animal.status) originalValues.status = animal.status || "";

    resetPhoto();
  }

  async function openEditModal(animalOrId) {
    try {
      if (!bbStorage.isAuthenticated()) {
        window.location.href = `/pages/auth/login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      // Sempre busca a versão mais recente no servidor para conferir o dono.
      let animal = null;
      const id = typeof animalOrId === "object" && animalOrId ? animalOrId.id : animalOrId;
      try {
        animal = await animalService.getById(id);
      } catch (err) {
        alert("Não foi possível carregar o anúncio para edição: " + (err.message || err));
        return;
      }

      if (!animal) {
        alert("Anúncio não encontrado.");
        return;
      }

      if (!isOwner(animal)) {
        alert("Você só pode editar os anúncios criados por você.");
        return;
      }

      currentAnimal = animal;
      clearAlert();
      clearErrors();
      goToTab(0);
      fillForm(animal);
      try {
        await loadCidades(animal.estado);
      } catch (_) {}
      updateDirtyState();

      submitBtn.disabled = false;
      submitBtn.textContent = "Salvar alterações";
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        if (nomeInput) nomeInput.focus();
      }, 50);
    } catch (unexpectedError) {
      console.error("[bbOpenEditModal] Erro inesperado:", unexpectedError);
      alert("Erro ao abrir pop-up de edição: " + (unexpectedError.message || unexpectedError));
    }
  }

  function closeEditModal(force = false) {
    if (isSaving) return;
    if (!force && currentAnimal && dirtyIndicator.classList.contains("is-visible")) {
      if (!confirm("Você tem alterações não salvas. Deseja descartá-las?")) return;
    }
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    currentAnimal = null;
    originalValues = null;
    newImageFile = null;
    imageInput.value = "";
    dirtyIndicator.classList.remove("is-visible");
  }

  closeBtn.addEventListener("click", () => closeEditModal());
  cancelBtn.addEventListener("click", () => closeEditModal());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeEditModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeEditModal();
  });

  // ---------------------------------------------------------------------------
  // Salvar
  // ---------------------------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentAnimal || isSaving) return;

    clearAlert();
    clearErrors();

    const values = readForm();
    const errors = validate(values);
    if (errors.length) {
      errors.forEach((err) => {
        if (err.el) err.el.classList.add("bb-input--error");
        tabs[err.tab].classList.add("has-error");
      });
      goToTab(errors[0].tab);
      showAlert("error", errors.map((err) => `• ${escapeHtml(err.msg)}`).join("<br>"));
      if (errors[0].el) errors[0].el.focus();
      return;
    }

    const changes = getChanges();
    if (!Object.keys(changes).length && !newImageFile) {
      showAlert("success", "Nenhuma alteração para salvar.");
      return;
    }

    // Confere novamente a propriedade antes de enviar (o backend também valida).
    if (!isOwner(currentAnimal)) {
      showAlert("error", "Você só pode editar os anúncios criados por você.");
      return;
    }

    let payload;
    if (newImageFile) {
      payload = new FormData();
      Object.entries(changes).forEach(([key, value]) => payload.append(key, value));
      // O backend usa o tipo de animal para validar a foto com IA.
      if (!("tipo_animal" in changes)) payload.append("tipo_animal", values.tipo_animal);
      payload.append("imagem", newImageFile, newImageFile.name || "foto.jpg");
    } else {
      payload = changes;
    }

    isSaving = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="bb-btn__spinner" aria-hidden="true"></span> Salvando...';

    try {
      await animalService.update(currentAnimal.id, payload);
      showAlert("success", "✅ Anúncio atualizado com sucesso!");
      isSaving = false;
      setTimeout(() => {
        closeEditModal(true);
        if (typeof bbLoadAnimals === "function") bbLoadAnimals();
        if (typeof bbLoadDetail === "function") bbLoadDetail();
      }, 900);
    } catch (err) {
      isSaving = false;
      let msg = err.message || "Não foi possível salvar as alterações.";
      if (err.status === 403) {
        msg = "Você só pode editar os anúncios criados por você.";
      } else if (err.payload && err.payload.imagem) {
        msg = Array.isArray(err.payload.imagem) ? err.payload.imagem.join(" ") : String(err.payload.imagem);
        tabs[2].classList.add("has-error");
        goToTab(2);
      }
      showAlert("error", escapeHtml(msg));
      submitBtn.disabled = false;
      submitBtn.textContent = "Salvar alterações";
    }
  });

  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------
  fillEstados();
  window.bbOpenEditModal = openEditModal;
  window.bbIsAnimalOwner = isOwner;
})();
