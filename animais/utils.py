import io
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps
from django.conf import settings
from django.core.files.base import ContentFile

os.environ.setdefault('KERAS_BACKEND', 'torch')

logger = logging.getLogger(__name__)

# Configurações do Validador de Pets
CLASSES_PETS = {'dog', 'cat'}
CONFIANCA_MINIMA_PET = 0.45
LIMIAR_NSFW_SEGURANCA = 0.60

_yolo_model = None


def get_yolo_detector():
    """Carrega o modelo YOLOv8-nano sob demanda em memória (Singleton)."""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            base_dir = getattr(settings, 'BASE_DIR', None)
            caminho_local = os.path.join(str(base_dir), 'yolov8n.pt') if base_dir else 'yolov8n.pt'
            _yolo_model = YOLO(caminho_local if os.path.exists(caminho_local) else 'yolov8n.pt')
            logger.info("YOLOv8-nano carregado com sucesso.")
        except Exception as e:
            logger.error(f"Falha ao carregar modelo YOLOv8: {e}")
            return None
    return _yolo_model


def verificar_seguranca_nsfw(img_pil, threshold=LIMIAR_NSFW_SEGURANCA):
    """
    Verifica se a imagem contém conteúdo impróprio, adulto ou nudez/gore.
    Retorna: (is_safe: bool, score: float)
    """
    try:
        import opennsfw2 as n2
        score = float(n2.predict_image(img_pil))
        is_safe = score < threshold
        return is_safe, score
    except Exception as e:
        logger.warning(f"Filtro de segurança NSFW indisponível ou falhou: {e}")
        # Fallback de resiliência: se o validador falhar por erro técnico, não trava o upload
        return True, 0.0


def verificar_pet_yolo(img_pil, tipo_esperado=None):
    """
    Detecta cães ou gatos na imagem e confere se há presença ou divergência com tipo_esperado.
    Retorna: (valido: bool, erro_msg: str, codigo_erro: str, detectados: list)
    """
    detector = get_yolo_detector()
    if detector is None:
        logger.warning("Detector de pets indisponível. Imagem aprovada por fallback resiliente.")
        return True, "", "OK", []

    try:
        results = detector(img_pil, verbose=False)
        pets_encontrados = []
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = r.names.get(cls_id, '')
                conf = float(box.conf[0])
                if cls_name in CLASSES_PETS and conf >= CONFIANCA_MINIMA_PET:
                    pets_encontrados.append((cls_name, conf))

        # 1. Se nenhum pet foi identificado
        if not pets_encontrados:
            return (
                False,
                "Não conseguimos identificar um cão ou gato com clareza nesta foto. Por favor, envie uma foto nítida e bem iluminada do pet.",
                "PET_NOT_FOUND",
                []
            )

        # 2. Se há tipo esperado especificado (CACHORRO ou GATO)
        if tipo_esperado:
            mapa_tipo = {
                'CACHORRO': ('dog', 'cachorro'),
                'GATO': ('cat', 'gato')
            }
            tipo_upper = str(tipo_esperado).upper()
            if tipo_upper in mapa_tipo:
                classe_esperada, nome_pt = mapa_tipo[tipo_upper]
                tem_esperado = any(cls_name == classe_esperada for cls_name, _ in pets_encontrados)

                # Se o pet esperado está na foto (mesmo junto a outro pet ou tutor), APROVADO!
                if tem_esperado:
                    return True, "", "OK", pets_encontrados

                # Se o pet esperado não estiver presente, rejeita imediatamente
                return (
                    False,
                    f"Não detectamos o {nome_pt} mencionado na foto.",
                    "PET_MISMATCH",
                    pets_encontrados
                )

        return True, "", "OK", pets_encontrados

    except Exception as e:
        logger.error(f"Erro durante inferência YOLOv8: {e}")
        return True, "", "OK", []


