# 📡 Integração — Contrato de API (Endpoints)
tags: #api #contrato #endpoints #rest #json

Este documento consolida o **contrato esperado pelo Frontend**, servindo como especificação canônica para o Backend.

**Base URL**: `http://127.0.0.1:8000/api`

---

## 1. Autenticação (`/api/token/` e `/api/usuarios/`)

### `POST /token/`
Obter tokens JWT de acesso e refresh.
- **Request**:
  ```json
  {
    "email": "usuario@bestbuddy.com",
    "password": "suasenha123"
  }
  ```
- **Response 200 (Desejado)**:
  ```json
  {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "email": "usuario@bestbuddy.com",
      "nome": "Ana Souza",
      "tipo": "PF"
    }
  }
  ```
- **Response 401**: `{"detail": "No active account found with the given credentials"}`

---

### `POST /token/refresh/`
Renovar o token de acesso expirado.
- **Request**: `{"refresh": "eyJhbGciOi..."}`
- **Response 200**: `{"access": "eyJhbGciOi..."}`

---

### `POST /usuarios/register/`
Cadastro de novo usuário adotante (Pessoa Física).
- **Request**:
  ```json
  {
    "nome": "Ana Souza",
    "cpf": "12345678901",
    "email": "ana@email.com",
    "telefone": "(16) 99999-0000",
    "password": "senhaSegura123",
    "tipo": "PF"
  }
  ```
- **Response 201**:
  ```json
  {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi..."
  }
  ```
- **Response 400**: Erros de validação (ex.: `{"email": ["Este campo deve ser único."]}`)

---

### `POST /usuarios/password-reset/`
Solicitar PIN de recuperação de senha por email.
- **Request**: `{"email": "ana@email.com"}`
- **Response 200**: `{"sent": true}`

---

### `POST /usuarios/password-reset/confirm/`
Confirmar PIN e redefinir senha.
- **Request**:
  ```json
  {
    "email": "ana@email.com",
    "pin": "1234",
    "password": "novaSenhaSegura456"
  }
  ```
- **Response 200**: `{"reset": true}`
- **Response 400**: `{"detail": "PIN inválido ou expirado."}`

---

## 2. Animais (`/api/animais/`)

### `GET /api/animais/`
Lista unificada de animais para adoção e animais desaparecidos.
- **Headers**: Nenhum obrigatório (acesso público `AllowAny`).
- **Query Params Suportados**:
  - `?tipo_servico=ADOCAO` ou `?tipo_servico=PERDIDO`
  - `?estado=SP` (Sigla da UF)
  - `?cidade=São Carlos`
  - `?tipo_animal=CACHORRO` (`CACHORRO`, `GATO`, `OUTRO`)
  - `?status=DISPONIVEL` (`DISPONIVEL`, `ADOTADO`, `PERDIDO`, `ENCONTRADO`, `INATIVO`)
  - `?tutor_id=1` (para listar os anúncios pertencentes a um usuário)
- **Response 200**:
  ```json
  [
    {
      "id": 1,
      "tutor_id": 1,
      "tutor_email": "usuario@bestbuddy.com",
      "tutor_nome": "Ana Souza",
      "contato": "(16) 99999-0000",
      "tipo_servico": "ADOCAO",
      "tipo_animal": "CACHORRO",
      "nome": "Max",
      "estado": "SP",
      "cidade": "São Carlos",
      "telefone_contato": "(16) 99999-0000",
      "descricao": "Dócil, adora brincar com bola.",
      "imagem": null,
      "status": "DISPONIVEL",
      "raca": "SRD",
      "sexo": "M",
      "idade_aproximada": "Adulto",
      "medicamento": "Não",
      "castrado": "Sim",
      "local": null,
      "inativado_em": null,
      "created_at": "2026-09-26T22:26:07Z",
      "updated_at": "2026-09-26T22:26:07Z"
    }
  ]
  ```

---

### `GET /api/animais/{id}/`
Detalhes de um animal específico.
- **Response 200**: Objeto único com a mesma estrutura acima.
- **Response 404**: `{"detail": "Não encontrado."}`

---

### `POST /api/animais/`
Publicação de anúncio de adoção ou reporte de animal perdido.
- **Headers**: `Authorization: Bearer <access_token>`
- **Content-Type**: Suporta `multipart/form-data` (recomendado para upload de foto) ou `application/json`.
- **Request (Exemplo FormData / Adoção)**:
  - `tipo_servico`: `"ADOCAO"`
  - `tipo_animal`: `"CACHORRO"`
  - `nome`: `"Caramelo"`
  - `estado`: `"SP"`
  - `cidade`: `"Campinas"`
  - `telefone_contato`: `"(19) 98888-7777"`
  - `descricao`: `"Pet muito carinhoso e dócil."`
  - `raca`: `"Vira-lata"`
  - `sexo`: `"M"`
  - `idade_aproximada`: `"Filhote"`
  - `castrado`: `"Sim"`
  - `medicamento`: `"Não"`
  - `imagem`: Arquivo binário de imagem (`.png`, `.jpg`, `.jpeg`, `.webp` de até 15 MB).
- **Regras de Negócio e Validações**:
  - `imagem`: Validação de extensão (`.png`, `.jpg`, `.jpeg`, `.webp`) e tamanho máximo de 15 MB. O backend converte automaticamente para WebP otimizado via Pillow ou aceita WebP comprimido pelo frontend (Fast-Path).
  - `telefone_contato`: Campo obrigatório (com DDD). Caso ausente, herda o telefone validado do tutor logado; se nenhum existir, rejeita com HTTP 400 (`"É necessário um número de contato para cadastrar o animal."`).
  - Cota de 5 anúncios ativos para usuários comuns (PF).
