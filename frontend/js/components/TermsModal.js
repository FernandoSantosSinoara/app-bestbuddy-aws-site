/**
 * TermsModal.js - Best Buddy
 * Modal de leitura rápida dos Termos de Uso e Adesão para formulários (evita perda de dados preenchidos)
 */

function bbOpenTermsModal(onAcceptCallback) {
  let modal = document.getElementById("bb-terms-modal");
  if (modal) {
    modal.remove();
  }

  modal = document.createElement("div");
  modal.id = "bb-terms-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.className =
    "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.zIndex = "9999";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.padding = "1rem";
  modal.style.backgroundColor = "rgba(15, 23, 42, 0.65)";
  modal.style.backdropFilter = "blur(4px)";

  modal.innerHTML = `
    <div style="background: #ffffff; width: 100%; max-width: 36rem; border-radius: 1.25rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); overflow: hidden; display: flex; flex-direction: column; max-height: 85vh; border: 1px solid #e2e8f0; font-family: 'Baloo 2', 'Sora', sans-serif;">
      
      <!-- Cabeçalho -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; background: #0c2340; color: #ffffff;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <h3 style="font-size: 1.05rem; font-weight: 700; margin: 0; color: #ffffff;">
            Termos de Uso e Adesão à Adoção
          </h3>
        </div>
        <button id="bb-terms-modal-close" type="button" style="background: transparent; border: none; color: #94a3b8; font-size: 1.25rem; cursor: pointer; padding: 0.25rem 0.5rem; line-height: 1; border-radius: 0.375rem;" title="Fechar">&times;</button>
      </div>

      <!-- Conteúdo com Scroll -->
      <div style="padding: 1.25rem 1.5rem; overflow-y: auto; font-size: 0.8125rem; line-height: 1.6; color: #334155; max-height: 55vh; text-align: justify;">
        <p style="margin-top: 0;">
          Bem-vindo ao <strong>Best Buddy</strong>. Abaixo está o resumo das diretrizes e compromissos legais da nossa comunidade:
        </p>

        <h4 style="font-size: 0.875rem; font-weight: 700; color: #0c2340; margin: 1rem 0 0.25rem 0;">1. Objeto e Caráter Comunitário</h4>
        <p style="margin: 0;">
          O Best Buddy é uma plataforma 100% gratuita voltada exclusivamente para a conexão comunitária entre protetores, tutores e adotantes conscientes. <strong>Não intermediamos pagamentos, não vendemos animais e não realizamos cobrança de taxas de adoção.</strong>
        </p>

        <h4 style="font-size: 0.875rem; font-weight: 700; color: #0c2340; margin: 1rem 0 0.25rem 0;">2. Proibição Expressa de Venda e Fauna Silvestre</h4>
        <p style="margin: 0;">
          É terminantemente proibido utilizar o serviço para comércio de animais, exploração reprodutiva ou divulgação de animais silvestres/exóticos. O anúncio de animais silvestres sem autorização constitui crime ambiental federal (Lei nº 9.605/1998).
        </p>

        <h4 style="font-size: 0.875rem; font-weight: 700; color: #0c2340; margin: 1rem 0 0.25rem 0;">3. Legitimidade e Contato WhatsApp</h4>
        <p style="margin: 0;">
          Ao publicar um pet, você declara sob as penas da lei ser o legítimo tutor ou curador autorizado. Você consente expressamente que seu número de WhatsApp verificado seja exibido no anúncio para viabilizar conversas diretas com interessados.
        </p>

        <h4 style="font-size: 0.875rem; font-weight: 700; color: #0c2340; margin: 1rem 0 0.25rem 0;">4. Proteção da sua Privacidade e Localização</h4>
        <p style="margin: 0;">
          Para a segurança da sua família, as fotos dos animais passam por tratamento para não expor o endereço da sua casa ou dados da câmera. Suas informações nunca são vendidas e servem unicamente para conectar você a adotantes conscientes.
        </p>

        <h4 style="font-size: 0.875rem; font-weight: 700; color: #0c2340; margin: 1rem 0 0.25rem 0;">5. Guarda Responsável</h4>
        <p style="margin: 0;">
          Maus-tratos e abandono são crimes inafiançáveis previstos no Art. 32 da Lei Federal nº 9.605/1998, com as alterações da Lei Sansão nº 14.064/2020.
        </p>

        <div style="margin-top: 1rem; padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; text-align: center;">
          <a href="/pages/legal/terms.html" target="_blank" style="color: #0284c7; font-weight: 700; text-decoration: underline; font-size: 0.75rem;">
            Ler documento completo de Termos de Uso (abrir em nova aba)
          </a>
        </div>
      </div>

      <!-- Rodapé -->
      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; background: #f8fafc;">
        <button id="bb-terms-modal-cancel" type="button" style="padding: 0.5rem 1rem; font-size: 0.8125rem; font-weight: 600; color: #64748b; background: transparent; border: 1px solid #cbd5e1; border-radius: 0.625rem; cursor: pointer;">
          Fechar
        </button>
        <button id="bb-terms-modal-accept" type="button" style="padding: 0.5rem 1.25rem; font-size: 0.8125rem; font-weight: 700; color: #ffffff; background: #0284c7; border: none; border-radius: 0.625rem; cursor: pointer; box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);">
          Li e Compreendi
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = document.getElementById("bb-terms-modal-close");
  const cancelBtn = document.getElementById("bb-terms-modal-cancel");
  const acceptBtn = document.getElementById("bb-terms-modal-accept");

  const closeModal = () => {
    modal.remove();
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      if (typeof onAcceptCallback === "function") {
        onAcceptCallback();
      }
      closeModal();
    });
  }
}
