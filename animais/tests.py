import io
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.exceptions import ValidationError

from .models import Animal
from .serializers import AnimaisSerializer
from .utils import (
    validar_imagem_pet_e_seguranca,
    verificar_seguranca_nsfw,
    verificar_pet_yolo,
    otimizar_imagem_animal
)


class ValidadorImagemAITests(TestCase):
    def setUp(self):
        # Cria uma imagem de teste neutra em memória (100x100 branca)
        self.img_neutra = Image.new('RGB', (100, 100), color='white')
        buffer = io.BytesIO()
        self.img_neutra.save(buffer, format='JPEG')
        buffer.seek(0)
        self.arquivo_neutro = SimpleUploadedFile(
            name='foto_neutra.jpg',
            content=buffer.getvalue(),
            content_type='image/jpeg'
        )

    def test_rejeita_imagem_sem_animal(self):
        """Uma imagem branca/vazia sem cachorro ou gato deve ser reprovada."""
        sucesso, erro, codigo = validar_imagem_pet_e_seguranca(self.arquivo_neutro, tipo_esperado='CACHORRO')
        self.assertFalse(sucesso)
        self.assertEqual(codigo, 'PET_NOT_FOUND')
        self.assertIn("Não conseguimos identificar um cão ou gato com clareza", erro)

    @patch('animais.utils.verificar_seguranca_nsfw')
    def test_rejeita_conteudo_inseguro_nsfw(self, mock_nsfw):
        """Se o classificador NSFW acusar risco, bloqueia com mensagem de segurança da comunidade."""
        mock_nsfw.return_value = (False, 0.95)

        sucesso, erro, codigo = validar_imagem_pet_e_seguranca(self.arquivo_neutro)
        self.assertFalse(sucesso)
        self.assertEqual(codigo, 'SAFETY_VIOLATION')
        self.assertEqual(
            erro,
            "A imagem pode estar infringindo alguma regra de segurança da comunidade, se não houver nada de errado com a foto, por favor, nos avise!"
        )

    @patch('animais.utils.get_yolo_detector')
    def test_aprova_pet_correto(self, mock_get_detector):
        """Foto contendo cão quando o anúncio é de cachorro deve ser aprovada."""
        mock_detector = MagicMock()
        mock_box = MagicMock()
        mock_box.cls = [16]
        mock_box.conf = [0.92]
        mock_res = MagicMock()
        mock_res.boxes = [mock_box]
        mock_res.names = {16: 'dog', 15: 'cat'}
        mock_detector.return_value = [mock_res]
        mock_get_detector.return_value = mock_detector

        with patch('animais.utils.verificar_seguranca_nsfw', return_value=(True, 0.05)):
            sucesso, erro, codigo = validar_imagem_pet_e_seguranca(self.arquivo_neutro, tipo_esperado='CACHORRO')
            self.assertTrue(sucesso)
            self.assertEqual(codigo, 'OK')
            self.assertEqual(erro, "")

    @patch('animais.utils.get_yolo_detector')
    def test_rejeita_mismatch_com_mensagem_personalizada(self, mock_get_detector):
        """Foto exclusivamente de gato quando o anúncio é de cachorro deve gerar aviso de mismatch."""
        mock_detector = MagicMock()
        mock_box = MagicMock()
        mock_box.cls = [15]  # Gato
        mock_box.conf = [0.89]
        mock_res = MagicMock()
        mock_res.boxes = [mock_box]
        mock_res.names = {16: 'dog', 15: 'cat'}
        mock_detector.return_value = [mock_res]
        mock_get_detector.return_value = mock_detector

        with patch('animais.utils.verificar_seguranca_nsfw', return_value=(True, 0.02)):
            sucesso, erro, codigo = validar_imagem_pet_e_seguranca(self.arquivo_neutro, tipo_esperado='CACHORRO')
            self.assertFalse(sucesso)
            self.assertEqual(codigo, 'PET_MISMATCH')
            self.assertEqual(erro, "Não detectamos o cachorro mencionado na foto.")

    @patch('animais.utils.get_yolo_detector')
    def test_aprova_foto_com_cao_e_gato_juntos_tolerante(self, mock_get_detector):
        """Foto com cachorro e gato juntos não deve sofrer falso positivo se o pet esperado estiver presente."""
        mock_detector = MagicMock()
        box_dog = MagicMock()
        box_dog.cls = [16]
        box_dog.conf = [0.95]

        box_cat = MagicMock()
        box_cat.cls = [15]
        box_cat.conf = [0.70]

        mock_res = MagicMock()
        mock_res.boxes = [box_dog, box_cat]
        mock_res.names = {16: 'dog', 15: 'cat'}
        mock_detector.return_value = [mock_res]
        mock_get_detector.return_value = mock_detector

        with patch('animais.utils.verificar_seguranca_nsfw', return_value=(True, 0.01)):
            # Usuário anunciou um GATO, mesmo o cão estando em evidência
            sucesso, erro, codigo = validar_imagem_pet_e_seguranca(self.arquivo_neutro, tipo_esperado='GATO')
            self.assertTrue(sucesso)
            self.assertEqual(codigo, 'OK')

    @patch('animais.utils.get_yolo_detector', return_value=None)
    def test_fallback_resiliente_se_ia_indisponivel(self, mock_get_detector):
        """Se o modelo YOLO falhar em carregar, o sistema não deve travar o upload do usuário."""
        with patch('animais.utils.verificar_seguranca_nsfw', return_value=(True, 0.0)):
            sucesso, erro, codigo = validar_imagem_pet_e_seguranca(self.arquivo_neutro, tipo_esperado='CACHORRO')
            self.assertTrue(sucesso)
            self.assertEqual(codigo, 'OK')


