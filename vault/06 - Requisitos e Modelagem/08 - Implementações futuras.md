# 🚀 Implementações Futuras (Backlog de Evolução)
tags: #roadmap #backlog #futuro #melhorias #best-buddy

Este documento centraliza as funcionalidades, regras de negócio e requisitos funcionais que foram **postergados para fases posteriores ao MVP**, mantendo o escopo inicial enxuto, ágil e focado na entrega de valor central (adoção e resgate de animais).

---

## 📱 Módulo Futuro 1: Validação de WhatsApp via Twilio Verify

### `RN06_FUT` — Validação Prévia de WhatsApp no Perfil
* **Regra:** Nenhum animal poderá ser cadastrado por usuário com `telefone_validado == False`.
* **Mecanismo:**
  1. O usuário pode criar a conta sem número de telefone de imediato.
  2. Para habilitar o anúncio de animais, deve informar o telefone e validá-lo via **Twilio Verify (canal WhatsApp)**.
  3. Ao inserir o PIN correto recebido via WhatsApp, o número fica vinculado ao usuário e a flag `telefone_validado` é ativada (`True`).
  4. O formulário de animal não possui campo livre de telefone: o contato é resolvido via Chave Estrangeira (`animal.tutor.telefone`).
  5. Se o tutor alterar o número no perfil, deve revalidar o novo número via Twilio. Após aprovado, o novo número reflete automaticamente em todos os anúncios ativos.

---

## 🏢 Módulo Futuro 2: Solicitação e Upgrade de Contas de ONG

### `RN04_FUT` — Cota Ilimitada Exclusiva para ONGs
* **Regra:** Usuários com perfil validado de ONG (`tipo_usuario == 'ONG'`) terão permissão para cadastrar animais para adoção e perdidos sem limitação de cota (mais de 5 animais).

### `RN08_FUT` — Homologação em Duas Etapas para ONGs
* **Regra:** Nenhuma conta se torna ONG de forma automática. O usuário submete formulário institucional com CNPJ, Razão Social e endereço; a solicitação entra com status `Pendente` e só é promovida a `ONG` após homologação formal da Staff no Django Admin.

### `RF22_FUT` — Formulário de Solicitação de ONG
* **Descrição:** Interface para usuário autenticado submeter dados da organização: CNPJ, Razão Social, Nome do contato, Email oficial, Telefone e Endereço completo.

### `RF23_FUT` — Fila de Moderação e Concessão de Upgrade
* **Descrição:** Fila no painel administrativo para análise e aprovação de solicitações de ONG pela Staff, concedendo privilégio de anúncios ilimitados.

---

## 🏥 Módulo Futuro 3: Catálogo de Serviços Profissionais e Clínicas

### `RN09_FUT` — Homologação em Duas Etapas para Serviços
* **Regra:** Nenhum prestador de serviço ou clínica veterinária é publicado de imediato na vitrine. A proposta entra como `Pendente` e passa por análise da Staff no painel Django antes de se tornar `Aprovado`.

### `RN14_FUT` — Exigência de CRMV para Serviços Veterinários
* **Regra:** Se a proposta de serviço marcar a opção "Serviço Veterinário", o preenchimento e comprovação do CRMV é estritamente obrigatório.

### `RF18_FUT` — Vitrine Pública de Serviços
* **Descrição:** Exibição pública de cards de serviços aprovados, com foto/logo, nome do estabelecimento/profissional, lista de serviços prestados, horários, telefone/WhatsApp e cidades atendidas.

### `RF19_FUT` — Solicitação de Credenciamento de Serviço
* **Descrição:** Usuário logado pode submeter proposta de credenciamento informando: PF ou PJ, foto da fachada/profissional, nome, serviços prestados, CRMV (se aplicável), horários, telefone, cidades de atuação e informações extras (máx. 255 chars).

### `RF20_FUT` — Fila de Aprovação de Serviços
* **Descrição:** O serviço é criado com status `Pendente` e só passa a ser exibido na vitrine após aprovação formal por Staff ou SuperUser.

### `RF21_FUT` — Moderação Estrita da Staff em Serviços
* **Descrição:** A Staff pode aprovar, suspender ou inativar o serviço, mas é impedida de alterar o conteúdo dos dados cadastrais do prestador.

---

## 🚨 Módulo Futuro 4: Sistema Universal de Denúncias

### `RN11_FUT` — Denúncias Rastreáveis e Categorizadas
* **Regra:** Toda denúncia exige autenticação obrigatória do denunciante (`denunciante_id NOT NULL`), seleção de categoria via Enum (Maus-tratos, Fraude/Golpe, Dados Falsos, Animal já adotado, Exercício ilegal da profissão, Spam/Ofensivo ou Outro) e justificativa textual.

### `RF24_FUT` — Botão de Denúncia em Cards com Login Obrigatório
* **Descrição:** Botão de denúncia disponível nos cards de adoção e animais perdidos, restrito a usuários autenticados.

### `RF25_FUT` — Motivo Obrigatório via Enum
* **Descrição:** Modal estruturado para registro de denúncia com categoria pré-definida e justificativa textual detalhada.

### `RF26_FUT` — Fila de Triagem de Denúncias
* **Descrição:** Painel no Django Admin para moderação de denúncias pela Staff, com histórico, parecer e atalho para inativar o conteúdo denunciado.

---

## 🛡️ Módulo Futuro 5: Painel Administrativo com Restrições Avançadas de Staff

### `RN10_FUT` — Restrições Operacionais Estritas da Staff
* **Regra:** A Staff atua na moderação com limitações de segurança:
  1. Não pode alterar dados cadastrais de terceiros (apenas suspender ou aprovar).
  2. Não pode alterar ou excluir contas de outros membros da Staff ou de SuperUsers.
  3. Não visualiza colunas de auditoria (`created_at` e `updated_at`) no painel.

### `RF27_FUT` — Gestão de Staff Exclusiva de SuperUser
* **Descrição:** Apenas SuperUsers têm permissão para criar, editar privilégios ou remover membros da Staff.

### `RF28_FUT` — Ocultação de Logs de Auditoria para Staff
* **Descrição:** Membros da Staff não visualizam as colunas de auditoria `created_at` e `updated_at`.

### `RF29_FUT` — Bloqueio de Alteração Entre Moderadores
* **Descrição:** Usuários Staff não podem alterar perfis de outros membros da Staff nem de SuperUsers.

---

## 🔑 Módulo Futuro 6: Recuperação de Conta e Redefinição de Senha

### `RF05_FUT` — Recuperação de Senha por Email
* **Descrição:** Fluxo automatizado de recuperação de acesso à conta:
  1. O usuário solicita recuperação informando o email cadastrado.
  2. O backend gera um token temporal seguro e criptograficamente assinado.
  3. Envio de link seguro por email para a interface de redefinição de senha (`/pages/auth/reset-password.html?token=...`).
  4. O usuário valida o token e define sua nova credencial de acesso.
* **Motivo do Adiamento:** Simplificar o escopo de entrega do MVP, priorizando os fluxos de login, cadastro, edição direta no perfil e gestão de anúncios.

---

## 🔗 Próximas Notas Relacionadas
- [[02 - Requisitos Funcionais]] — Requisitos ativos do MVP.
- [[04 - Regras de Negócio]] — Regras ativas do MVP.
- [[05 - Modelagem de Dados e Relacionamentos]] — Schema do banco.
