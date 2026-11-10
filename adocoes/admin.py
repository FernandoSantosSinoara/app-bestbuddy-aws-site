from django.contrib import admin
from .models import Adocao

@admin.register(Adocao)
class AdocaoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'animal',
        'nome_adotante',
        'email_adotante',
        'telefone_adotante',
        'status',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = ('nome_adotante', 'email_adotante', 'animal__nome')
    ordering = ('-created_at',)

