import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from usuarios.models import Usuario
from animais.models import Animal

client = APIClient()

def run_tests():
    print("=== TESTE DOS ENDPOINTS DA API BEST BUDDY ===")

    # 0. Cadastro de Usuário sem CPF (Super rápido e sem fricção)
    print("\n0. Testando POST /api/usuarios/register/ (Sem CPF) ...")
    Usuario.objects.filter(email='novo_sem_cpf@teste.com').delete()
    Usuario.objects.filter(telefone='11988887777').delete()
    res_reg = client.post('/api/usuarios/register/', {
        'nome': 'Novo Usuário',
        'email': 'novo_sem_cpf@teste.com',
        'password': 'SenhaForte@123',
        'telefone': '11988887777',
        'tipo': 'PF'
    }, format='json')
    assert res_reg.status_code == 201, f"Falha no registro sem CPF: {res_reg.data}"
    assert 'access' in res_reg.data
    assert res_reg.data['user']['email'] == 'novo_sem_cpf@teste.com'
    print(f"OK! Usuário registrado sem CPF com sucesso: {res_reg.data['user']['email']}")

    # 0.1 Testando Unicidade de Telefone no Registro
    print("\n0.1 Testando Unicidade de Telefone no Registro ...")
    res_dup = client.post('/api/usuarios/register/', {
        'nome': 'Outro Usuário',
        'email': 'outro_com_mesmo_tel@teste.com',
        'password': 'SenhaForte@123',
        'telefone': '11988887777',
        'tipo': 'PF'
    }, format='json')
    assert res_dup.status_code == 400, "Deveria ter rejeitado cadastro com telefone duplicado"
    print("OK! Telefone duplicado rejeitado com sucesso.")

    # 0.2 Testando Endpoint de Verificação de Telefone
    print("\n0.2 Testando GET /api/usuarios/verificar-telefone/ ...")
    res_chk1 = client.get('/api/usuarios/verificar-telefone/?telefone=11988887777')
    assert res_chk1.status_code == 200
    assert res_chk1.data['disponivel'] is False, "Telefone 11988887777 deveria estar indisponivel"
    
    res_chk2 = client.get('/api/usuarios/verificar-telefone/?telefone=11911112222')
    assert res_chk2.status_code == 200
    assert res_chk2.data['disponivel'] is True, "Telefone 11911112222 deveria estar disponivel"
    print("OK! Rota de verificação de telefone funcionando perfeitamente.")

    Usuario.objects.filter(email='novo_sem_cpf@teste.com').delete()

    # 1. Login e Token Customizado
    print("\n1. Testando POST /api/token/ ...")
    u_base, _ = Usuario.objects.get_or_create(
        email='usuario@bestbuddy.com',
        defaults={
            'tipo': 'PF',
            'telefone': '(16) 99999-0000',
            'telefone_validado': True,
        }
    )
    u_base.set_password('123456')
    u_base.telefone = '(16) 99999-0000'
    u_base.telefone_validado = True
    u_base.save()

    res = client.post('/api/token/', {'email': 'usuario@bestbuddy.com', 'password': '123456'}, format='json')
    print(f"Status: {res.status_code}")
    assert res.status_code == 200, f"Falha no login: {res.data}"
    assert 'access' in res.data, "Falta access token"
    assert 'user' in res.data, "Falta dados do user"
    assert 'telefone' in res.data['user'], "Falta campo telefone no user"
    assert 'telefone_validado' in res.data['user'], "Falta campo telefone_validado no user"
    print(f"OK! User retornado: {res.data['user']['email']} | Telefone: {res.data['user']['telefone']} | Validado: {res.data['user']['telefone_validado']}")
    token = res.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    # 2. Tela / Endpoint de Perfil
    print("\n2. Testando GET /api/usuarios/perfil/ ...")
    res_perfil = client.get('/api/usuarios/perfil/')
    print(f"Status: {res_perfil.status_code}")
    assert res_perfil.status_code == 200, f"Falha no perfil: {res_perfil.data}"
    user_id = res_perfil.data['id']
    assert res_perfil.data['email'] == 'usuario@bestbuddy.com'
    assert res_perfil.data['telefone_validado'] is True
    print(f"OK! Perfil ID {user_id}: {res_perfil.data}")

    # 3. Validação de WhatsApp via Twilio (Enviar e Verificar Código)
    print("\n3. Testando endpoints de WhatsApp Twilio ...")
    res_env = client.post('/api/usuarios/whatsapp/enviar/', {'telefone': '11988887777'}, format='json')
    print(f"Envio Status: {res_env.status_code}")
    assert res_env.status_code == 200

    res_verif = client.post('/api/usuarios/whatsapp/verificar/', {'telefone': '11988887777', 'codigo': '123456'}, format='json')
    print(f"Verificação Status: {res_verif.status_code}")
    assert res_verif.status_code == 200
    assert res_verif.data['telefone_validado'] is True
    assert res_verif.data['telefone'] == '11988887777'
    print(f"OK! WhatsApp validado com sucesso: {res_verif.data['telefone']}")

    # 4. Alteração de Senha (com senha atual)
    print("\n4. Testando POST /api/usuarios/alterar-senha/ ...")
    # Tentativa com senha errada
    res_err = client.post('/api/usuarios/alterar-senha/', {
        'senha_atual': 'senha_incorreta',
        'nova_senha': 'nova_senha123',
        'confirmar_nova_senha': 'nova_senha123'
    }, format='json')
    assert res_err.status_code == 400, "Deveria barrar senha incorreta"

    # Tentativa com senha fraca (< 8 caracteres ou sem letras/números) - deve ser barrada
    res_weak = client.post('/api/usuarios/alterar-senha/', {
        'senha_atual': '123456',
        'nova_senha': '123456',
        'confirmar_nova_senha': '123456'
    }, format='json')
    assert res_weak.status_code == 400, "Deveria barrar senha que não cumpre critérios (mínimo 8 caracteres, letras e números)"

    # Tentativa com senha correta e forte (8+ chars com letras e números)
    res_pwd = client.post('/api/usuarios/alterar-senha/', {
        'senha_atual': '123456',
        'nova_senha': 'SenhaForte123',
        'confirmar_nova_senha': 'SenhaForte123'
    }, format='json')
    assert res_pwd.status_code == 200
    print("OK! Senha alterada e validada com sucesso.")

    # 5. Alteração de E-mail (com senha atual e confirmação via token)
    print("\n5. Testando POST /api/usuarios/alterar-email/ e confirmar ...")
    test_email = f"novo_email_{user_id}@bestbuddy.com"
    Usuario.objects.filter(email=test_email).delete()

    res_email = client.post('/api/usuarios/alterar-email/', {
        'novo_email': test_email,
        'senha_atual': 'SenhaForte123'
    }, format='json')
    assert res_email.status_code == 200, f"Falha ao solicitar alteração de email: {res_email.data}"
    token_email = res_email.data.get('token_dev')
    assert token_email, "Token assinado deve ser gerado"

    # Confirmação do email
    res_conf = client.post('/api/usuarios/confirmar-email/', {'token': token_email}, format='json')
    assert res_conf.status_code == 200, f"Falha ao confirmar email: {res_conf.data}"
    print(f"OK! E-mail confirmado com sucesso: {res_conf.data['email']}")

    # Restaura o email e senha originais para manter consistência
    u = Usuario.objects.get(pk=user_id)
    u.email = 'usuario@bestbuddy.com'
    u.set_password('123456')
    u.save()

    # 6. Listagem de Animais (Tabela Unificada)
    print("\n6. Testando GET /api/animais/ (Tabela Unificada: Adoção e Perdidos)...")
    res_animais = client.get('/api/animais/')
    assert res_animais.status_code == 200
    print(f"OK! Total de registros: {len(res_animais.data)}")

    # Filtro por Adoção
    res_adocao = client.get('/api/animais/?tipo_servico=ADOCAO')
    assert res_adocao.status_code == 200
    assert all(item['tipo_servico'] == 'ADOCAO' for item in res_adocao.data)
    print(f"OK! Adoção: {len(res_adocao.data)} pets")

    # Filtro por Perdidos
    res_perdidos = client.get('/api/animais/?tipo_servico=PERDIDO')
    assert res_perdidos.status_code == 200
    assert all(item['tipo_servico'] == 'PERDIDO' for item in res_perdidos.data)
    print(f"OK! Animais Perdidos: {len(res_perdidos.data)} pets")

    # 7. Cadastro de Animal na Tabela Unificada com Contato Herdado do Tutor
    print("\n7. Testando POST /api/animais/ (Com tutor validado e dentro da cota) ...")
    Usuario.objects.filter(email='tutor_validado@teste.com').delete()
    tutor_validado = Usuario.objects.create_user(
        email='tutor_validado@teste.com',
        password='password123',
        telefone='(11) 97777-6666',
        telefone_validado=True
    )
    client_tutor = APIClient()
    res_login_tutor = client_tutor.post('/api/token/', {'email': 'tutor_validado@teste.com', 'password': 'password123'}, format='json')
    client_tutor.credentials(HTTP_AUTHORIZATION=f"Bearer {res_login_tutor.data['access']}")

    # 7.1 Teste: Criação SEM foto é barrada
    payload_sem_foto = {
        "tipo_servico": "ADOCAO",
        "tipo_animal": "CACHORRO",
        "nome": "Caramelo Teste",
        "cidade": "São Carlos",
        "descricao": "Pet sem foto.",
    }
    res_sem_foto = client_tutor.post('/api/animais/', payload_sem_foto, format='json')
    assert res_sem_foto.status_code == 400, "Deveria barrar criação sem foto"
    assert "foto do animal é obrigatória" in str(res_sem_foto.data)
    print("OK! Criação sem foto barrada com sucesso.")

    import io
    from PIL import Image
    from django.core.files.uploadedfile import SimpleUploadedFile
    from unittest.mock import patch

    def make_test_img(name="pet.jpg"):
        buf = io.BytesIO()
        Image.new('RGB', (100, 100), color='white').save(buf, format='JPEG')
        buf.seek(0)
        return SimpleUploadedFile(name, buf.getvalue(), content_type="image/jpeg")

    payload_pet = {
        "tipo_servico": "ADOCAO",
        "tipo_animal": "CACHORRO",
        "nome": "Caramelo Teste",
        "cidade": "São Carlos",
        "descricao": "Pet muito amoroso procurando um lar.",
        "raca": "SRD",
        "sexo": "M",
        "idade_aproximada": "Filhote",
        "imagem": make_test_img("caramelo.jpg")
    }
    with patch('animais.serializers.validar_imagem_pet_e_seguranca', return_value=(True, "", "OK")):
        res_create = client_tutor.post('/api/animais/', payload_pet, format='multipart')
    assert res_create.status_code == 201, f"Falha ao criar pet: {res_create.data}"
    # Verifica se o contato veio da FK do tutor automaticamente no campo telefone_contato e no alias contato
    assert res_create.data['telefone_contato'] == '(11) 97777-6666', f"Telefone de contato incorreto: {res_create.data['telefone_contato']}"
    assert res_create.data['contato'] == '(11) 97777-6666', f"Contato incorreto: {res_create.data['contato']}"
    assert res_create.data['tutor_email'] == 'tutor_validado@teste.com'
    assert 'tutor_nome' in res_create.data, "Falta tutor_nome"
    print(f"OK! Pet criado #{res_create.data['id']}. Tutor: {res_create.data['tutor_nome']} | Contato direto: {res_create.data['telefone_contato']}")

    # 8. Teste de Cota: Usuário com >= 5 animais ativos é barrado
    print("\n8. Testando enforcement de cota (máx 5 para comum) ...")
    pets_count = Animal.objects.filter(
        tutor=u_base,
        status__in=[Animal.StatusAnimal.DISPONIVEL, Animal.StatusAnimal.PERDIDO]
    ).count()
    for i in range(pets_count, 5):
        Animal.objects.create(
            tutor=u_base,
            nome=f"Pet Cota {i}",
            cidade="São Carlos",
            tipo_animal="CACHORRO",
            tipo_servico="ADOCAO",
            status="DISPONIVEL",
            telefone_contato="(16) 99999-0000"
        )

    payload_pet_cota = {
        "tipo_servico": "ADOCAO",
        "tipo_animal": "CACHORRO",
        "nome": "Caramelo Cota",
        "cidade": "São Carlos",
        "descricao": "Pet cota.",
        "imagem": make_test_img("cota.jpg")
    }
    with patch('animais.serializers.validar_imagem_pet_e_seguranca', return_value=(True, "", "OK")):
        res_cota = client.post('/api/animais/', payload_pet_cota, format='multipart')
    assert res_cota.status_code == 400
    assert "Limite atingido" in str(res_cota.data)
    print(f"OK! Cota validada com sucesso: {res_cota.data}")

    # 9. Bloqueio de Cadastro para Usuário SEM WhatsApp Validado
    print("\n9. Testando Bloqueio de Anúncio sem WhatsApp Validado ...")
    Usuario.objects.filter(email='sem_whats@teste.com').delete()
    novo_user = Usuario.objects.create_user(email='sem_whats@teste.com', password='password123')
    novo_user.telefone_validado = False
    novo_user.save()

    client_sem_whats = APIClient()
    res_sem_whats_login = client_sem_whats.post('/api/token/', {'email': 'sem_whats@teste.com', 'password': 'password123'}, format='json')
    client_sem_whats.credentials(HTTP_AUTHORIZATION=f"Bearer {res_sem_whats_login.data['access']}")
    
    payload_pet_sem_whats = {
        "tipo_servico": "ADOCAO",
        "tipo_animal": "CACHORRO",
        "nome": "Caramelo Sem Whats",
        "cidade": "São Carlos",
        "descricao": "Pet sem whats.",
        "imagem": make_test_img("whats.jpg")
    }
    with patch('animais.serializers.validar_imagem_pet_e_seguranca', return_value=(True, "", "OK")):
        res_bloqueio = client_sem_whats.post('/api/animais/', payload_pet_sem_whats, format='multipart')
    assert res_bloqueio.status_code == 400, f"Deveria barrar criação sem WhatsApp validado, obteve: {res_bloqueio.status_code}"
    print(f"OK! Bloqueio efetuado: {res_bloqueio.data}")
    novo_user.delete()
    tutor_validado.delete()

    # 10. Comunidade e Notícias DESCONTINUADOS (Deve retornar 404)
    print("\n10. Testando descontinuação de Notícias (GET /api/comunidade/noticias/) ...")
    res_noticias = client.get('/api/comunidade/noticias/')
    assert res_noticias.status_code == 404, f"Notícias deveriam estar descontinuadas, retornou {res_noticias.status_code}"
    print("OK! Rota de notícias descontinuada retornou 404 conforme esperado.")

    # 11. Comunidade: Posts DESCONTINUADOS (Deve retornar 404)
    print("\n11. Testando descontinuação de Posts (GET /api/comunidade/posts/) ...")
    res_posts = client.get('/api/comunidade/posts/')
    assert res_posts.status_code == 404, f"Posts deveriam estar descontinuados, retornou {res_posts.status_code}"
    print("OK! Rota de posts descontinuada retornou 404 conforme esperado.")

    # 12. Intermediação de Adoções DESCONTINUADA (Deve retornar 404 em favor do WhatsApp direto)
    print("\n12. Testando descontinuação da intermediação de adoções (GET /api/adocoes/) ...")
    res_adocoes = client.get('/api/adocoes/')
    assert res_adocoes.status_code == 404, f"Adoções deveriam estar descontinuadas, retornou {res_adocoes.status_code}"
    print(f"OK! Rota de adocoes descontinuada retornou 404 (contato direto via WhatsApp consolidado).")

    # 13. Recuperação de Senha (RF05)
    print("\n13. Testando Recuperação e Redefinição de Senha (POST /api/usuarios/recuperar-senha/ e /redefinir-senha/) ...")
    res_rec = client.post('/api/usuarios/recuperar-senha/', {'email': 'usuario@bestbuddy.com'}, format='json')
    assert res_rec.status_code == 200, f"Falha ao solicitar recuperação: {res_rec.data}"
    token_rec = res_rec.data.get('token_dev')
    assert token_rec, "Deve retornar token assinado"

    res_red = client.post('/api/usuarios/redefinir-senha/', {
        'token': token_rec,
        'nova_senha': 'nova_senha_999',
        'confirmar_nova_senha': 'nova_senha_999'
    }, format='json')
    assert res_red.status_code == 200, f"Falha ao redefinir senha: {res_red.data}"

    # Valida login com a nova senha
    res_log_new = client.post('/api/token/', {'email': 'usuario@bestbuddy.com', 'password': 'nova_senha_999'}, format='json')
    assert res_log_new.status_code == 200, "Login com nova senha falhou"

    # Restaura senha para 123456
    u_reset = Usuario.objects.get(email='usuario@bestbuddy.com')
    u_reset.set_password('123456')
    u_reset.save()
    print("OK! Fluxo de recuperação e redefinição de senha validado com sucesso.")

    # 14. Gerenciamento de Anúncio pelo Tutor (PATCH status e DELETE)
    print("\n14. Testando Gerenciamento de Anúncio pelo Tutor (PATCH status e DELETE) ...")
    # Cria pet com tutor_teste
    Usuario.objects.filter(email='tutor_mgmt@teste.com').delete()
    tutor_mgmt = Usuario.objects.create_user(
        email='tutor_mgmt@teste.com',
        password='password123',
        telefone='(19) 99999-1111',
        telefone_validado=True
    )
    client_mgmt = APIClient()
    res_l_mgmt = client_mgmt.post('/api/token/', {'email': 'tutor_mgmt@teste.com', 'password': 'password123'}, format='json')
    client_mgmt.credentials(HTTP_AUTHORIZATION=f"Bearer {res_l_mgmt.data['access']}")

    payload_miau = {
        "tipo_servico": "ADOCAO",
        "tipo_animal": "GATO",
        "nome": "Miau Teste",
        "cidade": "Campinas",
        "descricao": "Gatinho muito tranquilo.",
        "sexo": "F",
        "imagem": make_test_img("miau.jpg")
    }
    with patch('animais.serializers.validar_imagem_pet_e_seguranca', return_value=(True, "", "OK")):
        res_pet_novo = client_mgmt.post('/api/animais/', payload_miau, format='multipart')
    assert res_pet_novo.status_code == 201, f"Falha ao criar pet: {res_pet_novo.data}"
    pet_id = res_pet_novo.data['id']
    assert res_pet_novo.data['status'] == 'DISPONIVEL'

    # Tutor marca como ADOTADO
    res_patch = client_mgmt.patch(f'/api/animais/{pet_id}/', {'status': 'ADOTADO'}, format='json')
    assert res_patch.status_code == 200
    assert res_patch.data['status'] == 'ADOTADO'
    print(f"OK! Pet #{pet_id} atualizado para status ADOTADO pelo tutor.")

    # Outro usuário tenta excluir (deve ser barrado com 403 PermissionDenied)
    Usuario.objects.filter(email='outro_user@teste.com').delete()
    outro_user = Usuario.objects.create_user(email='outro_user@teste.com', password='password123')
    client_outro = APIClient()
    res_l_outro = client_outro.post('/api/token/', {'email': 'outro_user@teste.com', 'password': 'password123'}, format='json')
    client_outro.credentials(HTTP_AUTHORIZATION=f"Bearer {res_l_outro.data['access']}")

    res_del_outro = client_outro.delete(f'/api/animais/{pet_id}/')
    assert res_del_outro.status_code == 403, f"Deveria barrar exclusão por terceiro, retornou {res_del_outro.status_code}"
    print("OK! Tentativa de exclusão por usuário não tutor barrada com 403.")

    # Tutor exclui seu próprio pet
    res_del_tutor = client_mgmt.delete(f'/api/animais/{pet_id}/')
    assert res_del_tutor.status_code == 204
    print(f"OK! Pet #{pet_id} excluído pelo tutor com sucesso.")

    tutor_mgmt.delete()
    outro_user.delete()

    # 15. Testando Estatísticas e Exclusão de Animais Adotados
    print("\n15. Testando GET /api/animais/estatisticas/ e ?exclude_status=ADOTADO ...")
    res_stats = client.get('/api/animais/estatisticas/')
    assert res_stats.status_code == 200
    assert 'total_adotados' in res_stats.data
    assert 'total_disponiveis' in res_stats.data
    print(f"OK! Estatísticas retornadas com sucesso: {res_stats.data}")

    res_excl = client.get('/api/animais/?exclude_status=ADOTADO')
    assert res_excl.status_code == 200
    assert not any(p['status'] == 'ADOTADO' for p in res_excl.data)
    print("OK! Animais adotados removidos com sucesso da lista com exclude_status=ADOTADO.")

    print("\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===")

if __name__ == '__main__':
    run_tests()
