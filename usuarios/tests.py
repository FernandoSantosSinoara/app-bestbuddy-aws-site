from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from usuarios.models import Usuario, PessoaFisica


class UsuarioAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("register")
        self.login_url = reverse("token_obtain_pair")
        self.perfil_url = reverse("perfil")
        self.verificar_tel_url = reverse("verificar-telefone")

    def test_registro_usuario_pf_sucesso(self):
        payload = {
            "nome": "João Silva",
            "email": "joao@teste.com",
            "password": "SenhaForte@123",
            "telefone": "(11) 98765-4321",
            "tipo": "PF",
        }
        res = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["email"], "joao@teste.com")
        self.assertTrue(Usuario.objects.filter(email="joao@teste.com").exists())

    def test_registro_falha_nome_invalido(self):
        # Nome vazio
        payload_vazio = {
            "nome": "",
            "email": "nome_vazio@teste.com",
            "password": "SenhaForte@123",
            "telefone": "11988881111",
            "tipo": "PF",
        }
        res_vazio = self.client.post(self.register_url, payload_vazio, format="json")
        self.assertEqual(res_vazio.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nome", res_vazio.data)

        # Nome com menos de 3 caracteres
        payload_curto = {
            "nome": "Ab",
            "email": "nome_curto@teste.com",
            "password": "SenhaForte@123",
            "telefone": "11988882222",
            "tipo": "PF",
        }
        res_curto = self.client.post(self.register_url, payload_curto, format="json")
        self.assertEqual(res_curto.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nome", res_curto.data)

    def test_registro_falha_senha_fraca(self):
        casos_invalidos = [
            ("Abc@1", "mínimo 8 caracteres"),            # Menos de 8 caracteres
            ("senhademais@123", "letra maiúscula"),      # Sem maiúscula
            ("SENHADEMAIS@123", "letra minúscula"),      # Sem minúscula
            ("SenhaForteSemNum!", "um número"),          # Sem número
            ("SenhaForte12345", "caractere especial"),   # Sem caractere especial
        ]
        for idx, (senha, trecho_esperado) in enumerate(casos_invalidos):
            payload = {
                "nome": f"Teste Senha {idx}",
                "email": f"teste_pwd_{idx}@teste.com",
                "password": senha,
                "telefone": f"1198888000{idx}",
                "tipo": "PF",
            }
            res = self.client.post(self.register_url, payload, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"Senha '{senha}' deveria ser rejeitada")
            self.assertIn("password", res.data)
            self.assertIn(trecho_esperado, str(res.data["password"][0]))

    def test_bloqueio_telefone_duplicado_no_registro(self):
        Usuario.objects.create_user(
            email="existente@teste.com",
            password="password123",
            telefone="11987654321"
        )
        payload = {
            "nome": "Outro Usuário",
            "email": "outro@teste.com",
            "password": "SenhaForte@123",
            "telefone": "11987654321",
            "tipo": "PF",
        }
        res = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verificar_telefone_endpoint(self):
        Usuario.objects.create_user(
            email="tel_ocupado@teste.com",
            password="password123",
            telefone="11999998888"
        )
        res_indisp = self.client.get(f"{self.verificar_tel_url}?telefone=11999998888")
        self.assertEqual(res_indisp.status_code, status.HTTP_200_OK)
        self.assertFalse(res_indisp.data["disponivel"])

        res_disp = self.client.get(f"{self.verificar_tel_url}?telefone=11911112222")
        self.assertEqual(res_disp.status_code, status.HTTP_200_OK)
        self.assertTrue(res_disp.data["disponivel"])

    def test_login_retorna_jwt_e_dados_usuario(self):
        user = Usuario.objects.create_user(
            email="login@teste.com",
            password="minhasenha",
            telefone="11977778888",
            telefone_validado=True,
            tipo="PF"
        )
        PessoaFisica.objects.create(usuario=user, nome="Carlos Oliveira")

        res = self.client.post(self.login_url, {"email": "login@teste.com", "password": "minhasenha"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["nome"], "Carlos Oliveira")

    def test_perfil_requer_autenticacao(self):
        res = self.client.get(self.perfil_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_perfil_patch_bloqueia_alteracao_de_nome(self):
        user = Usuario.objects.create_user(
            email="perfil_nome@teste.com",
            password="SenhaForte@123",
            telefone="11966665555",
            tipo="PF"
        )
        PessoaFisica.objects.create(usuario=user, nome="Nome Original")
        self.client.force_authenticate(user=user)

        # Tentativa de alterar o nome cadastrado deve ser bloqueada com 400
        res = self.client.patch(self.perfil_url, {"nome": "Tentativa Novo Nome"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res.data)
        self.assertEqual(res.data["error"], "O nome não pode ser alterado após a criação da conta.")

    def test_perfil_patch_bloqueia_alteracao_direta_de_telefone(self):
        user = Usuario.objects.create_user(
            email="perfil_tel@teste.com",
            password="SenhaForte@123",
            telefone="11966665555",
            tipo="PF"
        )
        self.client.force_authenticate(user=user)

        # Tentativa de alterar telefone diretamente via PATCH sem 2FA deve ser bloqueada
        res = self.client.patch(self.perfil_url, {"telefone": "11988889999"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res.data)
        self.assertIn("duplo fator", res.data["error"].lower())

    def test_alteracao_telefone_duplo_fator_sucesso(self):
        user = Usuario.objects.create_user(
            email="tel_2fa@teste.com",
            password="SenhaForte@123",
            telefone="11955554444",
            tipo="PF"
        )
        self.client.force_authenticate(user=user)

        # 1º Fator: Envio de código WhatsApp
        res_env = self.client.post("/api/usuarios/whatsapp/enviar/", {"telefone": "11977778888"}, format="json")
        self.assertEqual(res_env.status_code, status.HTTP_200_OK)

        # 2º Fator: Validação do código OTP
        res_verif = self.client.post("/api/usuarios/whatsapp/verificar/", {"telefone": "11977778888", "codigo": "123456"}, format="json")
        self.assertEqual(res_verif.status_code, status.HTTP_200_OK)
        self.assertEqual(res_verif.data["telefone"], "11977778888")
        self.assertTrue(res_verif.data["telefone_validado"])

        user.refresh_from_db()
        self.assertEqual(user.telefone, "11977778888")
        self.assertTrue(user.telefone_validado)

    def test_alteracao_email_duplo_fator_sucesso(self):
        user = Usuario.objects.create_user(
            email="original_email@teste.com",
            password="SenhaForte@123",
            telefone="11944443333",
            tipo="PF"
        )
        user.set_password("SenhaForte@123")
        user.save()
        self.client.force_authenticate(user=user)

        # 1º Fator: Solicitação com senha atual
        res_sol = self.client.post("/api/usuarios/alterar-email/", {
            "novo_email": "novo_email_2fa@teste.com",
            "senha_atual": "SenhaForte@123"
        }, format="json")
        self.assertEqual(res_sol.status_code, status.HTTP_200_OK)
        token = res_sol.data.get("token_dev")
        self.assertTrue(token)

        # E-mail não deve ser alterado antes da confirmação do 2º fator
        user.refresh_from_db()
        self.assertEqual(user.email, "original_email@teste.com")

        # 2º Fator: Confirmação com o token
        res_conf = self.client.post("/api/usuarios/confirmar-email/", {"token": token}, format="json")
        self.assertEqual(res_conf.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertEqual(user.email, "novo_email_2fa@teste.com")

    def test_bloqueio_listagem_usuarios_para_usuario_comum(self):
        user = Usuario.objects.create_user(
            email="comum@teste.com",
            password="password123",
            telefone="11955554444",
            tipo="PF"
        )
        self.client.force_authenticate(user=user)
        res = self.client.get("/api/usuarios/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_bloqueio_idor_exclusao_outro_usuario(self):
        vitima = Usuario.objects.create_user(
            email="vitima@teste.com",
            password="password123",
            telefone="11944443333",
            tipo="PF"
        )
        atacante = Usuario.objects.create_user(
            email="atacante@teste.com",
            password="password123",
            telefone="11933332222",
            tipo="PF"
        )
        self.client.force_authenticate(user=atacante)
        # Atacante tenta excluir a conta da vítima
        res = self.client.delete(f"/api/usuarios/{vitima.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        # Conta da vítima permanece intacta
        self.assertTrue(Usuario.objects.filter(id=vitima.id).exists())

    def test_alterar_senha_valida_todos_criterios_senha_forte(self):
        user = Usuario.objects.create_user(
            email="alterar_pwd@teste.com",
            password="SenhaAtual@123",
            telefone="11922221111",
            tipo="PF"
        )
        self.client.force_authenticate(user=user)

        casos_invalidos = [
            ("Abc@1", "mínimo 8 caracteres"),
            ("senhademais@123", "letra maiúscula"),
            ("SENHADEMAIS@123", "letra minúscula"),
            ("SenhaForteSemNum!", "um número"),
            ("SenhaForte12345", "caractere especial"),
        ]

        for senha_fraca, trecho_esperado in casos_invalidos:
            res = self.client.post("/api/usuarios/alterar-senha/", {
                "senha_atual": "SenhaAtual@123",
                "nova_senha": senha_fraca,
                "confirmar_nova_senha": senha_fraca,
            }, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"Deveria rejeitar '{senha_fraca}'")
            self.assertIn("nova_senha", res.data)
            self.assertIn(trecho_esperado, str(res.data["nova_senha"][0]))

        # Caso de sucesso com senha forte válida
        res_ok = self.client.post("/api/usuarios/alterar-senha/", {
            "senha_atual": "SenhaAtual@123",
            "nova_senha": "NovaSenha@456",
            "confirmar_nova_senha": "NovaSenha@456",
        }, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)

    def test_redefinir_senha_valida_todos_criterios_senha_forte(self):
        from django.core import signing

        user = Usuario.objects.create_user(
            email="redefinir_pwd@teste.com",
            password="SenhaAntiga@123",
            telefone="11911110000",
            tipo="PF"
        )
        token = signing.dumps({"user_id": user.id, "email": user.email}, salt="recuperar-senha")

        casos_invalidos = [
            ("Abc@1", "mínimo 8 caracteres"),
            ("senhademais@123", "letra maiúscula"),
            ("SENHADEMAIS@123", "letra minúscula"),
            ("SenhaForteSemNum!", "um número"),
            ("SenhaForte12345", "caractere especial"),
        ]

        for senha_fraca, trecho_esperado in casos_invalidos:
            res = self.client.post("/api/usuarios/redefinir-senha/", {
                "token": token,
                "nova_senha": senha_fraca,
                "confirmar_nova_senha": senha_fraca,
            }, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"Deveria rejeitar '{senha_fraca}'")
            self.assertIn("nova_senha", res.data)
            self.assertIn(trecho_esperado, str(res.data["nova_senha"][0]))

        # Caso de sucesso com senha forte válida
        res_ok = self.client.post("/api/usuarios/redefinir-senha/", {
            "token": token,
            "nova_senha": "SenhaRedefinida#789",
            "confirmar_nova_senha": "SenhaRedefinida#789",
        }, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)