class AnimaisSerializerValidationTests(TestCase):
    @patch('animais.serializers.validar_imagem_pet_e_seguranca')
    def test_serializer_valida_e_bloqueia_imagem_invalida(self, mock_validador):
        """O serializer deve lançar ValidationError no campo imagem antes de salvar no banco."""
        mock_validador.return_value = (
            False,
            "Não detectamos o cachorro mencionado na foto.",
            "PET_MISMATCH"
        )

        img = Image.new('RGB', (100, 100), color='white')
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        img_file = SimpleUploadedFile("pet.jpg", buf.getvalue(), content_type="image/jpeg")
        serializer = AnimaisSerializer(data={

            "nome": "Rex",
            "tipo_servico": "ADOCAO",
            "tipo_animal": "CACHORRO",
            "estado": "SP",
            "cidade": "Campinas",
            "telefone_contato": "11988887777",
            "imagem": img_file
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn("imagem", serializer.errors)
        self.assertIn("Não detectamos o cachorro mencionado na foto.", str(serializer.errors["imagem"]))

    def test_serializer_exige_foto_na_criacao(self):
        """Ao cadastrar um novo pet, a foto deve ser obrigatória."""
        serializer = AnimaisSerializer(data={
            "nome": "Pipoca",
            "tipo_servico": "ADOCAO",
            "tipo_animal": "GATO",
            "estado": "SP",
            "cidade": "Santos",
            "telefone_contato": "11988887777"
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("imagem", serializer.errors)
        self.assertIn("A foto do animal é obrigatória para publicar o anúncio.", str(serializer.errors["imagem"]))

    def test_serializer_permite_edicao_sem_reenviar_foto(self):
        """Ao editar um animal que já possui foto, não é necessário enviar o arquivo novamente."""
        animal = Animal.objects.create(
            nome="Bidu",
            tipo_servico=Animal.TipoServico.ADOCAO,
            tipo_animal=Animal.TipoAnimal.CACHORRO,
            estado=Animal.Estado.SP,
            cidade="Campinas",
            telefone_contato="11988887777",
            imagem="animais/bidu.webp"
        )
        serializer = AnimaisSerializer(
            instance=animal,
            data={"nome": "Bidu Atualizado"},
            partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["nome"], "Bidu Atualizado")


from rest_framework.test import APIClient
from rest_framework import status
from usuarios.models import Usuario
from animais.models import Animal


class AnimaisAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tutor = Usuario.objects.create_user(
            email="tutor@teste.com",
            password="password123",
            telefone="11988887777",
            telefone_validado=True,
            tipo="PF"
        )
        self.outro_user = Usuario.objects.create_user(
            email="outro@teste.com",
            password="password123",
            telefone="11977776666",
            telefone_validado=True,
            tipo="PF"
        )

    def test_listar_animais_publico(self):
        Animal.objects.create(
            tutor=self.tutor,
            nome="Rex",
            tipo_servico=Animal.TipoServico.ADOCAO,
            tipo_animal=Animal.TipoAnimal.CACHORRO,
            estado=Animal.Estado.SP,
            cidade="São Paulo",
            telefone_contato="11988887777"
        )
        res = self.client.get("/api/animais/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    @patch('animais.serializers.validar_imagem_pet_e_seguranca', return_value=(True, "OK", "OK"))
    def test_criar_animal_autenticado_com_telefone(self, _mock_val):
        self.client.force_authenticate(user=self.tutor)
        img = Image.new('RGB', (100, 100), color='white')
        buf = io.BytesIO()
        img.save(buf, format='JPEG')
        buf.seek(0)
        img_file = SimpleUploadedFile("bidu.jpg", buf.getvalue(), content_type="image/jpeg")

        payload = {
            "nome": "Bidu",
            "tipo_servico": "ADOCAO",
            "tipo_animal": "CACHORRO",
            "estado": "SP",
            "cidade": "Campinas",
            "telefone_contato": "11988887777",
            "sexo": "M",
            "imagem": img_file
        }
        res = self.client.post("/api/animais/", payload, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["nome"], "Bidu")
        self.assertEqual(res.data["tutor_id"], self.tutor.id)

    def test_bloqueio_criacao_sem_autenticacao(self):
        payload = {
            "nome": "Sem Auth",
            "tipo_servico": "ADOCAO",
            "tipo_animal": "GATO",
            "estado": "SP",
            "cidade": "Santos",
            "telefone_contato": "11988887777"
        }
        res = self.client.post("/api/animais/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_limite_cota_5_animais_ativos(self):
        self.client.force_authenticate(user=self.tutor)
        for i in range(5):
            Animal.objects.create(
                tutor=self.tutor,
                nome=f"Pet {i}",
                tipo_servico=Animal.TipoServico.ADOCAO,
                tipo_animal=Animal.TipoAnimal.CACHORRO,
                estado=Animal.Estado.SP,
                cidade="São Paulo",
                telefone_contato="11988887777",
                status=Animal.StatusAnimal.DISPONIVEL
            )
        # 6º animal deve ser barrado
        payload = {
            "nome": "Pet Excedente",
            "tipo_servico": "ADOCAO",
            "tipo_animal": "CACHORRO",
            "estado": "SP",
            "cidade": "São Paulo",
            "telefone_contato": "11988887777"
        }
        res = self.client.post("/api/animais/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Limite atingido", str(res.data))

    def test_edicao_e_exclusao_apenas_pelo_tutor(self):
        pet = Animal.objects.create(
            tutor=self.tutor,
            nome="Thor",
            tipo_servico=Animal.TipoServico.ADOCAO,
            tipo_animal=Animal.TipoAnimal.CACHORRO,
            estado=Animal.Estado.SP,
            cidade="Campinas",
            telefone_contato="11988887777"
        )
        # Outro usuário tenta editar
        self.client.force_authenticate(user=self.outro_user)
        res_edit_outro = self.client.patch(f"/api/animais/{pet.id}/", {"nome": "Thor Hacker"}, format="json")
        self.assertEqual(res_edit_outro.status_code, status.HTTP_403_FORBIDDEN)

        # Outro usuário tenta excluir
        res_del_outro = self.client.delete(f"/api/animais/{pet.id}/")
        self.assertEqual(res_del_outro.status_code, status.HTTP_403_FORBIDDEN)

        # Tutor original edita e exclui
        self.client.force_authenticate(user=self.tutor)
        res_edit_tutor = self.client.patch(f"/api/animais/{pet.id}/", {"nome": "Thor Oficial"}, format="json")
        self.assertEqual(res_edit_tutor.status_code, status.HTTP_200_OK)

        res_del_tutor = self.client.delete(f"/api/animais/{pet.id}/")
        self.assertEqual(res_del_tutor.status_code, status.HTTP_204_NO_CONTENT)