def validar_imagem_pet_e_seguranca(campo_ou_arquivo, tipo_esperado=None, user_id=None):
    """
    Executa verificação assíncrona/paralela na imagem:
    - Thread 1: Detecção de conteúdo adulto / impróprio (NSFW)
    - Thread 2: Detecção de presença do pet e compatibilidade com tipo_esperado (YOLOv8)

    Retorna: (sucesso: bool, mensagem_erro: str, codigo_erro: str)
    """
    if not campo_ou_arquivo:
        return True, "", "OK"

    inicio = time.perf_counter()
    largura, altura = 0, 0

    # Prepara a imagem PIL em memória de forma segura para uso em múltiplas threads
    try:
        if hasattr(campo_ou_arquivo, 'seek'):
            campo_ou_arquivo.seek(0)
            bytes_data = campo_ou_arquivo.read()
            campo_ou_arquivo.seek(0)
            img = Image.open(io.BytesIO(bytes_data))
        elif isinstance(campo_ou_arquivo, (str, os.PathLike)):
            img = Image.open(campo_ou_arquivo)
        elif isinstance(campo_ou_arquivo, Image.Image):
            img = campo_ou_arquivo
        else:
            img = Image.open(campo_ou_arquivo)

        img = ImageOps.exif_transpose(img)
        largura, altura = img.size
        img_rgb = img.convert('RGB')
    except Exception as e:
        logger.warning(f"Não foi possível abrir o arquivo para validação com IA: {e}")
        return True, "", "OK"

    # Execução concorrente em threads separadas (sem travar o servidor)
    with ThreadPoolExecutor(max_workers=2) as executor:
        fut_nsfw = executor.submit(verificar_seguranca_nsfw, img_rgb.copy())
        fut_pet = executor.submit(verificar_pet_yolo, img_rgb.copy(), tipo_esperado)

        is_safe, score_nsfw = fut_nsfw.result()
        pet_valido, erro_pet, codigo_pet, pets_encontrados = fut_pet.result()

    duracao_ms = round((time.perf_counter() - inicio) * 1000, 2)
    pets_fmt = [f"{cls_name}:{conf*100:.1f}%" for cls_name, conf in pets_encontrados]

    # Prioridade 1: Segurança da comunidade (NSFW / Nudismo / Gore)
    if not is_safe:
        resultado = (
            False,
            "A imagem pode estar infringindo alguma regra de segurança da comunidade, se não houver nada de errado com a foto, por favor, nos avise!",
            "SAFETY_VIOLATION"
        )
    # Prioridade 2: Presença do animal ou divergência de espécie
    elif not pet_valido:
        resultado = (False, erro_pet, codigo_pet)
    else:
        resultado = (True, "", "OK")

    sucesso, erro_msg, codigo_resultado = resultado

    # Log estruturado e seguro para auditoria técnica (Sem PII / LGPD Compliant)
    logger.info(
        f"[IA-AUDIT] user_id={user_id or 'anon'} | esperado={tipo_esperado or 'N/A'} | "
        f"dim={largura}x{altura} | nsfw_score={score_nsfw:.4f} | yolo={pets_fmt or 'nenhum'} | "
        f"status={codigo_resultado} | tempo={duracao_ms}ms"
    )

    return resultado



def otimizar_imagem_animal(campo_imagem, max_dimensao=1080, qualidade=85):
    """
    Processa e otimiza a imagem recebida:
    1. Corrige rotação física com base nas tags EXIF de celulares.
    2. Converte modos de cor especiais para garantir compatibilidade.
    3. Redimensiona proporcionalmente para não ultrapassar max_dimensao.
    4. Converte e comprime para formato WEBP em memória.
    5. Retorna um ContentFile com extensão .webp pronto para o ImageField.
    """
    if not campo_imagem:
        return campo_imagem

    # 1. Abre a imagem a partir do arquivo enviado
    try:
        img = Image.open(campo_imagem)
    except Exception:
        # Se não for possível ler como imagem, devolve o objeto original
        return campo_imagem

    nome_original = getattr(campo_imagem, 'name', '') or ''
    tamanho_bytes = getattr(campo_imagem, 'size', 0) or 0
    formato_imagem = (getattr(img, 'format', '') or '').upper()

    # 2. FAST-PATH: Se já foi otimizada no front (WebP, <= 1MB e dimensões <= max_dimensao)
    if (
        formato_imagem == 'WEBP'
        and tamanho_bytes <= 1024 * 1024
        and img.width <= max_dimensao
        and img.height <= max_dimensao
    ):
        if hasattr(campo_imagem, 'seek'):
            campo_imagem.seek(0)
        return campo_imagem

    # 3. SLOW-PATH (Fallback para uploads via Admin, scripts ou arquivos não-otimizados):
    # Trata orientação EXIF (fotos de smartphone)
    img = ImageOps.exif_transpose(img)

    # Trata modos de cores (evita quebra com transparência PNG ou CMYK)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img = img.convert('RGBA')
    else:
        img = img.convert("RGB")

    # 3. Redimensiona mantendo a proporção (downscale inteligente)
    img.thumbnail((max_dimensao, max_dimensao), Image.Resampling.LANCZOS)

    # 4. Salva a imagem comprimida no buffer de memória
    buffer = io.BytesIO()
    img.save(buffer, format="WEBP", quality=qualidade, optimize=True)
    buffer.seek(0)

    # 5. Gera o novo nome trocando a extensão original por .webp
    nome_base, _ = os.path.splitext(campo_imagem.name)
    novo_nome = f"{nome_base}.webp"

    return ContentFile(buffer.getvalue(), name=novo_nome)


