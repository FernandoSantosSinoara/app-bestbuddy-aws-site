function bbMissingAnimalCardHtml(item) {
  const cleanPhone = (item.telefone_contato || "").replace(/\D/g, "");
  const waBtn = cleanPhone
    ? `<a href="https://wa.me/55${cleanPhone}?text=Olá!%20Vi%20seu%20anúncio%20do%20animal%20desaparecido%20${encodeURIComponent(item.nome || 'pet')}" target="_blank" rel="noopener noreferrer" class="bb-btn bb-btn--sm bb-btn--primary mt-2 inline-flex items-center gap-1 text-xs">
        Falar no WhatsApp
      </a>`
    : "";

  const localizacao = item.cidade 
    ? `${item.local ? `${item.local} - ` : ''}${item.cidade}${item.estado ? ` - ${item.estado}` : ''}`
    : (item.local || "Local não informado");

  return `
    <article class="bb-post-card border-amber-500/40 bg-slate-800/40 p-4 rounded-xl">
      <div class="flex items-center justify-between gap-2 mb-1">
        <div class="flex items-center gap-2">
          <strong class="text-slate-100">${item.nome || "Pet Desaparecido"}</strong>
        </div>
        <span class="bb-status-badge bb-status-badge--perdido">Desaparecido</span>
      </div>
      <p class="my-1 text-slate-300 text-sm">Local: ${localizacao}</p>
      <p class="mb-2 text-slate-200 text-sm">${item.descricao || "Sem descrição adicional."}</p>
      <div class="bb-post-card__meta text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
        <span>Contato: <strong>${item.telefone_contato || "Validado via WhatsApp"}</strong></span>
        <span>${typeof bbFormatDate === "function" ? bbFormatDate(item.created_at) : ""}</span>
      </div>
      ${waBtn}
    </article>
  `;
}
