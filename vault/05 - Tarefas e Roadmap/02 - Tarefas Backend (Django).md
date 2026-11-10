# 🛠️ Roadmap — Tarefas Técnicas do Backend (Django)
tags: #backend #tarefas #codigo #drf #models #views #arquitetura-unificada #implementado #pendencias

Este documento consolida a arquitetura técnica implementada no backend Django do **Best Buddy**, detalha o código real em operação e estrutura com precisão as **tarefas pendentes que ainda precisam ser construídas no backend**.

---

## 🏛️ 1. O que Já Foi Construído e Validado no Backend

### 1.1 Configurações Centrais (`config/settings.py` e `config/urls.py`)
- `CorsMiddleware` posicionado no topo da lista `MIDDLEWARE`.
- Suporte a arquivos de mídia (`MEDIA_URL` e `MEDIA_ROOT`) com servimento estático em `DEBUG`.
- Banco de dados flexível com alternância via variável `USE_MYSQL` (SQLite em dev local ou MySQL 8.0 `utf8mb4` no Docker).
- JWT configurado com `CustomTokenObtainPairSerializer` retornando os dados do usuário logado.
- Apps ativas enxutas em `INSTALLED_APPS`: `'usuarios'`, `'animais'` (apps legadas `comunidade` e `adocoes` descontinuadas com segurança).

---

### 1.2 App `usuarios` (Autenticação, Perfil, WhatsApp e Senhas)

O app `usuarios` foi totalmente estruturado para oferecer segurança máxima e zero atrito no cadastro:

#### Modelo `Usuario` (`usuarios/models.py`)
```python
class Usuario(AbstractUser):
    username = None
    objects = UsuarioManager()
    
    class TipoUsuario(models.TextChoices):
        PESSOA_FISICA = "PF", "Pessoa Física"
        PESSOA_JURIDICA = "PJ", "Pessoa Jurídica"

    tipo = models.CharField(max_length=2, choices=TipoUsuario.choices)
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name="Telefone / WhatsApp")
    telefone_validado = models.BooleanField(default=False, verbose_name="WhatsApp Validado")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
```

#### Funcionalidades e Endpoints em Operação (`usuarios/views.py`)
1. **Cadastro Rápido (`POST /api/usuarios/register/`):** Cadastro direto de Pessoa Física com nome, email, telefone e senha, sem exigir CPF.
2. **Checagem de Telefone (`GET /api/usuarios/verificar-telefone/?telefone=...`):** Consulta em tempo real para validação client-side antes da submissão.
3. **Gestão de Perfil (`GET / PATCH /api/usuarios/perfil/`):** Atualização de nome e telefone com validação de duplicidade.
4. **Alteração de Senha (`POST /api/usuarios/alterar-senha/`):** Exige conferência da senha atual antes de gravar a nova credencial.
5. **Alteração de E-mail (`POST /api/usuarios/alterar-email/` e `/confirmar-email/`):** Gera token criptografado com `django.core.signing` (validade de 24h).
6. **Validação de WhatsApp via Twilio (`/api/usuarios/whatsapp/enviar/` e `/verificar/`):**
   - Formatação para o padrão internacional E.164 (`whatsapp:+55...`).
   - Conexão nativa com API do Twilio Verify quando configuradas credenciais no `settings`.
   - Fallback inteligente para desenvolvimento: código padrão `'123456'` para testes sem custo de API.
7. **Recuperação e Redefinição de Senha (`/api/usuarios/recuperar-senha/` e `/redefinir-senha/`):**
   - Gera token seguro assinado para o email cadastrado.
   - Permite definir nova senha mediante fornecimento do token válido.

---

### 1.3 App `animais` (Tabela Unificada, IBGE e Otimização de Imagens)

O modelo `Animal` centraliza tanto anúncios de **Adoção** quanto de **Animais Perdidos**:

