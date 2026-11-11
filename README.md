# 🐾 Best Buddy — Plataforma de Adoção e Proteção Animal

Plataforma comunitária web voltada para a **proteção animal**, **adoção responsável** e **localização de pets perdidos**. O ecossistema conecta adotantes, ONGs/protetores independentes e a comunidade local em um ambiente integrado.

---

## 🏗️ Arquitetura do Sistema

O projeto é estruturado em uma arquitetura desacoplada e conteinerizada:

- **Frontend (`/frontend`)**: Interface web moderna e responsiva desenvolvida em **HTML5**, **Vanilla JavaScript (ES6+)** e **Tailwind CSS v3**. Servida via **Nginx** na porta `5500`. Possui camada de Mocks para desenvolvimento offline e cliente HTTP configurado para se conectar à API Django real.
- **Backend (Raiz)**: API REST desenvolvida em **Python 3.12** com **Django 6.0** e **Django REST Framework (DRF)**, com autenticação JWT (SimpleJWT). Roda na porta `8000`.
- **Banco de Dados**: Suporte dual configurável via variável de ambiente:
  - **SQLite** (`db.sqlite3`): Pronto para testes rápidos e desenvolvimento local.
  - **MySQL 8.0**: Executado via container Docker na porta `3307` (mapeada para `3306` internamente).
- **Otimização de Mídia em Dupla Camada (Performance & LGPD)**: Fotos de pets de até **50 MB** são redimensionadas no cliente via **HTML5 Canvas API** para **WebP (~150 KB)** antes do envio HTTP (economia de até 98% de banda e purga de dados EXIF/GPS para proteção de privacidade), com validação inteligente e Fast-Path com **Pillow** no backend Django.

---

## 🐳 Como Executar com Docker (Recomendado)

O projeto é orquestrado via Docker Compose, permitindo subir todo o ecossistema (Banco de Dados + Backend Django + Frontend Nginx) com um único comando:

```powershell
docker compose up --build
```

