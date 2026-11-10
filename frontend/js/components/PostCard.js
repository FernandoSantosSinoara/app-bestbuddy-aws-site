function bbFormatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch (_) {
    return "";
  }
}

function bbPostCardHtml(post) {
  return `
    <article class="bb-post-card">
      <p class="m-0 text-ink-100 leading-relaxed">${post.texto}</p>
      <div class="bb-post-card__meta">
        <span class="font-medium text-ink-300">${post.autor}</span>
        <span>${bbFormatDate(post.created_at)}</span>
      </div>
    </article>
  `;
}