#### Modelo Unificado (`animais/models.py`)
```python
class Animal(models.Model):
    class TipoServico(models.TextChoices):
        ADOCAO = 'ADOCAO', 'Adoção'
        PERDIDO = 'PERDIDO', 'Animal Perdido'

    class TipoAnimal(models.TextChoices):
        CACHORRO = 'CACHORRO', 'Cachorro'
        GATO = 'GATO', 'Gato'
        OUTRO = 'OUTRO', 'Outro'

    class StatusAnimal(models.TextChoices):
        DISPONIVEL = 'DISPONIVEL', 'Disponível'
        ADOTADO = 'ADOTADO', 'Adotado'
        PERDIDO = 'PERDIDO', 'Perdido'
        ENCONTRADO = 'ENCONTRADO', 'Encontrado'
        INATIVO = 'INATIVO', 'Inativo'

    class Estado(models.TextChoices):
        AC = 'AC', 'Acre'
        AL = 'AL', 'Alagoas'
        # ... todas as 27 UFs brasileiras ...
        SP = 'SP', 'São Paulo'

    tutor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='animais')
    tipo_servico = models.CharField(max_length=10, choices=TipoServico.choices, default=TipoServico.ADOCAO)
    tipo_animal = models.CharField(max_length=15, choices=TipoAnimal.choices, default=TipoAnimal.CACHORRO)
    nome = models.CharField(max_length=50, null=True, blank=True)
    estado = models.CharField(max_length=2, choices=Estado.choices, default=Estado.SP)
    cidade = models.CharField(max_length=100, default='')
    telefone_contato = models.CharField(max_length=20, blank=True, default='')

    @property
    def contato(self):
        if self.tutor and self.tutor.telefone:
            return self.tutor.telefone
        return self.telefone_contato or ""

    descricao = models.CharField(max_length=255, blank=True, null=True)
    imagem = models.ImageField(upload_to='animais/', blank=True, null=True)
    status = models.CharField(max_length=15, choices=StatusAnimal.choices, default=StatusAnimal.DISPONIVEL)
    
    # Campos complementares
    raca = models.CharField("Raça", max_length=50, null=True, blank=True)
    sexo = models.CharField(max_length=1, choices=SexoAnimal.choices, null=True, blank=True)
    idade_aproximada = models.CharField(max_length=10, choices=IdadeAproximada.choices, null=True, blank=True)
    medicamento = models.CharField(max_length=10, choices=Medicamento.choices, null=True, blank=True)
    castrado = models.CharField(max_length=10, choices=Castrado.choices, null=True, blank=True)
    local = models.CharField(max_length=200, blank=True, null=True)

    inativado_em = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.imagem and hasattr(self.imagem, 'file'):
            if isinstance(self.imagem.file, UploadedFile):
                self.imagem = otimizar_imagem_animal(self.imagem)
        super().save(*args, **kwargs)
```

#### Regras de Negócio Implementadas na View (`animais/views.py`)
- **Filtros Flexíveis:** Suporte a busca por `?tipo_servico=ADOCAO|PERDIDO`, `?estado=UF`, `?cidade=Nome` e `?tipo_animal=CACHORRO|GATO|OUTRO`.
- **Enforcement de Cota Anti-Spam:** Valida se o tutor já possui $\ge$ 5 animais ativos com status `DISPONIVEL` ou `PERDIDO`.
- **Exigência de WhatsApp:** Bloqueia a criação se `tutor.telefone_validado == False`.
- **Herança Automática de Contato:** O número de telefone validado do tutor é injetado automaticamente no anúncio.
- **Segurança na Modificação/Exclusão:** Apenas o próprio tutor anunciante pode alterar o status ou deletar o anúncio (terceiros recebem `403 Forbidden`).

---

## ⏳ 2. Tarefas Técnicas Pendentes no Backend (Roadmap Ativo)

As tarefas a seguir representam o que **ainda deve ser implementado no backend** para fechar o ciclo completo de produção:

