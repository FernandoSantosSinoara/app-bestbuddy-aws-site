if (typeof bbRenderNavigation === "function") bbRenderNavigation("#bb-nav", "animals");
if (typeof bbRenderFooter === "function") bbRenderFooter("#bb-footer");

const bbDetailEl = document.getElementById("bb-detail");
const bbAnimalId = new URLSearchParams(window.location.search).get("id");

const bbSexoLabel = { M: "Macho", F: "Fêmea", I: "Indeterminado" };

async function bbLoadDetail() {
  bbDetailEl.innerHTML = typeof bbLoadingHtml !== "undefined" ? bbLoadingHtml : "Carregando...";
  try {
    const animal = await animalService.getById(bbAnimalId);
    const imageHtml = animal.imagem
      ? `<img src="${animal.imagem}" alt="${animal.nome}" class="w-full h-full object-cover" />`
      : `<span class="text-xs uppercase tracking-wide text-ink-500 mt-1">Sem foto</span>`;

    const cleanPhone = (animal.telefone_contato || "").replace(/\D/g, "");
    const petNome = animal.nome || "pet";
    const isPerdido = animal.tipo_servico === "PERDIDO";
    const tutorNome = animal.tutor_nome || "Tutor / Protetor";
    const btnTexto = isPerdido ? "Vi este Pet (WhatsApp)" : "Quero Adotar (WhatsApp)";
    const waMsg = isPerdido
      ? `Olá, ${tutorNome}! Vi o anúncio do(a) ${encodeURIComponent(petNome)} como animal perdido no Best Buddy e gostaria de passar informações!`
      : `Olá, ${tutorNome}! Vi o anúncio do(a) ${encodeURIComponent(petNome)} para adoção no Best Buddy e tenho interesse em adotá-lo(a)!`;

    const contactHtml = cleanPhone
      ? `
        <div class="mt-6 p-4 rounded-xl bg-surface-700/60 border border-border/80">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <span class="text-xs uppercase tracking-wider text-ink-500 font-semibold block">Anunciante</span>
              <strong class="text-ink-100 text-base">${tutorNome}</strong>
            </div>
            <div class="text-right">
              <span class="text-xs uppercase tracking-wider text-ink-500 font-semibold block">Telefone / Ligação</span>
              <a href="tel:+55${cleanPhone}" class="text-brand-300 font-mono text-sm hover:underline font-bold">
                ${animal.telefone_contato}
              </a>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
            <a class="bb-btn bb-btn--primary flex-1 min-w-[200px] inline-flex items-center justify-center gap-2"
               href="https://wa.me/55${cleanPhone}?text=${waMsg}"
               target="_blank"
               rel="noopener noreferrer"
               id="bb-btn-adotar">
              ${btnTexto}
            </a>

            <a class="bb-btn bb-btn--secondary inline-flex items-center justify-center gap-2"
               href="tel:+55${cleanPhone}"
               title="Fazer ligação convencional">
              Ligar
            </a>
          </div>
        </div>
      `
      : `<p class="text-xs text-amber-300 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          Tutor aguardando validação de contato telefônico.
         </p>`;

    const currentUser = typeof bbStorage !== "undefined" && bbStorage.getUser();
    const isOwner = currentUser && (
      (animal.tutor_id && currentUser.id && Number(currentUser.id) === Number(animal.tutor_id)) ||
      (currentUser.email && animal.tutor_email && currentUser.email.toLowerCase() === animal.tutor_email.toLowerCase())
    );

    const ownerBarHtml = isOwner
      ? `
        <div class="mt-4 p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-brand-300">Este anúncio foi publicado por você!</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" class="bb-btn bb-btn--xs bb-btn--primary btn-detail-edit" data-id="${animal.id}" data-no-limit onclick="if(window.bbOpenEditModal){window.bbOpenEditModal('${animal.id}');}else{window.location.href='/pages/animals/index.html?edit=${animal.id}';}">
              ✏️ Editar Anúncio
            </button>
            ${animal.status !== "ADOTADO" && animal.status !== "ENCONTRADO" ? `
              <button type="button" class="bb-btn bb-btn--xs bb-btn--secondary btn-detail-finish" data-id="${animal.id}" data-status="${isPerdido ? 'ENCONTRADO' : 'ADOTADO'}">
                ${isPerdido ? 'Marcar Encontrado' : 'Marcar Adotado'}
              </button>
            ` : `<span class="text-xs text-ink-400 font-medium py-1 px-2 rounded bg-surface-700/60">Anúncio concluído</span>`}
          </div>
        </div>
      `
      : "";

    bbDetailEl.innerHTML = `
      <div class="bb-card animate-scale-in grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        <div class="bb-animal-card__image rounded-lg aspect-square flex-col gap-1${animal.imagem ? "" : " bb-animal-card__image--empty"}">${imageHtml}</div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <h1 class="bb-page-title mb-0">${animal.nome || "Pet sem nome"}</h1>
            <span class="bb-status-badge ${animal.status === 'ADOTADO' ? 'bb-status-badge--adotado' : animal.status === 'ENCONTRADO' ? 'bb-status-badge--encontrado' : isPerdido ? 'bb-status-badge--perdido' : 'bb-status-badge--adocao'}">
              ${animal.status === 'ADOTADO' ? 'Adotado' : animal.status === 'ENCONTRADO' ? 'Encontrado' : isPerdido ? 'Desaparecido' : 'Para Adoção'}
            </span>
          </div>

          <p class="text-ink-300 mb-4 flex flex-wrap gap-2">
            ${animal.cidade ? `<span class="px-3 py-1 rounded-full bg-surface-700 border border-border text-sm">${animal.cidade}${animal.estado ? ` - ${animal.estado}` : ''}</span>` : ""}
            <span class="px-3 py-1 rounded-full bg-surface-700 border border-border text-sm">${animal.raca || "SRD"}</span>
            ${animal.idade_aproximada ? `<span class="px-3 py-1 rounded-full bg-surface-700 border border-border text-sm">${animal.idade_aproximada}</span>` : ""}
            ${animal.sexo ? `<span class="px-3 py-1 rounded-full bg-surface-700 border border-border text-sm">${bbSexoLabel[animal.sexo] || animal.sexo}</span>` : ""}
          </p>

          ${animal.castrado ? `<p class="mb-1 text-sm"><strong class="text-ink-100">Castrado:</strong> <span class="text-ink-300">${animal.castrado}</span></p>` : ""}
          ${animal.medicamento ? `<p class="mb-1 text-sm"><strong class="text-ink-100">Faz uso de medicamentos:</strong> <span class="text-ink-300">${animal.medicamento}</span></p>` : ""}
          ${animal.local ? `<p class="mb-1 text-sm"><strong class="text-ink-100">Último local visto:</strong> <span class="text-ink-300">${animal.local}</span></p>` : ""}
          
          <p class="mt-4 mb-2 text-ink-300 leading-relaxed text-sm">${animal.descricao || "Sem descrição informada."}</p>
          
          ${ownerBarHtml}
          ${contactHtml}
        </div>
      </div>
    `;

    const detailEditBtn = document.querySelector(".btn-detail-edit");
    if (detailEditBtn) {
      detailEditBtn.addEventListener("click", () => {
        if (typeof window.bbOpenEditModal === "function") {
          window.bbOpenEditModal(detailEditBtn.dataset.id);
        } else {
          window.location.href = `/pages/animals/index.html?edit=${detailEditBtn.dataset.id}`;
        }
      });
    }

    const detailFinishBtn = document.querySelector(".btn-detail-finish");
    if (detailFinishBtn) {
      detailFinishBtn.addEventListener("click", async () => {
        const id = detailFinishBtn.dataset.id;
        const isPerdido = targetStatus === "ENCONTRADO";
        const confirmMsg = isPerdido
          ? "Deseja marcar este pet como ENCONTRADO? O anúncio será dado como concluído."
          : "Deseja marcar este pet como ADOTADO? Ele sairá da lista pública de animais disponíveis e somará no contador de adotados.";
        if (!confirm(confirmMsg)) return;

        detailFinishBtn.disabled = true;
        try {
          await animalService.update(id, { status: targetStatus });
          bbLoadDetail();
        } catch (err) {
          alert("Erro ao atualizar anúncio: " + err.message);
          detailFinishBtn.disabled = false;
        }
      });
    }

    if (typeof bbClickLimiter !== "undefined") {
      bbClickLimiter.autoProtectAll();
    }
  } catch (err) {
    bbDetailEl.innerHTML = typeof bbStateHtml === "function"
      ? bbStateHtml({ title: "Animal não encontrado.", description: err.message, isError: true })
      : `<p class="text-rose-400">Erro: ${err.message}</p>`;
  }
}

bbLoadDetail();
