# 🎭 Frontend — Mocks e Modo Desacoplado
tags: #frontend #mocks #testing #offline-first

## 1. O que é o Modo Mock?

O modo mock é a estratégia adotada pelo time de frontend para desenvolver e testar toda a interface de usuário de forma **100% autônoma**, sem depender da disponibilidade ou estabilidade do backend Django.

Ao abrir o projeto, ele roda por padrão no modo mock.

---

## 2. Como Alternar entre Mock e API Real

O controle é feito exclusivamente no arquivo:
`frontend/js/config.js`

```javascript
window.BB_CONFIG = {
  USE_MOCKS: true,                        // true = dados fake; false = chama backend Django
  API_BASE_URL: "http://127.0.0.1:8000/api", // Endereço da API Django REST
  MOCK_LATENCY_MS: 400,                   // Latência simulada em ms para exibir skeletons/spinners
};
```

Quando você muda `USE_MOCKS` para `false`:
- Nenhuma linha de HTML ou de página precisa ser modificada.
- Todos os `services` passam a invocar o `bbClient` via chamadas HTTP reais.

---

## 3. Estrutura dos Mocks

Os arquivos residem em `frontend/js/mocks/`:

### `mock-utils.js`
- `bbMockDelay(valor)`: Retorna uma `Promise` que se resolve após `MOCK_LATENCY_MS`. Permite visualizar os estados de carregamento (skeletons e spinners no botão) com naturalidade durante os testes.
- `bbMockError(mensagem, status)`: Retorna uma `Promise` rejeitada com um `BBApiError`, permitindo testar cenários de falha na interface (ex.: PIN inválido, animal não encontrado, senha incorreta).

### `mock-data.js`
Armazena a base de dados em memória:
- **Usuário Padrão**:
  ```javascript
  const BB_MOCK_USER = {
    id: 1,
    email: "usuario@bestbuddy.com",
    tipo: "PF",
    nome: "Ana Souza",
  };
  ```
- **Credenciais**: `usuario@bestbuddy.com` / `123456`
- **Animais (6 animais de teste)**:
  - Max (SRD, Macho, Adulto)
  - Luna (Vira-lata caramelo, Fêmea, Filhote)
  - Thor (Pastor Alemão, Macho, Adulto)
  - Nina (SRD, Fêmea, Idoso)
  - Bidu (Poodle, Macho, Adulto)
  - Mel (SRD, Fêmea, Filhote)
- **Posts da Comunidade (2 posts de exemplo)**
- **Animais Desaparecidos (3 registros com local, contato e descrição)**
- **Notícias da ONG (1 notícia)**

---

## 4. Persistência em Memória durante a Sessão

No modo mock, operações de criação funcionam de verdade na memória da aba:
- Cadastrar novo animal (`animalService.create`) insere o novo pet no topo do array `BB_MOCK_ANIMALS`.
- Reportar animal desaparecido (`communityService.reportMissingAnimal`) insere no topo do array `BB_MOCK_MISSING_ANIMALS`.
- Submeter formulário de adoção (`adoptionService.create`) gera ID timestamp e devolve status `"A"` (Aberta).

Veja também:
- [[01 - Estrutura e Tecnologias]]
- [[03 - Serviços e Camada de API]]
