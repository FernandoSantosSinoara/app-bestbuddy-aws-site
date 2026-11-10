const adoptionService = {
  /**
   * payload esperado (contrato desejado):
   * {
   *   animal_id, nome_adotante, email_adotante, telefone_adotante,
   *   ja_teve_animais, tem_outros_animais, motivacao
   * }
   */
  async create(payload) {
    if (window.BB_CONFIG.USE_MOCKS) {
      return bbMockDelay({ id: Date.now(), status: "A", ...payload });
    }
    return bbClient.post("/adocoes/", payload);
  },
};
