const bbValidation = {
  isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
  },

  isRequired(value) {
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  },

  minLength(value, len) {
    return (value || "").length >= len;
  },

  // isCPF(value) {
  //   // Validação de formato (11 dígitos), não de dígito verificador -
  //   // suficiente para o front; validação forte fica a cargo do backend.
  //   const digits = (value || "").replace(/\D/g, "");
  //   return digits.length === 11;
  // },

  passwordsMatch(a, b) {
    return a === b;
  },

  isAlphanumericName(value) {
    if (!value || typeof value !== "string") return false;
    // Permite letras (incluindo acentuação latina), números e espaços
    return /^[A-Za-zÀ-ÿ0-9\s]+$/.test(value.trim());
  },

  isStrongPassword(value) {
    if (!value || typeof value !== "string") return false;
    return (
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value)
    );
  },

  isValidBrazilianPhone(value) {
    if (!value || typeof value !== "string" || !value.trim()) return false;
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 10 && digits.length !== 11) return false;
    if (/^(\d)\1+$/.test(digits)) return false;

    const ddd = parseInt(digits.slice(0, 2), 10);
    const validDDDs = [
      11, 12, 13, 14, 15, 16, 17, 18, 19,
      21, 22, 24, 27, 28,
      31, 32, 33, 34, 35, 37, 38,
      41, 42, 43, 44, 45, 46, 47, 48, 49,
      51, 53, 54, 55,
      61, 62, 63, 64, 65, 66, 67, 68, 69,
      71, 73, 74, 75, 77, 79,
      81, 82, 83, 84, 85, 86, 87, 88, 89,
      91, 92, 93, 94, 95, 96, 97, 98, 99
    ];
    if (!validDDDs.includes(ddd)) return false;

    // Se for celular de 11 dígitos, o 9º dígito deve ser 9
    if (digits.length === 11 && digits[2] !== "9") return false;

    return true;
  },

  isPhone(value) {
    if (!value || typeof value !== "string" || !value.trim()) return true;
    return bbValidation.isValidBrazilianPhone(value);
  },

  formatPhone(value) {
    const digits = (value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  },

  /**
   * Aplica um conjunto de regras a um objeto de dados e devolve
   * um mapa { campo: mensagem } apenas com os erros encontrados.
   *
   * rules: { campo: [{ test: fn, message: string }] }
   */
  runRules(data, rules) {
    const errors = {};
    for (const field of Object.keys(rules)) {
      for (const rule of rules[field]) {
        if (!rule.test(data[field], data)) {
          errors[field] = rule.message;
          break;
        }
      }
    }
    return errors;
  },
};
