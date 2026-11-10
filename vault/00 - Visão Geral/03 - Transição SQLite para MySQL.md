# 🗄️ Estratégia de Banco de Dados: SQLite para MySQL
tags: #database #sqlite #mysql #migracao #roadmap

## 1. Situação Atual: SQLite (`db.sqlite3`)

Atualmente o projeto utiliza o banco de dados embutido **SQLite 3**, configurado como padrão no Django:

```python
# config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Por que SQLite é bom agora?
- **Zero setup**: Não precisa instalar serviço externo de banco (MySQL Server / MariaDB).
- **Portabilidade**: O arquivo `db.sqlite3` vive dentro do projeto e pode ser facilmente resetado ou compartilhado entre desenvolvedores.
- **Rápido para prototipagem local**: Ideal para colocar o frontend e backend integrados de imediato.

### Limitações do SQLite para Produção:
1. **Concorrência limitada**: Bloqueia o arquivo inteiro em operações de escrita (lock a nível de arquivo).
2. **Tipagem dinâmica permissiva**: SQLite não impõe restrições estritas de tamanho de `VARCHAR` ou tipos de datas da mesma forma que o MySQL.
3. **Escalabilidade**: Inviável para múltiplos acessos simultâneos de usuários, ONGs e adoções em ambiente cloud/produção.

---

## 2. Diagnóstico das Anomalias Atuais no SQLite

Durante a auditoria no `db.sqlite3`, foi identificada a seguinte discrepância:
- O banco possui a tabela `animais_animais`.
- O código atual em `animais/models.py` define `class Animal(models.Model)` (singular).
- Ao realizar queries no Django (`Animal.objects.all()`), o ORM busca a tabela `animais_animal` e dispara:
  `sqlite3.OperationalError: no such table: animais_animal`
- **Ação necessária antes de qualquer migração**: Normalizar as migrações no SQLite local para garantir que todos os modelos estejam consistentes e com testes verdes.

---

## 3. Plano de Transição para MySQL

### Fase 1: Preparação de Dependências e Variáveis de Ambiente
O backend precisará de um driver de conexão com o MySQL. No ecossistema Python/Django, as duas principais opções são:

1. **`mysqlclient`** (Recomendado oficialmente pelo Django — baseado em C, alta performance):
   ```bash
   pip install mysqlclient
   ```
2. **`PyMySQL`** (Driver 100% Python — mais fácil de instalar no Windows sem compilador C):
   ```bash
   pip install pymysql
   ```
   *(No `config/__init__.py`, caso use PyMySQL, adiciona-se `import pymysql; pymysql.install_as_MySQLdb()`)*.

Recomenda-se também instalar `python-dotenv` para gerenciar credenciais fora do código versionado:
```bash
pip install python-dotenv
```

---

### Fase 2: Configuração Dinâmica em `config/settings.py`

Substituir o bloco estático por uma configuração orientada a variáveis de ambiente:

```python
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

USE_MYSQL = os.getenv("USE_MYSQL", "False").lower() in ("true", "1")

if USE_MYSQL:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'bestbuddy'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            }
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
```

Exemplo de arquivo `.env` para o time:
```ini
USE_MYSQL=True
DB_NAME=bestbuddy_db
DB_USER=bestbuddy_user
DB_PASSWORD=sua_senha_segura
DB_HOST=127.0.0.1
DB_PORT=3306
```

---

### Fase 3: Criação do Banco MySQL com Charset Adequado
No servidor MySQL (ou container Docker):

```sql
CREATE DATABASE bestbuddy_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```
> [!NOTE]
> O charset `utf8mb4` é essencial para suportar caracteres especiais em português e emojis (ex.: 🐾 nos textos e posts de comunidade).

---

### Fase 4: Migração dos Dados Existentes (SQLite -> MySQL)

Se houver dados no SQLite que precisam ser preservados:

1. **Exportar dados do SQLite para JSON**:
   ```bash
   python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 4 > dump_sqlite.json
   ```
2. **Ativar o MySQL no `.env` (`USE_MYSQL=True`)**.
3. **Criar a estrutura das tabelas no MySQL**:
   ```bash
   python manage.py migrate
   ```
4. **Importar os dados para o MySQL**:
   ```bash
   python manage.py loaddata dump_sqlite.json
   ```

---

## 4. Checklist da Transição

- [ ] 1. Corrigir tabela e migrations locais no SQLite (`animais_animal`, `adocoes`, `usuarios`).
- [ ] 2. Criar app `comunidade` e rodar migrações no SQLite primeiro.
- [ ] 3. Adicionar `mysqlclient` (ou `pymysql`) e `python-dotenv` ao `requirements.txt`.
- [ ] 4. Atualizar `config/settings.py` com o switch condicional de banco.
- [ ] 5. Criar script / container Docker com MySQL 8.0 para os desenvolvedores.
- [ ] 6. Rodar `migrate` no MySQL e validar relacionamentos e chaves estrangeiras.
- [ ] 7. Validar integridade dos endpoints REST conectados ao MySQL.

Veja também:
- [[02 - Diagnóstico dos Bugs Atuais]]
- [[01 - Checklist de Correções Imediatas]]
