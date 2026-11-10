# 🖼️ Arquitetura de Otimização e Compressão de Imagens (Canvas API + Pillow & WebP)
tags: #frontend #backend #canvas #pillow #webp #performance #segurança #lgpd #roadmap

Este documento detalha a arquitetura completa de processamento, redimensionamento e conversão de fotos de animais no **Best Buddy**. O sistema opera em **Dupla Camada (Frontend Canvas API + Backend Pillow)**, garantindo economia de até **98% de consumo de banda**, upload instantâneo e conformidade total com privacidade e LGPD.

---

## 📌 1. Motivação e Diagnóstico do Problema

### Como funcionava originalmente:
1. O usuário tirava uma foto com celular moderno (muitas vezes em 4K/48MP, pesando de 5 MB a 25 MB).
2. O sistema bloqueava arquivos maiores que 5 MB com erro, frustrando usuários comuns que não sabem reduzir o tamanho da imagem no aparelho.
3. Se a foto passasse (ex: 4.8 MB), o navegador precisava enviar 4.8 MB via rede móvel (3G/4G), resultando em:
   - Upload lento (3 a 10+ segundos).
   - Consumo severo do plano de dados móveis do usuário.
   - Tráfego de entrada (*ingress*) pesado no servidor.
   - Envio de metadados EXIF sensíveis gravados pela câmera (coordenadas GPS de latitude/longitude da residência do usuário).

### A Nova Solução (Estratégia de Dupla Camada):
1. **Frontend (Camada 1 - UX, Banda e LGPD):**
   - O `<input type="file">` aceita fotos de até **50 MB** (cobre qualquer câmera de smartphone moderna sem travar o usuário).
   - O script `frontend/js/utils/image-compressor.js` usa a **HTML5 Canvas API** para redimensionar proporcionalmente para no máximo `1080px` e exportar como **WebP (qualidade 85%)** em **~150ms**.
   - Reduz o peso da foto de **5–50 MB para ~100–250 KB** ainda na memória do aparelho.
   - O redesenho em Canvas **descarta automaticamente todas as tags EXIF/GPS**, protegendo a privacidade do tutor.
   - O que trafega pela internet é um arquivo minúsculo de ~150 KB.

2. **Backend (Camada 2 - Segurança e Fast-Path):**
   - O Django recebe a foto em `animais/models.py` e executa `otimizar_imagem_animal()` em `animais/utils.py`.
   - **Fast-Path Inteligente:** Se a imagem já chegou em formato `WEBP`, tamanho $\le$ 1 MB e dimensões $\le$ 1080px, o Django **não reprocessa nem recomprime**, salvando instantaneamente no banco e no disco (economiza 100% de CPU e evita compressão cumulativa).
   - **Slow-Path (Fallback de Segurança):** Se a foto foi enviada via Django Admin, seeder ou API direta sem compressão prévia (ex: JPG de 12 MB), o Pillow entra em ação corrigindo rotação EXIF, redimensionando para 1080px e convertendo para WebP.

---

## 🗺️ Fluxograma da Arquitetura em Dupla Camada

```
[ Usuário seleciona foto de pet (até 50 MB - JPG/PNG/WebP) ]
                            │
                            ▼
      ┌──────────────────────────────────────────────┐
      │  CAMADA 1: Frontend (Canvas API Nativo)       │
      │  frontend/js/utils/image-compressor.js       │
      │  1. Lê arquivo em memória volátil (RAM)      │
      │  2. Descarta metadados EXIF e GPS (LGPD)     │
      │  3. Downscale proporcional (máx. 1080px)     │
      │  4. Converte para WebP (qualidade 85%)       │
      │  5. Redução de 5-50 MB para ~100-250 KB      │
      └──────────────────────┬───────────────────────┘
                            │
              Envia apenas ~150 KB via FormData
              (Upload 10x mais rápido em redes 4G)
                            │
                            ▼
      ┌──────────────────────────────────────────────┐
      │  CAMADA 2: Backend (Django & Pillow)         │
      │  animais/models.py: Animal.save()            │
      │  animais/utils.py: otimizar_imagem_animal()  │
      └──────────────────────┬───────────────────────┘
                            │
             É WebP válido, <= 1MB e <= 1080px?
                     /              \
                   [SIM]           [NÃO]
                    │                │
                    │                ▼
                    │       [ SLOW-PATH: Fallback Pillow ]
                    │       1. Corrige rotação EXIF
                    │       2. Converte cores RGB/RGBA
                    │       3. Redimensiona para 1080px
                    │       4. Converte para WebP
                    │                │
                    ▼                ▼
     [ FAST-PATH: Salva direto ] [ Salva arquivo WebP otimizado ]
                    │                │
                    └────────┬───────┘
                             ▼
         [ Armazena em media/animais/ e grava no Banco ]
```

