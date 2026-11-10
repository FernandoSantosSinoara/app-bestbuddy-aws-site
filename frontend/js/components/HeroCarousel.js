/**
 * Renderiza o banner rotativo (hero carousel) da Home, com slides que
 * anunciam as páginas de Comunidade, Animais e Adoção.
 */
function bbRenderHeroCarousel(targetSelector) {
  const slides = [
    {
      img: "../../assets/images/cachorroDeLado.jpg",
      alt: "Cachorro de perfil - Pets Desaparecidos Best Buddy",
      title: "Ajude a reencontrar pets perdidos!",
      desc: "Encontrou um animalzinho ou perdeu seu companheiro? Conecte-se diretamente com a família.",
      cta: "Ver pets perdidos",
      href: "/pages/animals/index.html#bb-lost-section",
    },
    {
      img: "../../assets/images/cachorroComABocaAberta.jpg",
      alt: "Cachorro feliz com a boca aberta - Animais disponíveis",
      title: "Conheça nossos animais",
      desc: "Veja os bichinhos que estão esperando por um novo lar cheio de carinho.",
      cta: "Ver animais",
      href: "/pages/animals/index.html",
    },
    {
      img: "../../assets/images/cachorroCoberto.jpg",
      alt: "Cachorro enrolado em cobertor - Adote um animal",
      title: "Adote animais aqui!",
      desc: "Dê uma segunda chance a quem mais precisa. Conheça nossos pets disponíveis para adoção.",
      cta: "Quero adotar",
      href: "/pages/animals/index.html",
    },
  ];

  const el = document.querySelector(targetSelector);
  if (!el) return;

  el.innerHTML = `
    <div class="bb-hero" id="bb-hero-carousel">
      <div class="bb-hero__track">
        ${slides
      .map(
        (slide, i) => `
          <div class="bb-hero__slide${i === 0 ? " is-active" : ""}" data-index="${i}">
            <img class="bb-hero__img" src="${slide.img}" alt="${slide.alt}" />
            <div class="bb-hero__overlay" aria-hidden="true"></div>
            <div class="bb-hero__content">
              <h2 class="bb-hero__title">${slide.title}</h2>
              <p class="bb-hero__desc">${slide.desc}</p>
              <a class="bb-btn bb-btn--primary" href="${slide.href}">${slide.cta}</a>
            </div>
          </div>`
      )
      .join("")}
      </div>

      <button class="bb-hero__arrow bb-hero__arrow--prev" type="button" aria-label="Slide anterior">&lsaquo;</button>
      <button class="bb-hero__arrow bb-hero__arrow--next" type="button" aria-label="Próximo slide">&rsaquo;</button>

      <div class="bb-hero__dots">
        ${slides
      .map(
        (_, i) => `<button class="bb-hero__dot${i === 0 ? " is-active" : ""}" type="button" data-index="${i}" aria-label="Ir para slide ${i + 1}"></button>`
      )
      .join("")}
      </div>
    </div>
  `;

  const root = document.getElementById("bb-hero-carousel");
  const slideEls = root.querySelectorAll(".bb-hero__slide");
  const dotEls = root.querySelectorAll(".bb-hero__dot");
  let current = 0;
  let timer = null;

  function goTo(index) {
    const total = slideEls.length;
    current = (index + total) % total;
    slideEls.forEach((slideEl, i) => slideEl.classList.toggle("is-active", i === current));
    dotEls.forEach((dotEl, i) => dotEl.classList.toggle("is-active", i === current));
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, 5000);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
  }

  root.querySelector(".bb-hero__arrow--next").addEventListener("click", () => {
    next();
    startAuto();
  });

  root.querySelector(".bb-hero__arrow--prev").addEventListener("click", () => {
    prev();
    startAuto();
  });

  dotEls.forEach((dotEl) => {
    dotEl.addEventListener("click", () => {
      goTo(Number(dotEl.dataset.index));
      startAuto();
    });
  });

  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  startAuto();
}
