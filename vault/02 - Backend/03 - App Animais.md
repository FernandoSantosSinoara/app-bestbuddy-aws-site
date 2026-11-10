# 🐶 Backend — App Animais
tags: #backend #animais #models #serializers #ibge #tabela-unificada

## 1. Modelagem Unificada (`animais/models.py`)

A tabela `animais_animal` centraliza tanto os animais disponíveis para **adoção** quanto os animais **perdidos/desaparecidos**, diferenciados pelo discriminador `tipo_servico`:

```python
class Animal(models.Model):
    class TipoServico(models.TextChoices):
        ADOCAO = 'ADOCAO', 'Adoção'
        PERDIDO = 'PERDIDO', 'Animal Perdido'

    class TipoAnimal(models.TextChoices):
        CACHORRO = 'CACHORRO', 'Cachorro'
        GATO = 'GATO', 'Gato'
        OUTRO = 'OUTRO', 'Outro'

    class SexoAnimal(models.TextChoices):
        MACHO = 'M', 'Macho'
        FEMEA = 'F', 'Fêmea'
        INDETERMINADO = 'I', 'Indeterminado'

    class IdadeAproximada(models.TextChoices):
        FILHOTE = 'Filhote', 'Filhote'
        ADULTO = 'Adulto', 'Adulto'
        IDOSO = 'Idoso', 'Idoso'

    class StatusAnimal(models.TextChoices):
        DISPONIVEL = 'DISPONIVEL', 'Disponível'
        ADOTADO = 'ADOTADO', 'Adotado'
        PERDIDO = 'PERDIDO', 'Perdido'
        ENCONTRADO = 'ENCONTRADO', 'Encontrado'
        INATIVO = 'INATIVO', 'Inativo'

    class Estado(models.TextChoices):
        AC = 'AC', 'Acre'
        AL = 'AL', 'Alagoas'
        AP = 'AP', 'Amapá'
        AM = 'AM', 'Amazonas'
        BA = 'BA', 'Bahia'
        CE = 'CE', 'Ceará'
        DF = 'DF', 'Distrito Federal'
        ES = 'ES', 'Espírito Santo'
        GO = 'GO', 'Goiás'
        MA = 'MA', 'Maranhão'
        MT = 'MT', 'Mato Grosso'
        MS = 'MS', 'Mato Grosso do Sul'
        MG = 'MG', 'Minas Gerais'
        PA = 'PA', 'Pará'
        PB = 'PB', 'Paraíba'
        PR = 'PR', 'Paraná'
        PE = 'PE', 'Pernambuco'
        PI = 'PI', 'Piauí'
        RJ = 'RJ', 'Rio de Janeiro'
        RN = 'RN', 'Rio Grande do Norte'
        RS = 'RS', 'Rio Grande do Sul'
        RO = 'RO', 'Rondônia'
        RR = 'RR', 'Roraima'
        SC = 'SC', 'Santa Catarina'
        SP = 'SP', 'São Paulo'
        SE = 'SE', 'Sergipe'
        TO = 'TO', 'Tocantins'

    tutor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='animais', null=True, blank=True)
    tipo_servico = models.CharField(max_length=10, choices=TipoServico.choices, default=TipoServico.ADOCAO)
    tipo_animal = models.CharField(max_length=15, choices=TipoAnimal.choices, default=TipoAnimal.CACHORRO)
    nome = models.CharField(max_length=50, null=True, blank=True)
    
    # Integração Geográfica
    estado = models.CharField(max_length=2, choices=Estado.choices, default=Estado.SP)
    cidade = models.CharField(max_length=100, default='')
    
    # Contato Obrigatório
    telefone_contato = models.CharField(max_length=20, default='', verbose_name="Telefone de contato do tutor")

    descricao = models.CharField(max_length=255, blank=True, null=True)
    imagem = models.ImageField(
        upload_to='animais/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp']), validar_tamanho_imagem],
        help_text="Foto do animal (JPEG/PNG/WebP até 15 MB)"
    )
    status = models.CharField(max_length=15, choices=StatusAnimal.choices, default=StatusAnimal.DISPONIVEL)

    # Campos específicos de Adoção
    raca = models.CharField(max_length=50, null=True, blank=True)
    sexo = models.CharField(max_length=1, choices=SexoAnimal.choices, null=True, blank=True)
    idade_aproximada = models.CharField(max_length=10, choices=IdadeAproximada.choices, null=True, blank=True)
    medicamento = models.CharField(max_length=10, null=True, blank=True)
    castrado = models.CharField(max_length=50, null=True, blank=True, help_text="Status de castração (Sim, Não, Em andamento)")

    # Campos específicos de Animal Perdido
    local = models.CharField(max_length=200, blank=True, null=True)

    # Ciclo de vida
    inativado_em = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## 2. Serializer e Regras de Negócio (`animais/serializers.py`)

1. **Campos Expostos**:
   `id`, `tutor_id`, `tutor_email`, `tutor_nome`, `contato` (read-only), `tipo_servico`, `tipo_animal`, `nome`, `estado`, `cidade`, `telefone_contato`, `descricao`, `imagem`, `status`, `raca`, `sexo`, `idade_aproximada`, `medicamento`, `castrado`, `local`, `inativado_em`, `created_at`, `updated_at`.
2. **Upload de Imagem & Validações**:
   Validação de extensão (`.jpg`, `.jpeg`, `.png`, `.webp`) e tamanho máximo de 15 MB via `validate_imagem` e validators do model. O ViewSet suporta parsers `MultiPartParser`, `FormParser` e `JSONParser`. Possui Fast-Path inteligente para WebP $\le$ 1 MB.
3. **Contato Obrigatório**:
   O serializer exige que todo pet anunciado contenha um `telefone_contato`. Caso o payload não o envie diretamente, ele herda automaticamente o `telefone` validado do tutor logado. Se nenhum dos dois existir, retorna o erro:
   `"É necessário um número de contato para cadastrar o animal."`.
4. **Cota de Anúncios Ativos (RF14)**:
   Usuários comuns (Pessoa Física) podem manter no máximo 5 anúncios ativos simultaneamente (`status__in=['DISPONIVEL', 'PERDIDO']`). O 6º anúncio é bloqueado com status HTTP 400. Usuários do tipo `ONG` e superusuários não possuem limite.

---

## 3. Endpoints e Filtros (`animais/views.py`)

- **`GET /api/animais/`** (Público - `AllowAny`):
  Filtros suportados via Query String:
  - `?tipo_servico=ADOCAO` ou `?tipo_servico=PERDIDO`
  - `?estado=SP`
  - `?cidade=Campinas`
  - `?tipo_animal=CACHORRO`
  - `?status=DISPONIVEL`
  - `?tutor_id=1` (para listar anúncios do usuário logado)
- **`POST /api/animais/`** (Autenticado - `IsAuthenticated`):
  Criação de novos anúncios com atribuição automática do `tutor=request.user`.
- **`PATCH /api/animais/{id}/`** (Autenticado):
  Permite ao tutor atualizar o status (ex: marcar como `ADOTADO` ou `ENCONTRADO`).
- **`DELETE /api/animais/{id}/`** (Autenticado):
  Exclusão do anúncio. Usuários que não sejam o tutor são bloqueados com HTTP 403 (*PermissionDenied*).