### Endereços de Acesso:
- **Frontend**: [http://localhost:5500](http://localhost:5500)
- **Backend API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Painel Administrativo Django**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- **Banco de Dados MySQL**: `localhost:3307` (Usuário: `bestbuddy_user`, Senha: `bestbuddy_pass`)

> [!NOTE]
> O container do Nginx do frontend faz proxy reverso automático das rotas `/api/` e `/media/` para o container do backend Django.

---

## ☁️ Deploy no EKS

Os manifests Kubernetes estão em `k8s/`. Eles executam o frontend estático em Nginx no NodePort `30080` e a API Django na porta `8000`/NodePort `30081`. O Nginx atende a página inicial em `/`, encaminha `/api/` para o Service `pessoas-service` e o ALB verifica o frontend em `/`.

O workflow `.github/workflows/deploy.yml` constrói e envia as imagens do backend e do frontend para o ECR, aplica os manifests e aguarda o rollout dos dois Deployments. Somente push ou execução manual na branch `main` faz deploy; pull requests e pushes em `develop` executam apenas os checks.

Configure estes GitHub Actions repository secrets:

- `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`, com acesso ao ECR, EKS, RDS e Secrets Manager;
- `DJANGO_SECRET_KEY`, usada como `SECRET_KEY` do Django.

O runner também precisa de permissão IAM para atualizar o cluster EKS e aplicar os recursos Kubernetes. A role de execução do Terraform deve ser aplicada com o `app_health_check_path` definido como `/`, para que a configuração persistente do ALB corresponda ao frontend.

Para fazer deploy, envie as alterações para `main` ou execute manualmente o workflow na branch `main`. Depois que o rollout concluir, abra a URL do ALB na porta 80, sem sufixo de porta:

```text
http://<alb-dns-name>/
```

O backend continua disponível diretamente pela porta `8081`. O frontend usa o caminho relativo `/api/` e o Nginx faz proxy para a API no cluster, sem exigir configuração de CORS entre frontend e API.

Para aplicar os manifests manualmente, primeiro publique as imagens no ECR e crie no cluster o Secret `bestbuddy-api-secrets` com `SECRET_KEY`, `DB_HOST`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`. Use os dados do RDS; não grave esses valores nos manifests nem no repositório. Então execute:

   ```powershell
   kubectl apply -f k8s/
   kubectl get pods,services,hpa
   ```

O deploy espera que o RDS aceite conexões a partir dos nós EKS e que o cluster tenha métricas para o HPA.

O workflow `.github/workflows/deploy.yml` executa os checks e testes Django em pushes para `main`/`develop` e em pull requests para `main`; somente push ou execução manual na branch `main` também cria e publica a imagem Docker no ECR e atualiza o Deployment no EKS. Configure estes GitHub Actions repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (com acesso ao ECR, EKS, RDS e Secrets Manager) e `DJANGO_SECRET_KEY`. O runner também precisa de permissão IAM para atualizar o cluster EKS e aplicar o Secret Kubernetes.

O ALB existente atende apenas HTTP. Por isso, o manifest desativa o redirecionamento HTTPS do Django para permitir o health check e o tráfego atuais. **Não use essa configuração para tráfego público com credenciais/dados pessoais**: configure um listener HTTPS com certificado no ALB e então defina `SECURE_SSL_REDIRECT=True` no Deployment.

Em produção, o Terraform provisiona um bucket S3 privado para os uploads e associa uma role IAM de privilégio mínimo ao service account da API via EKS Pod Identity. O Django usa URLs pré-assinadas para leitura e grava os arquivos no S3; configure e aplique o Terraform antes do deploy da aplicação. O nome criado fica disponível na saída `animal_media_bucket_name` e deve corresponder a `ANIMAL_MEDIA_BUCKET` em `k8s/deployment.yaml`. Em desenvolvimento, sem `ANIMAL_MEDIA_BUCKET`, os arquivos continuam em `MEDIA_ROOT` e são servidos pelo Django quando `DEBUG=True`.

Antes de habilitar o armazenamento S3 em uma instalação que já tenha uploads locais, copie os arquivos existentes para o bucket preservando os caminhos relativos de `MEDIA_ROOT` (por exemplo, `animais/<arquivo>`). Faça primeiro um dry run e depois repita sem `--dryrun`:

```powershell
aws s3 sync .\media\ s3://bestbuddy-animal-media-188785237347-us-east-2/ --dryrun
aws s3 sync .\media\ s3://bestbuddy-animal-media-188785237347-us-east-2/
```

Caso os arquivos estejam somente no disco efêmero de um pod, faça essa cópia antes de substituir o pod; o armazenamento remoto não recupera arquivos já perdidos.

---

## 💻 Como Executar Localmente Sem Docker

### 1. Inicializar o Backend (Django)

1. Certifique-se de ter o Python 3.12+ instalado:
   ```powershell
   pip install -r requirements.txt
   ```
2. Aplique as migrações no banco SQLite local:
   ```powershell
   python manage.py migrate
   ```
3. (Opcional) Popule o banco com dados de teste:
   ```powershell
   python seed_data.py
   ```
4. Inicie o servidor da API:
   ```powershell
   python manage.py runserver 0.0.0.0:8000
   ```
   A API estará acessível em `http://localhost:8000`.

### 2. Inicializar o Frontend (Estático)

Como os estilos do Tailwind já vêm compilados em `frontend/css/tailwind.build.css`, basta servir a pasta estática:

```powershell
cd frontend
python -m http.server 5500
```
Acesse: [http://localhost:5500](http://localhost:5500)

Para editar estilos do Tailwind ou configurar o modo Mock vs Real, consulte o [frontend/README.md](file:///c:/Users/T480/Documents/GitHub/BestBuddy/Best_Buddy/frontend/README.md).

---

## 📁 Estrutura de Diretórios do Projeto

```
Best_Buddy/
├── frontend/                          # Aplicação Web (HTML5 + Vanilla JS + Tailwind + Nginx)
│   ├── index.html                     # Ponto de entrada do site
│   ├── Dockerfile                     # Container Nginx do frontend
│   ├── nginx.conf                     # Configuração do Nginx (proxy reverso /api/)
│   ├── tailwind.config.js             # Tokens de estilo do Tailwind
│   ├── package.json                   # Scripts do Tailwind CLI (build:css / watch:css)
│   ├── README.md                      # Documentação de execução do frontend
│   ├── pages/                         # Telas HTML (auth, home, animals)
│   ├── js/                            # Lógica JavaScript (serviços, mocks, componentes, utils)
│   ├── css/                           # Estilos (input.css e tailwind.build.css)
│   └── assets/                        # Imagens estáticas
├── animais/                           # App Django: Catálogo unificado de pets (adoção e perdidos) com contato direto via WhatsApp
├── config/                            # Configurações do Django (settings, urls, wsgi)
├── usuarios/                          # App Django: Autenticação JWT, perfis e validação de WhatsApp via Twilio
├── fixtures/                          # Dados de carga inicial (fixtures JSON)
├── vault/                             # Documentação técnica completa e centralizada para Obsidian
├── .github/                           # Workflows de CI/CD (GitHub Actions)
├── db.sqlite3                         # Banco de dados local SQLite
├── docker-compose.yml                 # Orquestrador Docker (db, backend, frontend)
├── Dockerfile                         # Build do container Django Backend
├── entrypoint.sh                      # Script de inicialização e espera do banco no Docker
├── manage.py                          # CLI do Django
├── requirements.txt                   # Dependências Python do Backend
├── seed_data.py                       # Script de carga inicial no banco
├── test_endpoints.py                  # Suíte de testes automatizados dos endpoints
└── LICENSE                            # Licença de uso
```

---

## 🧪 Testes Automatizados

O repositório inclui uma suíte completa de testes de integração dos endpoints da API:

```powershell
python test_endpoints.py
```
Todos os 14 cenários de teste (Autenticação JWT, Registro sem CPF, Listagem e Detalhe de Animais, Filtros IBGE, Contato Obrigatório com DDD, Validação Twilio, Recuperação de Senha por Token, Cota de 5 Pets e Gestão pelo Tutor) são validados com 100% de sucesso.

---

## 📚 Documentação Técnica no Obsidian Vault

Toda a documentação arquitetural, contratos de API, modelagem e regras de negócio estão centralizadas no **Obsidian Vault** (`vault/`):

- **Visão Geral & MOCs**: `vault/00 - Visão Geral/`
- **Frontend & Telas**: `vault/01 - Frontend/`
- **Backend & Models**: `vault/02 - Backend/`
- **Contratos de API & Endpoints**: `vault/03 - Integração e Contratos/01 - Contrato de API (Endpoints).md`
- **Regras de Negócio & Roadmap**: `vault/06 - Requisitos e Modelagem/`

Para visualizar a documentação interativa com links bidirecionais e navegação em grafo, abra a pasta `vault/` no aplicativo [Obsidian](https://obsidian.md).
