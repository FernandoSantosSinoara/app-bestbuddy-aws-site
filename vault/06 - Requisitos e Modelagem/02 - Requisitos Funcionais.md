# ⚙️ Requisitos Funcionais (RF)
tags: #requisitos-funcionais #rf #especificacao #features #best-buddy

Este documento cataloga os Requisitos Funcionais do sistema **Best Buddy**, organizados por módulo de negócio prioritário para o MVP atual (Autenticação, Gestão de Animais e Ciclo de Vida), consolidando o abandono de posts e o adiamento de serviços, ONGs e denúncias para [[08 - Implementações futuras]].

---

## 🔐 Módulo 1: Autenticação, Perfil e Controle de Acesso

### `RF01` — Cadastro de Usuário
* **Descrição:** Formulário ágil e acessível de criação de conta contendo os seguintes campos na mesma ordem da interface:
  1. `nome`: Obrigatório, mínimo de 3 caracteres, texto alfanumérico sem caracteres especiais proibidos (indicado com `*` acessível para leitores de tela).
  2. `email`: Obrigatório, formato de e-mail válido. Unico no banco (indicado com `*`). Backend força a conversão em lowercase.
  3. `telefone` (ou WhatsApp): Celular com DDD (10 ou 11 dígitos numéricos), obrigatório, higienizado, único e vinculado às publicações (indicado com `*`).
  4. `senha`: Obrigatória, não permitindo senha fraca — mínimo de 8 caracteres contendo letras maiúsculas, minúsculas, pelo menos um número e pelo menos um caractere especial, com hash seguro no backend (indicado com `*`).
  5. `confirmar_senha`: Obrigatório e idêntico à senha digitada (indicado com `*`).
  6. `termos_aceitos`: Aceite obrigatório dos Termos de Uso e Política de Privacidade (LGPD).

### `RF02` — Autenticação de Usuário (Login)
* **Descrição:** Autenticação feita apartir de  email e senha.

### `RF03` — Redirecionamento de Usuários Autenticados
* **Descrição:** Usuários logados, ao tentarem acessar as rotas de autenticação, serão redirecionados para a página Home.

### `RF04` — Gestão de Perfil do Tutor ("Editar Perfil")
* **Descrição:** Interface autenticada para o usuário gerenciar suas credenciais e contato com regras de segurança estritas:
  1. **Imutabilidade do Nome:** O nome do usuário não pode ser alterado após a criação da conta, permanecendo como dado cadastral permanente na interface e na API (futura alteração mediante suporte).
  2. **Alteração de E-mail (Duplo Fator - 2FA):** A alteração de e-mail exige obrigatoriamente autenticação em duas etapas:
     - *1º Fator:* Informação da senha atual do usuário e formato válido do novo e-mail.
     - *2º Fator:* Envio de token/código de confirmação ao novo e-mail solicitado e validação obrigatória do token. O e-mail só é atualizado no sistema após a confirmação do token.
  3. **Alteração de Telefone (Duplo Fator - 2FA):** A alteração do número de telefone celular/WhatsApp exige obrigatoriamente autenticação em duas etapas:
     - *1º Fator:* Solicitação pelo usuário autenticado informando o novo número de celular com DDD válido.
     - *2º Fator:* Envio de código OTP de verificação via WhatsApp e validação obrigatória do código recebido. O novo telefone só é salvo e ativado no cadastro após a validação do código.
  4. **Alteração de Senha:** Exige confirmação da senha atual para autorizar a definição e hash da nova senha forte (mínimo de 8 caracteres contendo letras maiúsculas, minúsculas, número e caractere especial).

---

## 🐾 Módulo 2: Animais para Adoção (Tabela Unificada)

> [!IMPORTANT]
> **Tabela Unificada:** Os serviços de "Adoção" e "Animal Perdido" compartilham a mesma tabela `Animal` (`animais_animal`), utilizando o discriminador `tipo_servico` (`ADOCAO` ou `PERDIDO`).

### `RF05` — Vitrine Pública de Animais
* **Descrição:** Listagem pública de animais cadastrados com filtro 'Buscar por' (Adoção ou Perdido) e status `Disponível` ou `Perdido`, exibindo card com foto, nome (opcional), cidade, estado, sexo, porte/idade aproximada e botão direto para o WhatsApp do tutor.

### `RF06` — Filtros de Busca na Vitrine
* **Descrição:** Filtros combinados de pesquisa por:
  - **Serviço:** Filtro "Buscar por" (Todos os serviços, Adoção, Animais Perdidos).
  - **Localização:** Estado (UF) e Cidade (select / busca padronizada).
  - **Tempo de postagem:** Mais recentes, última semana, último mês.
  - **Tipo de animal:** Cachorro, Gato, Outro.

