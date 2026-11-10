# 🔍 Status — Diagnóstico e Resolução dos Bugs Técnicos
tags: #bugs #diagnostico #rca #backend #sqlite #django #resolvido

Este documento detalha a Análise de Causa Raiz (RCA — Root Cause Analysis) dos problemas encontrados no backend e a **solução definitiva implementada** para cada um deles.

---

## 🟢 Bug 1: `sqlite3.OperationalError: no such table: animais_animal` [RESOLVIDO]

### Sintoma:
Ao tentar listar animais pelo Django ou via API (`GET /api/animais/`), a aplicação retornava erro 500 com o traceback:
`sqlite3.OperationalError: no such table: animais_animal`

### Causa Raiz:
No banco SQLite (`db.sqlite3`), a tabela física havia sido criada como `animais_animais` (no plural), decorrente de uma versão anterior onde o model se chamava `Animais`. Posteriormente, a classe foi renomeada para `Animal` em `animais/models.py`, fazendo o Django procurar `animais_animal`.

### Solução Aplicada:
A tabela física foi renomeada diretamente no SQLite:
```sql
ALTER TABLE animais_animais RENAME TO animais_animal;
```
Foram geradas e aplicadas as migrações atualizadas (`animais.0002_animal_created_at_animal_descricao_animal_imagem_and_more`). O ORM agora localiza a tabela normalmente, e o endpoint `GET /api/animais/` responde `HTTP 200 OK`.

---

## 🟢 Bug 2: Serializer de Animais sem o campo `id` [RESOLVIDO]

### Sintoma:
Ao carregar a grade de animais no frontend conectado à API real, os links de detalhe ficavam como `href="detail.html?id=undefined"`.

### Causa Raiz:
Em `animais/serializers.py`, o campo `'id'` não estava incluído na lista `fields` de `AnimaisSerializer`.

### Solução Aplicada:
O `AnimaisSerializer` foi atualizado com `'id'`, `'descricao'`, `'imagem'` e `'created_at'`:
```python
fields = [
    'id', 'nome', 'raca', 'sexo', 'idade_aproximada',
    'medicamento', 'vacinacao', 'contato', 'descricao',
    'imagem', 'created_at'
]
read_only_fields = ['id', 'created_at']
```
Além disso, a permissão do `AnimaisViewSet` foi configurada para `AllowAny` em requisições `GET`, permitindo que visitantes naveguem pelo catálogo.

---

## 🟢 Bug 3: Modelo `Adocao` Desconectado e Serializer Incompatível [RESOLVIDO]

### Sintoma:
Ao submeter o formulário de adoção (`pages/adoption/create.html`), o backend retornava erro HTTP 400 Bad Request.

### Causa Raiz:
O modelo `Adocao` continha campos duplicados do animal em vez de uma chave estrangeira para `Animal`, e não registrava os dados do candidato adotante nem as respostas do questionário de aptidão.

### Solução Aplicada:
O modelo `Adocao` foi completamente refatorado em `adocoes/models.py`:
- Chave estrangeira `animal = models.ForeignKey('animais.Animal', on_delete=models.CASCADE, related_name='adocoes')`.
- Vínculo opcional com `Usuario` (`adotante`).
- Dados do adotante: `nome_adotante`, `email_adotante`, `telefone_adotante`.
- Perguntas do questionário: `ja_teve_animais`, `ja_vacinado`, `motivacao`.
- `AdocoesSerializer` atualizado com `PrimaryKeyRelatedField` para `animal_id`.
- Migração `adocoes.0002_remove_adocao_contato_...` gerada e aplicada.

---

## 🟢 Bug 4: Ausência do `CPF` em `PessoaFisica` [RESOLVIDO]

### Sintoma:
O cadastro no frontend enviava `"cpf"`, mas o backend não persistia essa informação.

### Causa Raiz:
Uma migração anterior havia removido a coluna `cpf` do modelo `PessoaFisica`.

### Solução Aplicada:
- Campo `cpf = models.CharField(max_length=14, blank=True, null=True)` reincluído em `PessoaFisica`.
- `RegisterUsuarioSerializer` atualizado para receber e repassar o `cpf` na criação do perfil.
- Migração `usuarios.0005_pessoafisica_cpf` aplicada com sucesso.

---

## 🟢 Bug 5: Middlewares Duplicados em `settings.py` [RESOLVIDO]

### Sintoma:
Múltiplas instâncias de middlewares de segurança e sessão executando redundâncias a cada requisição.

### Causa Raiz:
Duplicação de entradas em `MIDDLEWARE` no `config/settings.py`.

### Solução Aplicada:
Lista `MIDDLEWARE` limpa e reorganizada com `corsheaders.middleware.CorsMiddleware` no topo.

---

## 🟢 Bug 6: Falta do App `comunidade` (Erro 404) [RESOLVIDO]

### Sintoma:
Chamadas para `/api/comunidade/noticias/`, `/api/comunidade/posts/` e `/api/comunidade/desaparecidos/` retornavam HTTP 404 Not Found.

### Solução Aplicada:
Criado o app `comunidade` completo:
- Modelos: `Noticia`, `Post`, `AnimalDesaparecido`.
- Serializers e Views (com suporte a `GET` e `POST`).
- Rotas expostas em `/api/comunidade/`.
- Migração `comunidade.0001_initial` aplicada.

---

Veja também:
- [[01 - Checklist de Correções Imediatas]]
- [[01 - Matriz de Funcionalidades (O que funciona)]]
- [[04 - Guia de Execução e Testes]]
