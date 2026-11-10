from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import UsuarioManager

class  Endereco(models.Model):
     
     endereco = models.CharField(max_length=200, verbose_name="Endereço")
     cep = models.CharField(max_length=9, verbose_name="CEP")
     rua = models.CharField(max_length=100, verbose_name="Rua")
     numero = models.CharField(max_length=10, verbose_name="Número")
     bairro = models.CharField(max_length=100, verbose_name="Bairro")
     cidade = models.CharField(max_length=100, verbose_name="Cidade")
     estado = models.CharField(max_length=100, verbose_name="Estado")

     created_at = models.DateTimeField(auto_now_add=True)
     updated_at = models.DateTimeField(auto_now=True)


    
class Usuario(AbstractUser):
    username = None
    objects = UsuarioManager()
    class TipoUsuario(models.TextChoices):
        PESSOA_FISICA = "PF", "Pessoa Física"
        PESSOA_JURIDICA = "PJ", "Pessoa Jurídica"

    tipo = models.CharField(
        max_length=2,
        choices=TipoUsuario.choices,
        default=TipoUsuario.PESSOA_FISICA,
        null=False,
        blank=False
    )

    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name="Telefone / WhatsApp")
    telefone_validado = models.BooleanField(default=False, verbose_name="WhatsApp Validado")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    termos_aceitos_em = models.DateTimeField(
        auto_now_add=True,
        null=True,
        blank=True,
        verbose_name="Data de Aceite dos Termos e Privacidade"
    )
    versao_termos = models.CharField(
        max_length=10,
        default="1.0",
        verbose_name="Versão dos Termos Aceitos"
    )

    

    def __str__(self):
        return self.email

class PessoaFisica(models.Model):
    usuario = models.OneToOneField(
        "usuarios.Usuario",
        on_delete=models.CASCADE,
        related_name="perfil_pf"
    )

    nome = models.CharField(max_length=100)
    telefone = models.CharField(max_length=15, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nome
    
class PessoaJuridica(models.Model):
    usuario = models.OneToOneField(
        "usuarios.Usuario",
        on_delete=models.CASCADE,
        related_name="perfil_pj"
    )

    cnpj = models.CharField(max_length=14, unique=True)
    razao_social = models.CharField(max_length=100)
    nome_fantasia = models.CharField(max_length=100, blank=True)
    cnae_principal = models.CharField(max_length=50, blank=True)
    situacao = models.CharField(max_length=50, blank=True)
    telefone = models.CharField(max_length=15, blank=True)

    # endereço opcional só PJ
    endereco = models.OneToOneField(
        "usuarios.Endereco",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.razao_social