### 📌 Tarefa B1: Comando de Expiração Automática de Anúncios (`RF16` e `RF17`)
* **Objetivo:** Garantir a limpeza da vitrine de pets, inativando anúncios abandonados após 90 dias e expurgando-os após 120 dias.
* **Arquivo a criar:** `animais/management/commands/expirar_anuncios.py`
* **Lógica a implementar:**
  ```python
  from django.core.management.base import BaseCommand
  from django.utils import timezone
  from datetime import timedelta
  from animais.models import Animal

  class Command(BaseCommand):
      help = "Inativa anúncios com mais de 90 dias e exclui inativos há mais de 30 dias."

      def handle(self, *args, **options):
          agora = timezone.now()
          limite_90_dias = agora - timedelta(days=90)
          limite_120_dias = agora - timedelta(days=120)

          # 1. Inativar anúncios ativos antigos
          inativados = Animal.objects.filter(
              status__in=[Animal.StatusAnimal.DISPONIVEL, Animal.StatusAnimal.PERDIDO],
              created_at__lte=limite_90_dias
          ).update(
              status=Animal.StatusAnimal.INATIVO,
              inativado_em=agora
          )

          # 2. Excluir anúncios inativos há mais de 30 dias (120 dias no total)
          excluidos_qs = Animal.objects.filter(
              status=Animal.StatusAnimal.INATIVO,
              inativado_em__lte=agora - timedelta(days=30)
          )
          total_excluidos = excluidos_qs.count()
          # Exclui arquivos de imagem e registros
          for pet in excluidos_qs:
              if pet.imagem:
                  pet.imagem.delete(save=False)
              pet.delete()

          self.stdout.write(self.style.SUCCESS(
              f"Rotina concluída: {inativados} inativados, {total_excluidos} excluídos definitivamente."
          ))
  ```

---

### 📌 Tarefa B2: Configuração de Variáveis de Produção (E-mail e Twilio Real)
* **Objetivo:** Conectar o backend aos provedores reais de mensageria em ambiente de produção.
* **Arquivo a ajustar:** `config/settings.py` e `.env`
* **Pendência:**
  - Configurar `EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'`
  - Definir `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` e `EMAIL_USE_TLS`.
  - Configurar credenciais oficiais do Twilio Verify no `.env`:
    ```ini
    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    TWILIO_AUTH_TOKEN=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
    TWILIO_VERIFY_SERVICE_SID=VAzzzzzzzzzzzzzzzzzzzzzzzzzzzz
    ```

---

### 📌 Tarefa B3: Módulo de Denúncias no Backend (`RF24_FUT`, `RF25_FUT`, `RN11_FUT`)
* **Objetivo:** Permitir que usuários autenticados denunciem anúncios com conteúdo impróprio, fraude ou maus-tratos.
* **Modelagem sugerida (`animais/models.py`):**
  ```python
  class Denuncia(models.Model):
      class Motivo(models.TextChoices):
          MAUS_TRATOS = 'MAUS_TRATOS', 'Maus-tratos'
          FRAUDE = 'FRAUDE', 'Fraude ou Golpe'
          DADOS_FALSOS = 'DADOS_FALSOS', 'Informações Falsas'
          JA_ADOTADO = 'JA_ADOTADO', 'Animal já foi adotado / encontrado'
          SPAM = 'SPAM', 'Spam ou Conteúdo Ofensivo'
          OUTRO = 'OUTRO', 'Outro Motivo'

      animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='denuncias')
      denunciante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
      motivo = models.CharField(max_length=20, choices=Motivo.choices)
      justificativa = models.TextField()
      resolvido = models.BooleanField(default=False)
      created_at = models.DateTimeField(auto_now_add=True)
  ```
* **Endpoint:** `POST /api/animais/{id}/denunciar/` com serializer validando `motivo` e `justificativa`.

---

### 📌 Tarefa B4: Concessão de Cota Ilimitada para ONGs Homologadas (`RN04_FUT`)
* **Objetivo:** Dispensar a trava de 5 animais para contas de Pessoa Jurídica / ONG aprovadas pela administração.
* **Ajuste na View (`animais/views.py`):**
  ```python
  # Permitir criação ilimitada se for perfil PJ ou flag is_ong
  is_ong = (request.user.tipo == Usuario.TipoUsuario.PESSOA_JURIDICA)
  if not is_ong and pets_ativos >= 5:
      return Response(
          {"error": "Limite atingido. Usuários comuns podem ter no máximo 5 anúncios ativos simultâneos."},
          status=status.HTTP_400_BAD_REQUEST
      )
  ```

---

## 🔗 Próximas Notas Relacionadas
- [[00 - MOC Tarefas e Roadmap]]
- [[01 - Checklist de Correções Imediatas]]
- [[03 - Tarefas Frontend (Melhorias)]]
- [[06 - Guia de Alinhamento da Equipe e Novo Roadmap]]
- [[07 - Otimizacao de Imagens (Pillow e WebP)]]
