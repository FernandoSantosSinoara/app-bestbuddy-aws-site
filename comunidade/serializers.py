from rest_framework import serializers
from .models import Noticia


class NoticiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Noticia
        fields = ['id', 'titulo', 'resumo', 'conteudo', 'imagem', 'created_at']
        read_only_fields = ['id', 'created_at']
