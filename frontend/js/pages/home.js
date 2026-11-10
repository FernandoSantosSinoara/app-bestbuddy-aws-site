if (typeof bbRenderNavigation === "function") {
  bbRenderNavigation("#bb-nav", "home");
}
if (typeof bbRenderFooter === "function") {
  bbRenderFooter("#bb-footer");
}
if (typeof bbRenderHeroCarousel === "function") {
  bbRenderHeroCarousel("#bb-hero");
}

const bbHomePetsEl = document.getElementById("bb-home-pets");
const bbHomeFiltersEl = document.getElementById("bb-home-filters");

let allHomePets = [];
let activeHomeFilter = "ALL";

function renderHomePets() {
  if (!bbHomePetsEl) return;

  let filtered = allHomePets;
  if (activeHomeFilter !== "ALL") {
    filtered = allHomePets.filter(
      (pet) => (pet.tipo_animal || "").toUpperCase() === activeHomeFilter.toUpperCase()
    );
  }

  if (filtered.length === 0) {
    bbHomePetsEl.innerHTML = `
      <div class="col-span-full py-12 text-center text-ink-300 bg-white border border-border/80 rounded-2xl p-8">
        <h4 class="font-bold text-ink-100 text-base mb-1">Nenhum animal encontrado para esta categoria</h4>
        <p class="text-xs text-ink-300">Que tal anunciar um pet e ajudar a encontrar um lar?</p>
      </div>
    `;
    return;
  }

  // Exibe os animais (máx 10 para 2 linhas perfeitas de 5 cards)
  const displayPets = filtered.slice(0, 10);
  bbHomePetsEl.innerHTML = displayPets.map(bbAnimalCardHtml).join("");

  // Event listener para clique no card (redireciona para o detalhe)
  bbHomePetsEl.querySelectorAll(".bb-pet-card, .bb-animal-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest(".bb-owner-actions")
      ) {
        return;
      }
      const petId = card.getAttribute("data-card-id");
      if (petId) {
        window.location.href = `/pages/animals/detail.html?id=${petId}`;
      }
    });
  });

  // Ações do dono (caso o usuário logado seja tutor de algum pet)
  bbHomePetsEl.querySelectorAll(".btn-delete-animal").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      if (confirm("Tem certeza que deseja excluir este anúncio?")) {
        try {
          await animalService.remove(id);
          allHomePets = allHomePets.filter((p) => String(p.id) !== String(id));
          renderHomePets();
        } catch (err) {
          alert("Erro ao excluir: " + err.message);
        }
      }
    });
  });

  bbHomePetsEl.querySelectorAll(".btn-edit-animal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      window.location.href = `/pages/animals/index.html?edit=${id}`;
    });
  });

  bbHomePetsEl.querySelectorAll(".btn-finish-animal").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const targetStatus = btn.getAttribute("data-status") || "ADOTADO";
      const isPerdido = targetStatus === "ENCONTRADO";
      const confirmMsg = isPerdido
        ? "Deseja marcar este pet como ENCONTRADO? O anúncio será dado como concluído."
        : "Deseja marcar este pet como ADOTADO? Ele sairá da lista de animais disponíveis e somará no contador de adotados.";
      if (!confirm(confirmMsg)) return;

      btn.disabled = true;
      try {
        await animalService.update(id, { status: targetStatus });
        // REGRA DE NEGÓCIO: animal adotado sai imediatamente da lista de animais!
        allHomePets = allHomePets.filter((item) => String(item.id) !== String(id));
        renderHomePets();

        if (targetStatus === "ADOTADO") {
          const adoptedCountEl = document.getElementById("bb-home-adopted-count");
          if (adoptedCountEl) {
            const current = parseInt(adoptedCountEl.textContent, 10) || 0;
            adoptedCountEl.textContent = current + 1;
            adoptedCountEl.classList.add("scale-125", "transition-transform", "duration-300");
            setTimeout(() => adoptedCountEl.classList.remove("scale-125"), 600);
          }
        }
      } catch (err) {
        alert("Erro ao atualizar status: " + err.message);
        btn.disabled = false;
      }
    });
  });
}

function setupFilterEvents() {
  if (!bbHomeFiltersEl) return;

  const buttons = bbHomeFiltersEl.querySelectorAll(".bb-filter-pill");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter") || "ALL";
      activeHomeFilter = filter;

      buttons.forEach((b) => {
        b.classList.remove(
          "bg-[#2f80ed]",
          "bg-brand-500",
          "text-white",
          "shadow-sm",
          "active"
        );
        b.classList.add(
          "bg-white",
          "border",
          "border-border",
          "text-ink-300"
        );
      });

      btn.classList.remove("bg-white", "border", "border-border", "text-ink-300");
      btn.classList.add("bg-[#2f80ed]", "text-white", "shadow-sm", "active");

      renderHomePets();
    });
  });
}

async function bbLoadHomePets() {
  if (!bbHomePetsEl) return;
  bbHomePetsEl.innerHTML = typeof bbSkeletonGridHtml === "function" ? bbSkeletonGridHtml(5) : `
    <div class="col-span-full py-12 text-center text-ink-300">
      <div class="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-2"></div>
      <p class="text-xs">Carregando pets para adoção...</p>
    </div>
  `;

  try {
    const [list, stats] = await Promise.all([
      animalService.list({ tipo_servico: "ADOCAO", exclude_status: "ADOTADO" }),
      animalService.getStats().catch(() => null),
    ]);
    // REGRA DE NEGÓCIO: animais adotados saem da vitrine de pets esperando por um lar!
    const rawList = Array.isArray(list) ? list : [];
    allHomePets = rawList.filter((pet) => (pet.status || "").toUpperCase() !== "ADOTADO");
    renderHomePets();

    const adoptedCountEl = document.getElementById("bb-home-adopted-count");
    if (adoptedCountEl && stats && typeof stats.total_adotados === "number") {
      adoptedCountEl.textContent = stats.total_adotados;
    }
  } catch (err) {
    bbHomePetsEl.innerHTML = `
      <div class="col-span-full py-10 text-center text-danger">
        <p class="font-bold text-sm">Não foi possível carregar os animais.</p>
        <p class="text-xs text-ink-300 mt-1">${err.message}</p>
      </div>
    `;
  }
}

function bbCheckSessionExpiredNotice() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("session") === "expired") {
    const banner = document.createElement("div");
    banner.className =
      "bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center justify-between";
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span>Sua sessão expirou por inatividade. Você pode continuar navegando ou entrar novamente quando quiser.</span>
      </div>
      <button type="button" class="text-amber-700 hover:text-ink-100 text-xs font-bold uppercase tracking-wider ml-4 cursor-pointer" onclick="this.parentElement.remove()">&times;</button>
    `;
    const container = document.querySelector(".bb-container");
    if (container) {
      container.insertBefore(banner, container.firstChild);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

setupFilterEvents();
bbCheckSessionExpiredNotice();
bbLoadHomePets();
