function bbStateHtml({ title, description, isError = false }) {
  const icon = isError
    ? `<div class="w-10 h-10 mx-auto mb-3 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-lg">!</div>`
    : `<div class="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-lg">&bull;</div>`;
  return `
    <div class="bb-state" role="status">
      ${icon}
      <p class="bb-state__title${isError ? " text-danger" : ""}">${title}</p>
      ${description ? `<p>${description}</p>` : ""}
    </div>
  `;
}

const bbLoadingHtml = bbStateHtml({ title: "Carregando...", description: "" });

/**
 * Skeleton de cards para grids enquanto os dados carregam - evita o "pulo"
 * de layout entre o estado de loading e o conteúdo real.
 */
function bbSkeletonGridHtml(count = 4) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="bb-card--tight bg-surface-800 border border-border rounded-xl overflow-hidden">
        <div class="bb-skeleton aspect-[4/3] rounded-none"></div>
        <div class="p-4 flex flex-col gap-2">
          <div class="bb-skeleton h-4 w-3/4"></div>
          <div class="bb-skeleton h-3 w-1/2"></div>
        </div>
      </div>`
    )
    .join("");
}
