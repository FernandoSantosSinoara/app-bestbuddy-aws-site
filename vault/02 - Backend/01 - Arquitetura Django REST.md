# ⚙️ Backend — Arquitetura Django REST
tags: #backend #django #drf #simplejwt #python

## 1. Visão Geral do Backend

O backend do Best Buddy é uma aplicação web construída sobre:
- **Django 6.0.6**
- **Django REST Framework (DRF) 3.16.0**
- **SimpleJWT 5.5.0** (Tokens JWT)
- **django-cors-headers 4.7.0**

A estrutura do projeto no repositório `Best_Buddy` é:

```
Best_Buddy/
├── manage.py
├── requirements.txt
├── db.sqlite3                  # Banco de dados local atual
├── config/                     # Pacote de configuração do Django
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── usuarios/                   # App de autenticação e perfis (PF/PJ)
├── animais/                    # App de cadastro e listagem de animais
├── adocoes/                    # App de intenções e processos de adoção
├── frontend/                   # (Pasta vazia reservada no repo do back)
└── vault/                      # Cofre de documentação do Obsidian
```

---

## 2. Configurações Críticas (`config/settings.py`)

### Autenticação JWT
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
```

### Modelo de Usuário Customizado
```python
AUTH_USER_MODEL = "usuarios.Usuario"
```

### CORS (Cross-Origin Resource Sharing)
O frontend precisa consumir a API de uma origem diferente (`localhost:5500`):
```python
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]
```

### ⚠️ Anomalia Identificada no `settings.py` (Middlewares Duplicados)
No arquivo `config/settings.py` atual, linhas 59 a 64 repetem middlewares já presentes:
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',

    "corsheaders.middleware.CorsMiddleware",           # <-- Deve ficar logo no topo!
    "django.middleware.security.SecurityMiddleware",   # DUPLICADO
    "django.contrib.sessions.middleware.SessionMiddleware", # DUPLICADO
    "django.middleware.common.CommonMiddleware",       # DUPLICADO

    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```
> [!WARNING]
> Ter middlewares duplicados causa overhead desnecessário e pode disparar comportamentos estranhos em headers de resposta ou sessões. O `CorsMiddleware` deve ficar posicionado antes de qualquer middleware que gere resposta (como `CommonMiddleware`).

---

## 3. Arquivos de Mídia e Imagens (Faltando)

Para suportar upload de fotos reais dos animais (`Animal.imagem`), é necessário adicionar ao `config/settings.py`:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```
E no `config/urls.py`:
```python
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

Veja também:
- [[02 - App Usuários e Autenticação]]
- [[03 - App Animais]]
- [[04 - App Adoções]]
- [[05 - App Comunidade (Planejamento)]]
