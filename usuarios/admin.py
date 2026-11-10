from django.contrib import admin
from .models import Usuario, Endereco, PessoaFisica, PessoaJuridica


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "tipo",
        "is_active",
        "is_staff",
    )

    list_filter = (
        "tipo",
        "is_active",
        "is_staff",
    )

    search_fields = (
        "email",
    )


@admin.register(PessoaFisica)
class PessoaFisicaAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "usuario",
    )

    search_fields = (
        "nome",
        "usuario__email",
    )


@admin.register(PessoaJuridica)
class PessoaJuridicaAdmin(admin.ModelAdmin):
    list_display = (
        "razao_social",
        "cnpj",
        "usuario",
    )

    list_filter = (
        "situacao",
    )

    search_fields = (
        "razao_social",
        "nome_fantasia",
        "cnpj",
        "usuario__email",
    )


@admin.register(Endereco)
class EnderecoAdmin(admin.ModelAdmin):
    list_display = (
        "cidade",
        "estado",
        "cep",
    )

    list_filter = (
        "estado",
        "cidade",
    )

    search_fields = (
        "cidade",
        "bairro",
        "cep",
    )