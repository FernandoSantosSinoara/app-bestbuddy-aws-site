from django.urls import path
from .views import (
    RegisterView,
    PerfilView,
    AlterarEmailView,
    ConfirmarEmailView,
    AlterarSenhaView,
    TwilioEnviarCodigoView,
    TwilioVerificarCodigoView,
    RecuperarSenhaView,
    RedefinirSenhaView,
    UsuariosView,
    UsuariosDetailView,
    VerificarTelefoneView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("perfil/", PerfilView.as_view(), name="perfil"),
    path("alterar-email/", AlterarEmailView.as_view(), name="alterar-email"),
    path("confirmar-email/", ConfirmarEmailView.as_view(), name="confirmar-email"),
    path("alterar-senha/", AlterarSenhaView.as_view(), name="alterar-senha"),
    path("recuperar-senha/", RecuperarSenhaView.as_view(), name="recuperar-senha"),
    path("redefinir-senha/", RedefinirSenhaView.as_view(), name="redefinir-senha"),
    path("whatsapp/enviar/", TwilioEnviarCodigoView.as_view(), name="whatsapp-enviar"),
    path("whatsapp/verificar/", TwilioVerificarCodigoView.as_view(), name="whatsapp-verificar"),
    path("", UsuariosView.as_view(), name="usuarios-list"),
    path("<int:pk>/", UsuariosDetailView.as_view(), name="usuarios-detail"),
    path("verificar-telefone/", VerificarTelefoneView.as_view(), name="verificar-telefone"),
]