---

## 🛡️ Segurança, Privacidade e Conformidade LGPD

### 1. Política de Cookies: Zero Impacto
* **Sem uso de Cookies:** A Canvas API é um recurso gráfico nativo do navegador (HTML5). Ela **não** cria, lê ou manipula cookies de navegação.
* **Tudo na Memória Volátil:** O processamento ocorre exclusivamente na memória RAM da aba do navegador via objetos `Image`, `HTMLCanvasElement` e `Blob`. Assim que a requisição é despachada, as referências de memória são destruídas e liberadas pelo Garbage Collector.
* Não há gravação em `localStorage`, `sessionStorage` ou cookies persistentes.

### 2. Proteção de Dados Pessoais (LGPD / Privacidade do Usuário)
* **Remoção de Metadados EXIF e GPS:** Quando alguém tira uma foto pelo smartphone, o sistema operacional embute metadados EXIF no arquivo binário contendo:
  - Coordenadas GPS de latitude e longitude exatas de onde a foto foi tirada (frequentemente dentro da residência do usuário).
  - Modelo do dispositivo, número de série e data/hora precisas.
* Ao carregar a foto no Canvas e redesenhá-la (`ctx.drawImage`), o navegador transfere **apenas os pixels brutos da imagem**. Todos os metadados EXIF/GPS são automaticamente descartados no cliente antes mesmo do arquivo trafegar pela rede, evitando vazamento acidental de localização de protetores e tutores.

### 3. Economia de Franquia Móvel (Impacto Social)
* Plataformas de adoção e resgate animal são frequentemente acessadas por voluntários e ONGs em trânsito com planos de dados móveis pré-pagos. Reduzir o upload de 15 MB para 150 KB economiza 99% da franquia móvel dos usuários.

---

## 🛠️ Implementação Técnica Realizada

### 1. Frontend: Utilitário de Compressão (`frontend/js/utils/image-compressor.js`)
* Criado módulo desacoplado `bbImageCompressor`:
  - `compress(file, options)`: redimensionamento proporcional e compressão WebP nativa.
  - `formatBytes(bytes)`: formatação amigável de tamanhos (KB/MB).

### 2. Frontend: Integração no Formulário (`frontend/pages/animals/index.html` e `animals.js`)
* Limite aumentado de **5 MB para 50 MB** no cliente.
* Tipos aceitos: `.jpg`, `.jpeg`, `.png`, `.webp`.
* **Compressão em segundo plano no evento `change`:** enquanto o usuário preenche nome, raça e descrição do pet, a imagem já é comprimida e o preview mostra a economia real obtida:
  > *Exemplo:* `Foto otimizada: 142.5 KB (-98%) • original: 8.40 MB`
* Garantia no submit do formulário: anexa o arquivo WebP otimizado ao `FormData`.

### 3. Backend: Fast-Path e Validação no Django (`animais/utils.py` e `animais/models.py`)
* `animais/utils.py`:
  - Checa se o arquivo é `WEBP`, tamanho $\le$ 1 MB e dimensões $\le$ 1080px.
  - Se positivo, executa `campo_imagem.seek(0)` e retorna diretamente (sem custo de CPU).
  - Se negativo (ou se veio do Django Admin com JPG/PNG pesado), executa o pipeline do Pillow.
* `animais/models.py`:
  - `FileExtensionValidator`: inclui extensão `webp`.
  - `validar_tamanho_imagem`: limite de retaguarda de 15 MB para uploads manuais pelo Admin.
  - `save()`: processa automaticamente qualquer arquivo novo (`UploadedFile`).

---

## 🧪 Checklist de Testes e Validação

- [x] **Upload de foto de alta resolução (8 MB a 20 MB):**
  - O usuário seleciona foto pesada no modal.
  - O preview atualiza imediatamente exibindo o tamanho reduzido e percentual economizado.
  - O payload `FormData` trafega com menos de 250 KB.
- [x] **Fast-Path no Backend:**
  - O arquivo WebP chega no Django e é salvo instantaneamente sem recompressão.
- [x] **Fallback do Django Admin:**
  - Cadastros feitos pelo painel `/admin/` com arquivos brutos JPG continuam sendo convertidos para WebP pelo Pillow.
- [x] **Privacidade e EXIF:**
  - Fotos de celular têm coordenadas GPS purgadas na conversão Canvas.
