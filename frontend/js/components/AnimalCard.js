function bbAnimalCardHtml(animal) {
  const isPerdido = animal.tipo_servico === "PERDIDO";
  const sexoLabel = animal.sexo === "M" ? "Macho" : animal.sexo === "F" ? "Fêmea" : "Indeterminado";
  const currentUser = typeof bbStorage !== "undefined" && bbStorage.getUser();
  const isOwner = currentUser && (
    (animal.tutor_id && currentUser.id && Number(currentUser.id) === Number(animal.tutor_id)) ||
    (currentUser.email && animal.tutor_email && currentUser.email.toLowerCase() === animal.tutor_email.toLowerCase())
  );

  let statusBadge = "";
  if (animal.status === "ADOTADO") {
    statusBadge = `<span class="bb-status-badge bb-status-badge--adotado">Adotado</span>`;
  } else if (animal.status === "ENCONTRADO") {
    statusBadge = `<span class="bb-status-badge bb-status-badge--encontrado">Encontrado</span>`;
  } else if (isPerdido) {
    statusBadge = `<span class="bb-status-badge bb-status-badge--perdido">Desaparecido</span>`;
  } else {
    statusBadge = `<span class="bb-status-badge bb-status-badge--adocao">Para Adoção</span>`;
  }

  const imageHtml = animal.imagem
    ? `<img src="${animal.imagem}" alt="${animal.nome || 'Pet'}" class="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" loading="lazy" onerror="this.parentElement.classList.add('bb-animal-card__image--empty'); this.remove();" />`
    : `<span class="text-xs uppercase tracking-wider text-slate-400 font-semibold">Sem foto</span>`;

  const cleanPhone = (animal.telefone_contato || animal.contato || "").replace(/\D/g, "");
  const petNome = animal.nome || "pet";
  const waMsg = isPerdido
    ? `Olá! Vi o anúncio do pet ${encodeURIComponent(petNome)} no Best Buddy e tenho informações!`
    : `Olá! Vi o anúncio do pet ${encodeURIComponent(petNome)} para adoção no Best Buddy e tenho interesse em adotá-lo!`;
  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${waMsg}` : `/pages/animals/detail.html?id=${animal.id}`;

  let ownerActionsHtml = "";
  if (isOwner) {
    const isFinished = animal.status === "ADOTADO" || animal.status === "ENCONTRADO";
    const finishBtnText = isPerdido ? "Marcar Encontrado" : "Marcar Adotado";
    const targetStatus = isPerdido ? "ENCONTRADO" : "ADOTADO";

    ownerActionsHtml = `
      <div class="bb-owner-actions mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
        ${!isFinished ? `
          <button type="button" class="bb-btn-primary-card flex-1 min-w-[110px] text-xs py-1.5 px-2.5 rounded-lg btn-finish-animal" data-id="${animal.id}" data-status="${targetStatus}">
            ${finishBtnText}
          </button>
        ` : `<span class="text-xs text-slate-400 font-medium py-1 px-2 rounded bg-slate-100">Anúncio concluído</span>`}
        <button type="button" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors btn-edit-animal" data-id="${animal.id}" data-no-limit onclick="event.stopPropagation();if(window.bbOpenEditModal){window.bbOpenEditModal('${animal.id}');}else{window.location.href='/pages/animals/index.html?edit=${animal.id}';}" title="Editar informações">
          ✏️ Editar
        </button>
        <button type="button" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors btn-delete-animal" data-id="${animal.id}" title="Excluir anúncio">
          Excluir
        </button>
      </div>
    `;
  }

  const actionButtonHtml = !isOwner ? `
    <a href="${waLink}" ${cleanPhone ? 'target="_blank" rel="noopener noreferrer"' : ''} class="bb-adopt-btn" onclick="event.stopPropagation()">
      ${isPerdido ? 'Vi este pet' : 'Quero adotar'}
    </a>
  ` : '';

  return `
    <div class="bb-pet-card bb-animal-card group" data-card-id="${animal.id}">
      <div class="bb-pet-card__header">
        <div class="bb-pet-card__image-wrap${animal.imagem ? "" : " bb-animal-card__image--empty"}">
          ${imageHtml}
          <div class="bb-pet-card__badge">
            ${statusBadge}
          </div>
        </div>

        <div class="bb-pet-card__body">
          <h3 class="bb-pet-card__title">
            ${animal.nome || (isPerdido ? "Pet Perdido" : "Pet sem nome")}
          </h3>
          <p class="bb-pet-card__subtitle">
            ${animal.raca || "Vira-lata"}
          </p>

          <div class="bb-pet-card__tags">
            ${animal.idade_aproximada ? `
              <span class="bb-pet-tag">${animal.idade_aproximada}</span>
            ` : ''}
            ${animal.porte ? `
              <span class="bb-pet-tag">${animal.porte}</span>
            ` : ''}
            <span class="bb-pet-tag">${sexoLabel}</span>
            ${animal.cidade ? `
              <span class="bb-pet-tag bb-pet-tag--location" title="${animal.cidade}${animal.estado ? ` - ${animal.estado}` : ''}">
                ${animal.cidade}${animal.estado ? ` - ${animal.estado}` : ''}
              </span>
            ` : ''}
          </div>

          ${isPerdido && animal.local ? `
            <p class="text-[11px] text-amber-600 font-medium mt-1 truncate" title="${animal.local}">
              Visto em: ${animal.local}
            </p>
          ` : ""}
        </div>
      </div>

      <div class="bb-pet-card__footer">
        ${actionButtonHtml}
        ${ownerActionsHtml}
      </div>
    </div>
  `;
}
