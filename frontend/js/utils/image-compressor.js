/**
 * Utilitário de Compactação e Otimização de Imagens no Cliente (Canvas API)
 *
 * Pilares de Arquitetura, Performance e Privacidade:
 * 1. Economia de Banda (Upload): Reduz arquivos de até 50 MB para ~100-250 KB
 *    diretamente no navegador do cliente antes do envio HTTP (FormData).
 * 2. Privacidade e LGPD: O redesenho via Canvas descarta automaticamente todos os
 *    metadados EXIF sensíveis gravados por câmeras de smartphones (como coordenadas
 *    GPS de onde a foto foi tirada e identificadores do aparelho).
 * 3. 100% em Memória RAM (Sem Cookies / Sem Storage): Todo o processamento ocorre em
 *    memória volátil via HTML5 Canvas e URL.createObjectURL. Nada é gravado em cookies,
 *    localStorage ou no disco do dispositivo do usuário.
 */

const bbImageCompressor = {
  /**
   * Compacta e redimensiona uma imagem usando HTML5 Canvas nativo.
   *
   * @param {File} file - Arquivo original selecionado pelo usuário.
   * @param {Object} [options] - Parâmetros opcionais de configuração.
   * @param {number} [options.maxDimension=1080] - Limite máximo de largura ou altura em pixels.
   * @param {number} [options.quality=0.85] - Nível de qualidade do WebP (0.0 a 1.0).
   * @param {string} [options.outputType="image/webp"] - MIME type de saída desejado.
   * @returns {Promise<{ file: File, originalSize: number, compressedSize: number, ratioSaved: number }>}
   */
  async compress(file, options = {}) {
    if (!file || !file.type.startsWith("image/")) {
      return {
        file,
        originalSize: file ? file.size : 0,
        compressedSize: file ? file.size : 0,
        ratioSaved: 0,
      };
    }

    const maxDimension = options.maxDimension || 1080;
    const quality = options.quality !== undefined ? options.quality : 0.85;
    const outputType = options.outputType || "image/webp";

    return new Promise((resolve) => {
      const imgUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(imgUrl);

        let { width, height } = img;

        // Se já for WebP, tiver menos de 1 MB e dimensões menores que o teto, não recompacta
        if (
          width <= maxDimension &&
          height <= maxDimension &&
          file.type === "image/webp" &&
          file.size <= 1024 * 1024
        ) {
          return resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            ratioSaved: 0,
          });
        }

        // Downscale proporcional (preserva a proporção exata / aspect ratio)
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback se contexto 2D não estiver disponível
          return resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            ratioSaved: 0,
          });
        }

        // Desenha a imagem redimensionada na superfície limpa do Canvas
        // Isso descarta dados EXIF sensíveis (GPS, dados da câmera)
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                originalSize: file.size,
                compressedSize: file.size,
                ratioSaved: 0,
              });
            }

            const baseName =
              file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const newExtension = outputType === "image/webp" ? ".webp" : ".jpg";
            const newFileName = `${baseName}${newExtension}`;

            const compressedFile = new File([blob], newFileName, {
              type: outputType,
              lastModified: Date.now(),
            });

            const ratioSaved =
              file.size > 0
                ? Math.max(
                    0,
                    Math.round(
                      ((file.size - compressedFile.size) / file.size) * 100
                    )
                  )
                : 0;

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              ratioSaved,
            });
          },
          outputType,
          quality
        );
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(imgUrl);
        console.warn(
          "[ImageCompressor] Falha ao processar imagem no Canvas. Enviando arquivo original como fallback.",
          err
        );
        resolve({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          ratioSaved: 0,
        });
      };

      img.src = imgUrl;
    });
  },

  /**
   * Converte número de bytes em texto formatado humanamente legível.
   * @param {number} bytes
   * @returns {string} Ex: "145.2 KB", "2.10 MB"
   */
  formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  },
};
