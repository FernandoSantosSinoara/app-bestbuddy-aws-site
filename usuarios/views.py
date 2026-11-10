import re
import sys
from django.conf import settings
from django.core import signing
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Usuario, PessoaFisica, PessoaJuridica
from .serializer import (
    AlterarEmailSerializer,
    AlterarSenhaSerializer,
    ConfirmarEmailSerializer,
    RecuperarSenhaSerializer,
    RedefinirSenhaSerializer,
    RegisterUsuarioSerializer,
    TwilioEnviarCodigoSerializer,
    TwilioVerificarCodigoSerializer,
    UsuarioSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterUsuarioSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.save()
        return Response(data, status=status.HTTP_201_CREATED)


class PerfilView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        nome = ""
        cpf = ""
        if user.tipo == "PF" and hasattr(user, "perfil_pf"):
            nome = user.perfil_pf.nome
        elif user.tipo == "PJ" and hasattr(user, "perfil_pj"):
            nome = user.perfil_pj.nome_fantasia or user.perfil_pj.razao_social
            cpf = user.perfil_pj.cnpj

        return Response({
            "id": user.id,
            "email": user.email,
            "tipo": user.tipo,
            "nome": nome or user.email.split("@")[0],
            "cpf_cnpj": cpf,
            "telefone": user.telefone or "",
            "telefone_validado": user.telefone_validado,
            "created_at": user.created_at,
        })

    def patch(self, request):
        user = request.user
        nome = request.data.get("nome")
        telefone = request.data.get("telefone")

        if nome is not None:
            nome_limpo = str(nome).strip()
            nome_atual = ""
            if user.tipo == "PF" and hasattr(user, "perfil_pf"):
                nome_atual = user.perfil_pf.nome
            elif user.tipo == "PJ" and hasattr(user, "perfil_pj"):
                nome_atual = user.perfil_pj.nome_fantasia or user.perfil_pj.razao_social

            # RF04: O nome não pode ser alterado depois de criado
            if nome_atual and nome_limpo != nome_atual:
                return Response(
                    {"error": "O nome não pode ser alterado após a criação da conta."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif not nome_atual and nome_limpo:
                if user.tipo == "PF" or not user.tipo:
                    pf, _ = PessoaFisica.objects.get_or_create(usuario=user)
                    pf.nome = nome_limpo
                    pf.save()
                    user.perfil_pf = pf
                elif user.tipo == "PJ":
                    pj, _ = PessoaJuridica.objects.get_or_create(usuario=user)
                    pj.nome_fantasia = nome_limpo
                    pj.save()
                    user.perfil_pj = pj

        if telefone is not None:
            telefone_limpo = re.sub(r'\D', '', str(telefone).strip()) or None
            # RF04: A alteração de telefone exige autenticação por duplo fator (WhatsApp/Twilio)
            if telefone_limpo and telefone_limpo != user.telefone:
                return Response(
                    {"error": "A alteração de telefone exige autenticação por duplo fator (validação por código via WhatsApp)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return self.get(request)


class AlterarEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AlterarEmailSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        senha_atual = serializer.validated_data["senha_atual"]
        novo_email = serializer.validated_data["novo_email"]

        # 1º Fator: Validação da senha atual do usuário
        if not request.user.check_password(senha_atual):
            return Response({"error": "A senha atual informada está incorreta."}, status=status.HTTP_400_BAD_REQUEST)

        if Usuario.objects.filter(email__iexact=novo_email).exclude(pk=request.user.pk).exists():
            return Response({"error": "Este email já está sendo utilizado por outro usuário."}, status=status.HTTP_400_BAD_REQUEST)

        # 2º Fator: Gera token de confirmação e envia ao novo e-mail
        token = signing.dumps({"user_id": request.user.id, "novo_email": novo_email}, salt="alterar-email")

        subject = "Confirmação de Alteração de E-mail - Best Buddy"
        message = (
            f"Olá!\n\nVocê solicitou a alteração do seu e-mail para {novo_email}.\n"
            f"Para concluir a alteração (duplo fator de segurança), utilize o token abaixo:\n\n{token}\n\n"
            f"Se você não solicitou esta alteração, ignore esta mensagem."
        )
        try:
            send_mail(
                subject,
                message,
                getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@bestbuddy.org"),
                [novo_email],
                fail_silently=True
            )
        except Exception:
            pass

        resp_data = {
            "message": f"Código de confirmação enviado para {novo_email}. Insira o token recebido para concluir o duplo fator.",
            "novo_email": novo_email,
            "requer_confirmacao": True,
        }
        if (settings.DEBUG or "test" in sys.argv) and token:
            resp_data["token_dev"] = token

        return Response(resp_data, status=status.HTTP_200_OK)


class ConfirmarEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmarEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]

        try:
            payload = signing.loads(token, salt="alterar-email", max_age=86400)  # 24h
            user_id = payload["user_id"]
            novo_email = payload["novo_email"]

            if Usuario.objects.filter(email__iexact=novo_email).exclude(pk=user_id).exists():
                return Response({"error": "Este email já está sendo utilizado por outro usuário."}, status=status.HTTP_400_BAD_REQUEST)

            user = Usuario.objects.get(pk=user_id)
            user.email = novo_email
            user.save()

            return Response({"message": "E-mail atualizado com sucesso!", "email": novo_email}, status=status.HTTP_200_OK)
        except signing.BadSignature:
            return Response({"error": "Token de confirmação inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)
        except Usuario.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)


class AlterarSenhaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AlterarSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        senha_atual = serializer.validated_data["senha_atual"]
        nova_senha = serializer.validated_data["nova_senha"]

        if not request.user.check_password(senha_atual):
            return Response({"error": "A senha atual informada está incorreta."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(nova_senha)
        request.user.save()

        return Response({"message": "Senha alterada com sucesso!"}, status=status.HTTP_200_OK)


try:
    from twilio.rest import Client
except ImportError:
    Client = None


class TwilioEnviarCodigoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwilioEnviarCodigoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        telefone = serializer.validated_data["telefone"]

        # Validação de unicidade no duplo fator
        digits = "".join(filter(str.isdigit, telefone))
        if Usuario.objects.filter(telefone=digits).exclude(pk=request.user.pk).exists():
            return Response(
                {"error": "Este telefone já está sendo utilizado por outro usuário."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Formatação para formato E.164
        if not digits.startswith("55"):
            digits_e164 = "55" + digits
        else:
            digits_e164 = digits
        formatted_whatsapp = f"whatsapp:+{digits_e164}"

        # Se houver credenciais reais de Twilio e a biblioteca estiver instalada, faz a chamada real
        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        verify_sid = getattr(settings, "TWILIO_VERIFY_SERVICE_SID", None)

        if Client and account_sid and auth_token and verify_sid:
            try:
                client = Client(account_sid, auth_token)
                client.verify.v2.services(verify_sid).verifications.create(
                    to=formatted_whatsapp,
                    channel="whatsapp"
                )
                return Response({"message": f"Código enviado via WhatsApp para {telefone}."})
            except Exception as e:
                return Response({"error": f"Erro na API Twilio: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)

        # Fallback de ambiente de desenvolvimento/testes
        return Response({
            "message": f"[DEV] Código de verificação enviado via WhatsApp para {telefone}. Utilize '123456' para confirmar.",
            "codigo_dev": "123456"
        }, status=status.HTTP_200_OK)


class TwilioVerificarCodigoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwilioVerificarCodigoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        telefone = serializer.validated_data["telefone"]
        codigo = serializer.validated_data["codigo"].strip()

        digits = "".join(filter(str.isdigit, telefone))
        if Usuario.objects.filter(telefone=digits).exclude(pk=request.user.pk).exists():
            return Response(
                {"error": "Este telefone já está sendo utilizado por outro usuário."},
                status=status.HTTP_400_BAD_REQUEST
            )

        approved = False

        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        verify_sid = getattr(settings, "TWILIO_VERIFY_SERVICE_SID", None)

        if Client and account_sid and auth_token and verify_sid:
            try:
                if not digits.startswith("55"):
                    digits_e164 = "55" + digits
                else:
                    digits_e164 = digits
                formatted_whatsapp = f"whatsapp:+{digits_e164}"

                client = Client(account_sid, auth_token)
                check = client.verify.v2.services(verify_sid).verification_checks.create(
                    to=formatted_whatsapp,
                    code=codigo
                )
                approved = (check.status == "approved")
            except Exception as e:
                return Response({"error": f"Erro na verificação Twilio: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)
        else:
            # Em modo dev/mock, aceita '123456' ou qualquer código de 6 dígitos
            approved = (codigo == "123456" or len(codigo) == 6)

        if approved:
            request.user.telefone = digits
            request.user.telefone_validado = True
            request.user.save()

            # Sincroniza também no perfil PF/PJ se existir
            if request.user.tipo == "PF" and hasattr(request.user, "perfil_pf"):
                request.user.perfil_pf.telefone = digits
                request.user.perfil_pf.save()
            elif request.user.tipo == "PJ" and hasattr(request.user, "perfil_pj"):
                request.user.perfil_pj.telefone = digits
                request.user.perfil_pj.save()

            return Response({
                "message": "WhatsApp verificado com sucesso!",
                "telefone": request.user.telefone,
                "telefone_validado": request.user.telefone_validado
            }, status=status.HTTP_200_OK)

        return Response({"error": "Código de verificação incorreto ou expirado."}, status=status.HTTP_400_BAD_REQUEST)


class IsSelfOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return bool(request.user and (request.user.is_staff or request.user.pk == obj.pk))


class UsuariosView(generics.ListCreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAdminUser]


class UsuariosDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, IsSelfOrAdmin]


class RecuperarSenhaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecuperarSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = Usuario.objects.filter(email__iexact=email).first()
        token = None
        if user:
            token = signing.dumps({"user_id": user.id, "email": user.email}, salt="recuperar-senha")
            subject = "Recuperação de Senha - Best Buddy"
            message = (
                f"Olá!\n\nVocê solicitou a redefinição de senha da sua conta no Best Buddy.\n"
                f"Utilize o token abaixo para redefinir sua senha:\n\n{token}\n\n"
                f"Se não foi você que solicitou, ignore esta mensagem."
            )
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL if hasattr(settings, "DEFAULT_FROM_EMAIL") else "no-reply@bestbuddy.org",
                    [email],
                    fail_silently=True
                )
            except Exception:
                pass

        resp_data = {
            "message": "Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas."
        }
        if settings.DEBUG and token:
            resp_data["token_dev"] = token

        return Response(resp_data, status=status.HTTP_200_OK)


class RedefinirSenhaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RedefinirSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["token"]
        nova_senha = serializer.validated_data["nova_senha"]

        try:
            payload = signing.loads(token, salt="recuperar-senha", max_age=86400)
            user_id = payload.get("user_id")
            user = Usuario.objects.get(pk=user_id)
        except (signing.SignatureExpired, signing.BadSignature, Usuario.DoesNotExist):
            return Response({"error": "Token de redefinição inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(nova_senha)
        user.save()

        return Response({"message": "Senha redefinida com sucesso! Você já pode entrar com a nova senha."}, status=status.HTTP_200_OK)

class VerificarTelefoneView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raw_phone = request.query_params.get("telefone", "")
        digits = re.sub(r'\D', '', raw_phone)

        if not digits:
            return Response({"disponivel": True})
            
        existe = Usuario.objects.filter(telefone=digits).exists()
        return Response({
            "disponivel": not existe,
            "message": "Este telefone já está em uso." if existe else "Telefone disponível."
        })