# 🐳 Docker — Configuração e Execução de Containers
tags: #docker #containers #devops #mysql #nginx #compose

Este documento explica como executar o ecossistema completo do **Best Buddy** utilizando Docker e Docker Compose, com backend Django, frontend Nginx e banco de dados MySQL 8.0 automatizado.

---

## 1. Visão Geral da Arquitetura em Containers

```mermaid
graph TD
    Client["Navegador (Usuário)"]

    subgraph Docker Network ("best_buddy_default")
        Front["Frontend (Nginx) :5500 -> :80"]
        Back["Backend Django (Python 3.12) :8000"]
        DB[("MySQL 8.0 Server :3306")]
        MediaVol[("Volume: media_data")]
        SQLVol[("Volume: mysql_data")]

        Front --> Back
        Back --> DB
        Back --> MediaVol
        DB --> SQLVol
    end

    Client -->|http://localhost:5500| Front
    Client -->|http://localhost:8000| Back
```

---

## 2. Componentes Criados

1. **`Best_Buddy/Dockerfile`**:
   - Imagem base `python:3.12-slim`.
   - Instala compiladores e `default-libmysqlclient-dev` para suporte nativo ao MySQL.
   - Script de entrada `entrypoint.sh` automatizado.
2. **`Best_Buddy/entrypoint.sh`**:
   - Aguarda o MySQL estar pronto e aceitando conexões.
   - Executa automaticamente `python manage.py migrate --noinput`.
   - Executa o seed de dados se `RUN_SEED=True` (`python seed_data.py`).
   - Inicia o servidor Django.
3. **`Best_Buddy/frontend/Dockerfile` & `nginx.conf`**:
   - Imagem base `nginx:alpine`.
   - Serve as páginas estáticas na porta 80 (mapeada para 5500 no host).
   - Inclui proxy reverso para `/api/` e `/media/`.
4. **`Best_Buddy/docker-compose.yml`**:
   - Orquestra os 3 serviços (`db`, `backend`, `frontend`) utilizando **caminhos relativos portáveis** (`.` para o backend e `./frontend` para o frontend).
   - Volumes persistentes nomeados para MySQL e arquivos de mídia.

---

## 3. Comandos de Uso

### Subir todo o ambiente (com build, migrações e seed automáticos):
```powershell
docker compose up --build
```
> [!TIP]
> Ao rodar `docker compose up`, o container do MySQL é inicializado, o backend aguarda a inicialização do banco, roda as migrações automaticamente, popula os dados iniciais (seed) e o frontend é servido imediatamente na porta 5500.

### Rodar em segundo plano (detached mode):
```powershell
docker compose up -d
```

### Visualizar logs do backend ou banco:
```powershell
docker compose logs -f backend
docker compose logs -f db
```

### Parar os containers mantendo os dados persistidos:
```powershell
docker compose down
```

### Resetar completamente o banco de dados (destruir volumes):
```powershell
docker compose down -v
```

---

## 4. Endereços Locais

- **Frontend**: `http://localhost:5500`
- **Backend API**: `http://localhost:8000/api/`
- **Django Admin**: `http://localhost:8000/admin/`
- **Banco MySQL (externo para DBeaver/Workbench)**: `localhost:3306`
  - Usuário: `bestbuddy_user`
  - Senha: `bestbuddy_pass`
  - Database: `bestbuddy_db`
