import re
from rest_framework import serializers
from .models import Usuario, PessoaFisica, PessoaJuridica, Endereco
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


REGRAS_SENHA_REGEX = [
    (r'[A-Z]', "A senha deve conter pelo menos uma letra maiúscula."),
    (r'[a-z]', "A senha deve conter pelo menos uma letra minúscula."),
    (r'[0-9]', "A senha deve conter pelo menos um número."),
    (r'[^A-Za-z0-9]', "A senha deve conter pelo menos um caractere especial."),
]


def validar_forca_senha(value):
    if not value or len(value) < 8:
        raise serializers.ValidationError("A senha deve ter no mínimo 8 caracteres.")
    for padrao, mensagem in REGRAS_SENHA_REGEX:
        if not re.search(padrao, value):
            raise serializers.ValidationError(mensagem)
    return value


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            "id",
            "email",
            "tipo",
            "telefone",
            "telefone_validado",
            "created_at",
            "termos_aceitos_em",
            "versao_termos",
        ]
        read_only_fields = ["id", "email", "telefone", "telefone_validado", "created_at", "termos_aceitos_em", "versao_termos"]


class PessoaFisicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PessoaFisica
        fields = [
            "nome",
            "telefone",
        ]


class PessoaJuridicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PessoaJuridica
        fields = [
            "cnpj",
            "razao_social",
            "nome_fantasia",
            "situacao",
            "cnae_principal",
            "telefone",
            "endereco",
        ]


class EnderecoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endereco
        fields = [
            "endereco",
            "cep",
            "rua",
            "numero",
            "bairro",
            "cidade",
            "estado",
        ]


class RegisterUsuarioSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    tipo = serializers.ChoiceField(choices=Usuario.TipoUsuario.choices, default="PF")
    telefone = serializers.CharField(required=True, allow_blank=False, allow_null=False)
    termos_aceitos = serializers.BooleanField(write_only=True, required=False, default=True)

    # PF
    nome = serializers.CharField(required=False, allow_blank=True)

    # PJ
    razao_social = serializers.CharField(required=False, allow_blank=True)
    cnpj = serializers.CharField(required=False, allow_blank=True)

    def validate_termos_aceitos(self, value):
        if value is False:
            raise serializers.ValidationError("É obrigatório aceitar os Termos de Uso e a Política de Privacidade para cadastrar uma conta.")
        return value

    def validate_telefone(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Informe seu número de telefone.")
        digits = re.sub(r'\D', '', str(value))
        if len(digits) not in (10, 11):
            raise serializers.ValidationError("Informe um número de telefone com DDD válido (10 ou 11 dígitos).")
        
        ddd = int(digits[:2])
        if ddd < 11 or ddd > 99:
            raise serializers.ValidationError("DDD inválido.")
        if Usuario.objects.filter(telefone=digits).exists():
            raise serializers.ValidationError("Este número de telefone já está cadastrado em outra conta.")
        return digits

    def validate_nome(self, value):
        if value is not None and value != "":
            val = value.strip()
            if len(val) < 3:
                raise serializers.ValidationError("O nome deve ter no mínimo 3 caracteres.")
            if not re.match(r'^[A-Za-zÀ-ÿ0-9\s]+$', val):
                raise serializers.ValidationError("O nome deve conter apenas caracteres alfanuméricos.")
            return val
        return value

    def validate_email(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este email já está cadastrado.")
        return value.lower()

    def validate_password(self, value):
        return validar_forca_senha(value)

    def validate(self, attrs):
        tipo = attrs.get("tipo", "PF")
        if tipo == "PF":
            nome = (attrs.get("nome") or "").strip()
            if not nome:
                raise serializers.ValidationError({"nome": "O nome é obrigatório."})
            if len(nome) < 3:
                raise serializers.ValidationError({"nome": "O nome deve ter no mínimo 3 caracteres."})
            attrs["nome"] = nome
        return attrs

    def create(self, validated_data):
        tipo = validated_data.get("tipo", "PF")
        telefone_informado = validated_data.get("telefone")
        if telefone_informado:
            telefone_informado = re.sub(r'\D', '', str(telefone_informado).strip()) or None

        user = Usuario.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            tipo=tipo,
            telefone=telefone_informado,
            telefone_validado=False
        )

        if tipo == "PF":
            PessoaFisica.objects.create(
                usuario=user,
                nome=validated_data.get("nome", ""),
                telefone=telefone_informado or ""
            )

        elif tipo == "PJ":
            PessoaJuridica.objects.create(
                usuario=user,
                razao_social=validated_data.get("razao_social", ""),
                cnpj=validated_data.get("cnpj", ""),
                telefone=telefone_informado or ""
            )

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "tipo": user.tipo,
                "telefone": user.telefone,
                "telefone_validado": user.telefone_validado,
            }
        }


class AlterarEmailSerializer(serializers.Serializer):
    novo_email = serializers.EmailField()
    senha_atual = serializers.CharField(write_only=True)

    def validate_novo_email(self, value):
        user = self.context.get("request").user if self.context.get("request") else None
        if Usuario.objects.filter(email__iexact=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError("Este email já está em uso por outro usuário.")
        return value.lower()


class ConfirmarEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


class AlterarSenhaSerializer(serializers.Serializer):
    senha_atual = serializers.CharField(write_only=True)
    nova_senha = serializers.CharField(write_only=True)
    confirmar_nova_senha = serializers.CharField(write_only=True)

    def validate_nova_senha(self, value):
        return validar_forca_senha(value)

    def validate(self, attrs):
        if attrs["nova_senha"] != attrs["confirmar_nova_senha"]:
            raise serializers.ValidationError({"confirmar_nova_senha": "As novas senhas não coincidem."})
        return attrs


class TwilioEnviarCodigoSerializer(serializers.Serializer):
    telefone = serializers.CharField(max_length=25)

    def validate_telefone(self, value):
        limpo = "".join(filter(str.isdigit, value))
        if len(limpo) < 10 or len(limpo) > 13:
            raise serializers.ValidationError("Informe um número de telefone com DDD válido (ex: 11999998888).")
        return value.strip()


class TwilioVerificarCodigoSerializer(serializers.Serializer):
    telefone = serializers.CharField(max_length=25)
    codigo = serializers.CharField(max_length=10)


class RecuperarSenhaSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()


class RedefinirSenhaSerializer(serializers.Serializer):
    token = serializers.CharField()
    nova_senha = serializers.CharField(write_only=True)
    confirmar_nova_senha = serializers.CharField(write_only=True)

    def validate_nova_senha(self, value):
        return validar_forca_senha(value)

    def validate(self, attrs):
        if attrs["nova_senha"] != attrs["confirmar_nova_senha"]:
            raise serializers.ValidationError({"confirmar_nova_senha": "As novas senhas não coincidem."})
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        nome = ""
        if self.user.tipo == "PF" and hasattr(self.user, 'perfil_pf'):
            nome = self.user.perfil_pf.nome
        elif self.user.tipo == "PJ" and hasattr(self.user, 'perfil_pj'):
            nome = self.user.perfil_pj.nome_fantasia or self.user.perfil_pj.razao_social

        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'tipo': self.user.tipo,
            'telefone': self.user.telefone,
            'telefone_validado': self.user.telefone_validado,
            'nome': nome or self.user.email.split('@')[0],
        }
        return data