### `RF07` — Cadastro de Pet para Adoção
* **Descrição:** Formulário estruturado em etapas (abas) para o usuário autenticado anunciar um animal para adoção (`tipo_servico='ADOCAO'`), organizado na mesma ordem dos campos da interface:
  - **Pré-requisito:** Usuário deve estar autenticado.
  - **Etapa 1 — Sobre o Pet:**
    - `tipo_servico`: Obrigatório, finalidade do anúncio (`ADOCAO` ou `PERDIDO`).
    - `nome`: Obrigatório, nome do animal (texto).
    - `tipo_animal`: Obrigatório, categoria do pet (`CACHORRO`, `GATO`, `OUTRO`).
    - `sexo`: Obrigatório (`M` para Macho, `F` para Fêmea, `I` para Indeterminado).
    - `raca`: Opcional, raça do pet (texto).
    - `idade_aproximada`: Opcional (`Filhote`, `Adulto`, `Idoso`).
    - `descricao`: Obrigatório, temperamento e características (máx. 255 caracteres).
  - **Etapa 2 — Local & Contato:**
    - `estado`: Obrigatório, Estado / UF (select com lista oficial do IBGE).
    - `cidade`: Obrigatório, Cidade (com autocompletar baseado na UF).
    - `telefone_contato`: Obrigatório, telefone/WhatsApp de contato (vinculado e carregado automaticamente do perfil do tutor autenticado).
  - **Etapa 3 — Saúde & Foto:**
    - `castrado`: Opcional (`Sim`, `Não`, `Não sei`).
    - `medicamento`: Opcional, uso contínuo de medicamentos (`Sim`, `Não`, `Não sei`).
    - `imagem`: Obrigatório, foto principal do pet (anexo em formato JPEG, PNG ou WebP de até 15 MB, validada por IA e otimizada automaticamente).

### `RF08` — Vínculo Automático de Propriedade e Contato do Tutor
* **Descrição:** Todo animal cadastrado é associado automaticamente à chave estrangeira `tutor_id` do anunciante logado e herda diretamente os dados e o telefone de contato da conta do tutor (`tutor.telefone`), sem inserção manual de informações de contato durante o cadastro do animal.

### `RF09` — Cota de 5 Animais Ativos
* **Descrição:** Cada usuário pode manter ativo simultaneamente no máximo **5 registros de animais** (soma de adoção `Disponível` + perdidos `Perdido`). A tentativa de cadastrar o 6º registro ativo é bloqueada pelo backend com mensagem explicativa.

### `RF10` — Edição e Conclusão pelo Tutor
* **Descrição:** O tutor tem permissão exclusiva para editar as informações do seu anúncio ou alterar o status para `Adotado`, encerrando a exibição pública.

### `RF11` — Contato Direto via WhatsApp
* **Descrição:** Interessados entram em contato diretamente com o tutor através do botão de WhatsApp, abrindo conversa direta (`https://wa.me/55...`) utilizando o telefone vinculado automaticamente à conta do tutor anunciante.

---

## 🔍 Módulo 3: Animais Perdidos (Desaparecidos)

### `RF12` — Mural de Animais Perdidos
* **Descrição:** Mural público exibindo animais com `tipo_servico='PERDIDO'` e status `Perdido`, com foto, nome, cidade, estado, último local visto/ponto de referência e botão de contato com o tutor via WhatsApp.

### `RF13` — Filtros em Animais Perdidos
* **Descrição:** Filtros de pesquisa por Estado/Cidade, tempo de postagem e tipo de animal no mural de desaparecidos.

### `RF14` — Formulário de Registro de Animal Perdido
* **Descrição:** Formulário estruturado para usuário autenticado registrar um pet perdido (`tipo_servico='PERDIDO'`):
  - **Campos Obrigatórios:** Nome do animal, foto do animal, tipo de animal, cidade, estado, último local visto (ponto de referência) e informações extras/descrição (máx. 255 caracteres). O telefone de contato é herdado automaticamente do perfil do tutor autenticado (sem digitação manual).
  - **Campos Opcionais:** Raça, sexo (`M`, `F`, `I`), idade aproximada (`Filhote`, `Adulto`, `Idoso`), medicação (`Sim`, `Não`, `Não sei`) e castrado (`Sim`, `Não`, `Não sei`).

### `RF15` — Resolução pelo Tutor (Encontrado)
* **Descrição:** O tutor pode marcar o anúncio como "Encontrado" a qualquer momento, removendo o animal da listagem de desaparecidos.

---

## ⏳ Módulo 4: Rotina Automática de Expiração (90 + 30 dias)

### `RF16` — Inativação Automática aos 90 Dias
* **Descrição:** Anúncios de animais para adoção com status `Disponível` que completarem 90 dias sem conclusão têm o status alterado automaticamente para `Inativo`.

### `RF17` — Janela de Reativação (30 dias) e Expurgo aos 120 Dias
* **Descrição:** 
  - Durante 30 dias após a inativação (do 91º ao 120º dia), o tutor pode reativar o anúncio pelo painel por mais um ciclo de 90 dias.
  - Registros que permanecerem inativos por mais de 30 dias (120 dias no total) são permanentemente excluídos do banco de dados por comando automatizado.

---

## 🔗 Próximas Notas Relacionadas
- [[04 - Regras de Negócio]] — Diretrizes e validações mandatórias do sistema.
- [[01 - Atores e Matriz de Permissões]] — Perfis e privilégios de acesso.
- [[05 - Modelagem de Dados e Relacionamentos]] — Diagrama ERD e dicionário de dados.
- [[08 - Implementações futuras]] — Backlog de funcionalidades postergadas (Twilio, ONGs, Serviços, Denúncias).
