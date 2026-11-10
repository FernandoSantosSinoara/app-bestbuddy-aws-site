from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from .utils import otimizar_imagem_animal


def validar_tamanho_imagem(arquivo):
    limite_mb = 15
    if arquivo.size > limite_mb * 1024 * 1024:
        raise ValidationError(f"O tamanho máximo da imagem é de {limite_mb} MB.")


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

    class Medicamento(models.TextChoices):
        SIM = 'Sim', 'Sim'
        NAO = 'Não', 'Não'
        NAO_SABE = 'Não sei', 'Não sei'

    class Castrado(models.TextChoices):
        SIM = 'Sim', 'Sim'
        NAO = 'Não', 'Não'
        NAO_SABE = 'Não sei', 'Não sei'

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

    # Vínculo obrigatório com o tutor autenticado
    tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='animais',
        null=True,
        blank=True,
        verbose_name="Tutor Anunciante"
    )

    # Discriminador unificado do serviço
    tipo_servico = models.CharField(
        max_length=10,
        choices=TipoServico.choices,
        default=TipoServico.ADOCAO,
        verbose_name="Tipo de Serviço"
    )

    tipo_animal = models.CharField(
        max_length=15,
        choices=TipoAnimal.choices,
        default=TipoAnimal.CACHORRO,
        verbose_name="Tipo de Animal"
    )

    nome = models.CharField(max_length=50, null=True, blank=True, verbose_name="Nome do Pet")
    estado = models.CharField(
        max_length=2, 
        choices=Estado.choices,
        default=Estado.SP,
        verbose_name="Estado (UF)"
    )
    cidade = models.CharField(max_length=100, default='', verbose_name="Cidade")
    telefone_contato = models.CharField(
        max_length=20,
        blank=True,
        default='',
        verbose_name="Telefone de contato do tutor (cache/fallback)"
    )

    @property
    def contato(self):
        """Retorna dinamicamente o telefone atual do tutor vinculado via FK."""
        if self.tutor and self.tutor.telefone:
            return self.tutor.telefone
        return self.telefone_contato or ""
    descricao = models.CharField(max_length=255, blank=True, null=True, verbose_name="Descrição / Informações extras")
    imagem = models.ImageField(
        upload_to='animais/',
        blank=True,
        null=True,
        verbose_name="Foto do animal",
        validators=[
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp']),
            validar_tamanho_imagem
        ]
    )
    
    status = models.CharField(
        max_length=15,
        choices=StatusAnimal.choices,
        default=StatusAnimal.DISPONIVEL,
        verbose_name="Status do Anúncio"
    )

    # Campos específicos de adoção (opcionais para animais perdidos)
    raca = models.CharField("Raça", max_length=50, null=True, blank=True)
    sexo = models.CharField(max_length=1, choices=SexoAnimal.choices, null=True, blank=True)
    idade_aproximada = models.CharField(max_length=10, choices=IdadeAproximada.choices, null=True, blank=True)
    medicamento = models.CharField(max_length=10, choices=Medicamento.choices, null=True, blank=True)
    castrado = models.CharField(max_length=10, choices=Castrado.choices, null=True, blank=True)

    # Campos específicos de animal perdido (opcional para adoção)
    local = models.CharField(max_length=200, blank=True, null=True, verbose_name="Último local visto / Ponto de referência")

    # Ciclo de vida (regra 90 + 30 dias)
    inativado_em = models.DateTimeField(null=True, blank=True, verbose_name="Data de inativação")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Animal'
        verbose_name_plural = 'Animais'
        ordering = ['-created_at']

    def __str__(self):
        servico = "Adoção" if self.tipo_servico == self.TipoServico.ADOCAO else "Perdido"
        return f"[{servico}] {self.nome or 'Sem nome'} ({self.cidade})"

    def save(self, *args, **kwargs):
        # Verifica se há imagem e se ela é um arquivo recém-enviado pelo cliente
        if self.imagem:
            try:
                if getattr(self.imagem, '_file', None) is not None and isinstance(self.imagem._file, UploadedFile):
                    self.imagem = otimizar_imagem_animal(self.imagem)
            except Exception:
                pass

        super().save(*args, **kwargs)
