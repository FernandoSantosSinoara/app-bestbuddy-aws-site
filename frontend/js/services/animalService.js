const animalService = {
  async list(params = {}) {
    if (window.BB_CONFIG && window.BB_CONFIG.USE_MOCKS) {
      let items = [...(window.BB_MOCK_ANIMALS || [])];
      if (params.tipo_servico) {
        items = items.filter((a) => (a.tipo_servico || "ADOCAO") === params.tipo_servico);
      }
      if (params.estado) {
        items = items.filter((a) => (a.estado || "").toUpperCase() === params.estado.toUpperCase());
      }
      if (params.cidade) {
        items = items.filter((a) => (a.cidade || "").toLowerCase().includes(params.cidade.toLowerCase()));
      }
      if (params.tipo_animal) {
        items = items.filter((a) => (a.tipo_animal || "").toUpperCase() === params.tipo_animal.toUpperCase());
      }
      if (params.status) {
        items = items.filter((a) => (a.status || "").toUpperCase() === params.status.toUpperCase());
      }
      if (params.exclude_status) {
        items = items.filter((a) => (a.status || "").toUpperCase() !== params.exclude_status.toUpperCase());
      }
      if (params.tutor_id) {
        items = items.filter((a) => String(a.tutor_id) === String(params.tutor_id));
      }
      if (params.tempo) {
        const now = Date.now();
        const maxAgeMs = params.tempo === "semana" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        items = items.filter((a) => {
          if (!a.created_at) return true;
          return (now - new Date(a.created_at).getTime()) <= maxAgeMs;
        });
      }
      return bbMockDelay(items);
    }
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/animais/?${query}` : "/animais/";
    return bbClient.get(endpoint);
  },

  async getStats() {
    if (window.BB_CONFIG && window.BB_CONFIG.USE_MOCKS) {
      const animals = window.BB_MOCK_ANIMALS || [];
      const total_adotados = animals.filter((a) => a.status === "ADOTADO").length;
      const total_disponiveis = animals.filter((a) => (a.tipo_servico || "ADOCAO") === "ADOCAO" && a.status === "DISPONIVEL").length;
      const total_perdidos = animals.filter((a) => a.tipo_servico === "PERDIDO" && a.status === "PERDIDO").length;
      const total_encontrados = animals.filter((a) => a.status === "ENCONTRADO").length;
      return bbMockDelay({
        total_adotados,
        total_disponiveis,
        total_perdidos,
        total_encontrados,
        total_geral: animals.length,
      });
    }
    return bbClient.get("/animais/estatisticas/");
  },

  async getById(id) {
    if (window.BB_CONFIG && window.BB_CONFIG.USE_MOCKS) {
      const animal = (window.BB_MOCK_ANIMALS || []).find((a) => String(a.id) === String(id));
      if (!animal) return bbMockError("Animal não encontrado.", 404);
      return bbMockDelay(animal);
    }
    return bbClient.get(`/animais/${id}/`);
  },

  async create(payload) {
    if (window.BB_CONFIG && window.BB_CONFIG.USE_MOCKS) {
      const newAnimal = { id: Date.now(), ...payload };
      if (!window.BB_MOCK_ANIMALS) window.BB_MOCK_ANIMALS = [];
      window.BB_MOCK_ANIMALS.unshift(newAnimal);
      return bbMockDelay(newAnimal);
    }
    return bbClient.post("/animais/", payload);
  },

  async update(id, payload) {
    if (window.BB_CONFIG && window.BB_CONFIG.USE_MOCKS) {
      const idx = (window.BB_MOCK_ANIMALS || []).findIndex((a) => String(a.id) === String(id));
      if (idx !== -1) {
        window.BB_MOCK_ANIMALS[idx] = { ...window.BB_MOCK_ANIMALS[idx], ...payload };
        return bbMockDelay(window.BB_MOCK_ANIMALS[idx]);
      }
      return bbMockError("Animal não encontrado.", 404);
    }
    return bbClient.patch(`/animais/${id}/`, payload);
  },

  async updateStatus(id, status) {
    return this.update(id, { status });
  },

  async delete(id) {
    if (window.BB_CONFIG && window.BB_CONFIG.USE_MOCKS) {
      window.BB_MOCK_ANIMALS = (window.BB_MOCK_ANIMALS || []).filter((a) => String(a.id) !== String(id));
      return bbMockDelay({ success: true });
    }
    return bbClient.delete(`/animais/${id}/`);
  },

  async remove(id) {
    return this.delete(id);
  },
};