- **Response 201**: Registro criado com `id` e dados completos (incluindo URL da `imagem` persistida em `/media/animais/`).

---

### `PATCH /api/animais/{id}/`
Atualização de status do anúncio pelo tutor autenticado.
- **Headers**: `Authorization: Bearer <access_token>`
- **Request**: `{"status": "ADOTADO"}` ou `{"status": "ENCONTRADO"}`
- **Response 200**: Objeto atualizado.
- **Response 403**: `{"detail": "Você não tem permissão para gerenciar este anúncio."}` (caso o usuário não seja o tutor).

---

### `DELETE /api/animais/{id}/`
Exclusão de anúncio pelo tutor.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response 204**: Sem conteúdo.
- **Response 403**: Proibido para usuários terceiros.

---

## 3. Adoção Direta (Contato via WhatsApp)

> [!WARNING]
> **Endpoint Descontinuado:** O endpoint `POST /adocoes/` foi descontinuado (retorna HTTP 404). O fluxo ocorre diretamente com o tutor via link do WhatsApp gerado a partir do `telefone_contato`.

---

## 4. Comunidade e Notícias (`/api/comunidade/`) [DESCONTINUADO]

> [!WARNING]
> **Módulo Descontinuado:** Conforme decisão de produto, o mural livre de posts e o feed de notícias foram abandonados para simplificar o escopo e focar no contato direto via WhatsApp.
> - `GET /api/comunidade/noticias/` $\rightarrow$ **HTTP 404 (Not Found)**
> - `GET /api/comunidade/posts/` $\rightarrow$ **HTTP 404 (Not Found)**
> - Os animais desaparecidos foram migrados para `/api/animais/?tipo_servico=PERDIDO`.

---

## 5. Validação de WhatsApp via Twilio (`/api/usuarios/whatsapp/`)

### `POST /api/usuarios/whatsapp/enviar/`
Dispara código SMS/WhatsApp de validação para o número informado.
- **Headers**: `Authorization: Bearer <access_token>`
- **Request**: `{"telefone": "11988887777"}`
- **Response 200**: `{"mensagem": "Código de verificação enviado."}`

### `POST /api/usuarios/whatsapp/verificar/`
Valida o código digitado pelo usuário e atualiza `telefone_validado = True`.
- **Headers**: `Authorization: Bearer <access_token>`
- **Request**: `{"telefone": "11988887777", "codigo": "123456"}`
- **Response 200**:
  ```json
  {
    "mensagem": "Telefone verificado com sucesso!",
    "telefone": "11988887777",
    "telefone_validado": true
  }
  ```

---

## 6. Denúncias (`/api/denuncias/`)

### `POST /denuncias/`
Registro de denúncia qualificada por usuário autenticado.
- **Headers**: `Authorization: Bearer <access_token>` (obrigatório)
- **Request**:
  ```json
  {
    "tipo_alvo": "ADOCAO",
    "alvo_id": 1,
    "motivo_categoria": "MAUS_TRATOS",
    "justificativa_texto": "Animal apresenta sinais graves de desnutrição e abandono nas fotos."
  }
  ```
- **Response 201**:
  ```json
  {
    "id": 5,
    "status": "PENDENTE",
    "motivo_categoria": "MAUS_TRATOS",
    "created_at": "2026-09-15T20:00:00Z"
  }
  ```
- **Response 401**: `{"detail": "Authentication credentials were not provided."}`

---

## 7. Serviços (`/api/servicos/`)

### `GET /servicos/`
Listagem pública de prestadores homologados.
- **Query Params Suportados**: `?cidade=Araraquara&tipo_servico=veterinario`
- **Response 200**: Lista de serviços com status `APROVADO`.

### `POST /servicos/`
Solicitação de inclusão de serviço profissional.
- **Headers**: `Authorization: Bearer <access_token>`
- **Request**:
  ```json
  {
    "tipo_cadastro": "PJ",
    "nome": "Clínica Veterinária PetCare",
    "tipos_servicos": ["veterinario", "internacao", "banho_tosa"],
    "crmv": "SP-12345",
    "horario_atendimento": "Segunda a Sábado, 08h às 18h",
    "telefone": "(16) 3333-4444",
    "aceita_whatsapp": true,
    "cidades_atuacao": "Araraquara, Américo Brasiliense",
    "informacoes_extras": "Atendimento 24h em emergências."
  }
  ```
- **Response 201**: Criado com status `PENDENTE` (aguarda moderação no Admin).

---

## 8. Solicitação de ONG (`/api/usuarios/solicitar-ong/`)

### `POST /usuarios/solicitar-ong/`
Submissão de pedido de upgrade institucional para cota ilimitada.
- **Headers**: `Authorization: Bearer <access_token>`
- **Request**:
  ```json
  {
    "cnpj": "12.345.678/0001-90",
    "razao_social": "Associação Protetora dos Animais Vira-Lata",
    "nome_contato": "Mariana Ribeiro",
    "email_contato": "contato@viralata.org.br",
    "telefone": "(16) 3333-9999",
    "endereco": "Rua dos Resgatados, 100 - Araraquara/SP"
  }
  ```
- **Response 201**: Pedido gravado com status `PENDENTE` para triagem da Staff.

---

Veja também:
- [[02 - Matriz de Divergências (Front vs Back)]]
- [[03 - Fluxo de Autenticação JWT]]
- [[02 - Requisitos Funcionais]]
- [[05 - Modelagem de Dados e Relacionamentos]]
