import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from usuarios.models import Usuario, PessoaFisica
from animais.models import Animal


def seed():
    print("Iniciando seed de dados...")

    # 1. Usuário de Teste (Ana Souza)
    email_teste = "usuario@bestbuddy.com"
    user, created = Usuario.objects.get_or_create(
        email=email_teste,
        defaults={
            "tipo": "PF",
            "is_active": True,
            "telefone": "(16) 99999-0000",
            "telefone_validado": True,
        }
    )
    user.set_password("123456")
    user.telefone = "(16) 99999-0000"
    user.telefone_validado = True
    user.save()

    pf, _ = PessoaFisica.objects.get_or_create(usuario=user)
    pf.nome = "Ana Souza"
    pf.save()
    print(f"Usuário pronto: {email_teste} (Telefone validado: {user.telefone_validado})")

    # 2. Animais de Adoção (Tabela Unificada)
    animais_adocao_mock = [
        {"id": 1, "nome": "Max", "cidade": "São Carlos", "raca": "SRD", "sexo": "M", "idade_aproximada": "Adulto", "medicamento": "Não", "castrado": "Sim", "descricao": "Dócil, adora brincar com bola.", "imagem": None},
        {"id": 2, "nome": "Luna", "cidade": "São Paulo", "raca": "Vira-lata caramelo", "sexo": "F", "idade_aproximada": "Filhote", "medicamento": "Não", "castrado": "Não", "descricao": "Muito brincalhona, ótima com crianças.", "imagem": None},
        {"id": 3, "nome": "Thor", "cidade": "Campinas", "raca": "Pastor Alemão", "sexo": "M", "idade_aproximada": "Adulto", "medicamento": "Sim", "castrado": "Sim", "descricao": "Protetor, precisa de espaço para correr.", "imagem": None},
        {"id": 4, "nome": "Nina", "cidade": "Ribeirão Preto", "raca": "SRD", "sexo": "F", "idade_aproximada": "Idoso", "medicamento": "Sim", "castrado": "Sim", "descricao": "Calma, ideal para apartamento.", "imagem": None},
    ]

    for item in animais_adocao_mock:
        Animal.objects.update_or_create(
            id=item["id"],
            defaults={
                "tutor": user,
                "tipo_servico": Animal.TipoServico.ADOCAO,
                "tipo_animal": Animal.TipoAnimal.CACHORRO,
                "nome": item["nome"],
                "estado": Animal.Estado.SP,
                "cidade": item["cidade"],
                "telefone_contato": "(16) 99999-0000",
                "raca": item["raca"],
                "sexo": item["sexo"],
                "idade_aproximada": item["idade_aproximada"],
                "medicamento": item["medicamento"],
                "castrado": item["castrado"],
                "descricao": item["descricao"],
                "imagem": item["imagem"],
                "status": Animal.StatusAnimal.DISPONIVEL,
            }
        )

    # 3. Animais Perdidos (Mesma tabela unificada Animal)
    animais_perdidos_mock = [
        {"id": 101, "nome": "Pipoca", "cidade": "São Carlos", "tipo_animal": Animal.TipoAnimal.GATO, "local": "Centro, próximo à praça", "descricao": "Gatinho siamês de coleira azul."},
        {"id": 102, "nome": "Bela", "cidade": "Araraquara", "tipo_animal": Animal.TipoAnimal.CACHORRO, "local": "Parque infantil", "descricao": "Desapareceu após fogos de artifício."},
    ]

    for item in animais_perdidos_mock:
        Animal.objects.update_or_create(
            id=item["id"],
            defaults={
                "tutor": user,
                "tipo_servico": Animal.TipoServico.PERDIDO,
                "tipo_animal": item["tipo_animal"],
                "nome": item["nome"],
                "estado": Animal.Estado.SP,
                "cidade": item["cidade"],
                "telefone_contato": "(16) 99999-0000",
                "local": item["local"],
                "descricao": item["descricao"],
                "status": Animal.StatusAnimal.PERDIDO,
            }
        )
    print(f"Total de animais na tabela unificada: {Animal.objects.count()} (Adoção: {Animal.objects.filter(tipo_servico='ADOCAO').count()}, Perdidos: {Animal.objects.filter(tipo_servico='PERDIDO').count()})")

    print("Seed concluído com sucesso!")


if __name__ == '__main__':
    seed()
