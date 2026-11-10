from rest_framework import serializers
from .models import Adocao
from animais.models import Animal

class AdocoesSerializer(serializers.ModelSerializer):
    animal_id = serializers.PrimaryKeyRelatedField(
        queryset=Animal.objects.all(),
        source='animal'
    )

    class Meta:
        model = Adocao
        fields = [
            'id',
            'animal_id',
            'nome_adotante',
            'email_adotante',
            'telefone_adotante',
            'ja_teve_animais',
            'ja_vacinado',
            'motivacao',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']