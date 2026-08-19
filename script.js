const REVIEWS_INTERVAL_MS = 9000;

const REVIEWS_DATA_BY_LANG = {
  fr: [
    { author: "Clément", rating: 5, text: "Service rapide, portions généreuses et super accueil. Je recommande les wraps.", date: "il y a 2 semaines" },
    { author: "Julie", rating: 5, text: "Très bon snack en centre-ville. Les formules sont claires et le rapport qualité/prix est top.", date: "il y a 1 mois" },
    { author: "Andreas", rating: 4, text: "Burgers bien garnis et desserts gourmands. Pratique pour commander vite.", date: "il y a 3 semaines" },
    { author: "Xavier", rating: 5, text: "J'aime beaucoup l'ambiance et la rapidité de service. Bon plan du quartier.", date: "il y a 1 semaine" }
  ],
  en: [
    { author: "Clément", rating: 5, text: "Fast service, generous portions and a warm welcome. I recommend the wraps.", date: "2 weeks ago" },
    { author: "Julie", rating: 5, text: "A great snack restaurant in the city centre. Clear meal deals and excellent value.", date: "1 month ago" },
    { author: "Andreas", rating: 4, text: "Generously filled burgers and indulgent desserts. Convenient when you want to order quickly.", date: "3 weeks ago" },
    { author: "Xavier", rating: 5, text: "I really like the atmosphere and the fast service. A great neighbourhood spot.", date: "1 week ago" }
  ],
  es: [
    { author: "Clément", rating: 5, text: "Servicio rápido, porciones generosas y una gran acogida. Recomiendo los wraps.", date: "hace 2 semanas" },
    { author: "Julie", rating: 5, text: "Muy buen snack en el centro. Los menús son claros y la relación calidad-precio es excelente.", date: "hace 1 mes" },
    { author: "Andreas", rating: 4, text: "Hamburguesas generosas y postres deliciosos. Muy práctico para pedir rápidamente.", date: "hace 3 semanas" },
    { author: "Xavier", rating: 5, text: "Me gustan mucho el ambiente y la rapidez del servicio. Un buen sitio del barrio.", date: "hace 1 semana" }
  ]
};

const reviewsPageLanguage = (document.documentElement.lang || "fr").toLowerCase();
const reviewsLanguage = reviewsPageLanguage.startsWith("es") ? "es" : reviewsPageLanguage.startsWith("en") ? "en" : "fr";
const REVIEWS_DATA = REVIEWS_DATA_BY_LANG[reviewsLanguage];

(function initMenu() {
  const menu = document.getElementById("siteMenu");
  const toggle = document.querySelector(".menu-toggle");
  const openButtons = document.querySelectorAll(".menu-open-btn");
  const close = document.querySelector(".menu-close");
  if (!menu || !toggle) return;

  const openMenu = () => {
    menu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  };

  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  };

  toggle.addEventListener("click", openMenu);
  openButtons.forEach((button) => {
    button.addEventListener("click", openMenu);
  });
  close?.addEventListener("click", closeMenu);
  menu.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
  menu.addEventListener("click", (event) => {
    if (event.target === menu) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) closeMenu();
  });
})();

(function initReviews() {
  const track = document.getElementById("reviewCarouselTrack");
  if (!track) return;

  document.documentElement.style.setProperty(
    "--reviews-scroll-duration",
    `${Math.max(12000, REVIEWS_INTERVAL_MS * 2) / 1000}s`
  );

  const renderCard = (item) => {
    const stars = "*".repeat(Math.max(0, Math.min(5, item.rating || 0)));
    return `
      <article class="review">
        <p>"${item.text}"</p>
        <div class="review-meta">
          <span>${item.author}</span>
          <span>${stars}</span>
        </div>
        <small>${item.date || ""}</small>
      </article>
    `;
  };

  track.innerHTML = [...REVIEWS_DATA, ...REVIEWS_DATA].map(renderCard).join("");
})();

(function initCategoryCarouselDrag() {
  const viewport = document.querySelector(".category-viewport");
  const track = viewport?.querySelector(".category-scroll");
  if (!viewport || !track) return;

  let pointerId = null;
  let startX = 0;
  let startScrollLeft = 0;
  let hasDragged = false;
  let suppressClick = false;

  const stopDrag = () => {
    pointerId = null;
    viewport.classList.remove("is-dragging");
  };

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;

    pointerId = event.pointerId;
    startX = event.clientX;
    startScrollLeft = viewport.scrollLeft;
    hasDragged = false;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;

    const distance = event.clientX - startX;
    if (Math.abs(distance) > 6) {
      hasDragged = true;
      suppressClick = true;
    }

    viewport.scrollLeft = startScrollLeft - distance;
  });

  viewport.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;
    stopDrag();
  });

  viewport.addEventListener("pointercancel", stopDrag);
  viewport.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    },
    true
  );
})();

(function initMenuExplorer() {
  const explorer = document.querySelector(".menu-explorer");
  if (!explorer) return;

  const buttons = Array.from(explorer.querySelectorAll("[data-menu-filter]"));
  const categories = Array.from(explorer.querySelectorAll("[data-menu-category]"));
  const categoryNav = explorer.querySelector(".menu-category-nav");
  if (!buttons.length || !categories.length) return;

  const categoryIds = new Set(categories.map((category) => category.id));

  const setActiveCategory = (categoryId, options = {}) => {
    if (!categoryIds.has(categoryId)) return;

    buttons.forEach((button) => {
      const isActive = button.dataset.menuFilter === categoryId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.tabIndex = isActive ? 0 : -1;
      if (isActive && categoryNav) {
        const centeredLeft = button.offsetLeft - (categoryNav.clientWidth - button.offsetWidth) / 2;
        categoryNav.scrollTo({ left: centeredLeft, behavior: options.animateNav ? "smooth" : "auto" });
      }
    });

    categories.forEach((category) => {
      const isActive = category.id === categoryId;
      category.hidden = !isActive;
      category.setAttribute("aria-hidden", String(!isActive));
    });

    if (options.updateUrl) {
      window.history.replaceState(null, "", `#${categoryId}`);
    }

    if (options.scrollToMenu) {
      explorer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      setActiveCategory(button.dataset.menuFilter, { updateUrl: true, scrollToMenu: true, animateNav: true });
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + buttons.length) % buttons.length;
      const nextButton = buttons[nextIndex];
      setActiveCategory(nextButton.dataset.menuFilter, { updateUrl: true, animateNav: true });
      nextButton.focus();
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const categoryId = link.getAttribute("href").slice(1);
    if (!categoryIds.has(categoryId)) return;
    link.addEventListener("click", () => setActiveCategory(categoryId));
  });

  const initialCategory = categoryIds.has(window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : buttons[0].dataset.menuFilter;

  setActiveCategory(initialCategory);
})();

(function initProductDetails() {
  const cards = Array.from(document.querySelectorAll(".product-card"));
  if (!cards.length) return;

  const pageLang = document.documentElement.lang || "fr";
  const lang = pageLang.toLowerCase().startsWith("es")
    ? "es"
    : pageLang.toLowerCase().startsWith("en")
      ? "en"
      : "fr";
  const copyByLang = {
    fr: {
      closeLabel: "Fermer le detail",
      defaultPrice: "Prix sur demande",
      defaultDetail: "Pain ou base préparée à la commande, garniture généreuse, sauces au choix selon disponibilité.",
      extrasPrefix: "Extras",
      menuPriceByPage: {
        "tacos.html": "Menu frites + boisson : +4 EUR"
      },
      viewDetails: (title) => `Voir le detail ${title || "du produit"}`
    },
    en: {
      closeLabel: "Close details",
      defaultPrice: "Price on request",
      defaultDetail: "Prepared to order with generous filling and sauces to choose, depending on availability.",
      extrasPrefix: "Extras",
      menuPriceByPage: {
        "tacos.html": "Fries + drink menu: +4 EUR"
      },
      viewDetails: (title) => `View details for ${title || "this product"}`
    },
    es: {
      closeLabel: "Cerrar detalles",
      defaultPrice: "Precio a consultar",
      defaultDetail: "Preparado al momento con relleno generoso y salsas a elegir, segun disponibilidad.",
      extrasPrefix: "Extras",
      menuPriceByPage: {
        "tacos.html": "Menu patatas + bebida: +4 EUR"
      },
      viewDetails: (title) => `Ver detalles de ${title || "este producto"}`
    }
  };
  const copy = copyByLang[lang];
  const menuPriceByPage = {
    "tacos.html": copy.menuPriceByPage["tacos.html"]
  };
  const pageName = window.location.pathname.split("/").pop() || "index.html";
  const menuPrice = menuPriceByPage[pageName];

  cards.forEach((card) => {
    const cardMenuPrice = card.hasAttribute("data-no-menu-price") ? "" : card.dataset.menuPrice || menuPrice;
    if (cardMenuPrice) {
      if (card.querySelector(".menu-price")) return;
      const node = document.createElement("p");
      node.className = "menu-price";
      node.textContent = cardMenuPrice;
      card.appendChild(node);
    }
  });

  const modal = document.createElement("section");
  modal.className = "product-modal";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "productModalTitle");
  modal.innerHTML = `
    <div class="product-modal-backdrop" data-close-product-modal></div>
    <article class="product-modal-card">
      <button class="product-modal-close" type="button" aria-label="${copy.closeLabel}" data-close-product-modal>&times;</button>
      <img class="product-modal-image" alt="" />
      <h2 id="productModalTitle"></h2>
      <p class="product-modal-price"></p>
      <p class="product-modal-detail"></p>
    </article>
  `;
  document.body.appendChild(modal);

  const image = modal.querySelector(".product-modal-image");
  const title = modal.querySelector("#productModalTitle");
  const price = modal.querySelector(".product-modal-price");
  const detail = modal.querySelector(".product-modal-detail");

  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  const openModal = (card) => {
    const cardImage = card.querySelector("img");
    const cardTitle = card.querySelector("h2, h4");
    const cardPrice = card.hasAttribute("data-no-price") ? null : card.querySelector("p");

    if (!cardTitle) return;
    title.textContent = cardTitle.textContent.trim();
    price.textContent = cardPrice ? cardPrice.textContent.trim() : card.hasAttribute("data-no-price") ? "" : copy.defaultPrice;
    price.hidden = !price.textContent;
    const menuText = card.querySelector(".menu-price")?.textContent.trim();
    const detailText = card.dataset.detail?.trim();
    const extrasText = card.dataset.extras?.trim();
    const detailItems = [];

    if (menuText) detailItems.push(menuText);
    if (detailText) detailItems.push(detailText);
    if (extrasText) detailItems.push(`${copy.extrasPrefix} : ${extrasText}`);

    detail.textContent = detailItems.length
      ? detailItems.join("\n")
      : copy.defaultDetail;

    if (cardImage) {
      image.src = cardImage.getAttribute("src");
      image.alt = cardImage.getAttribute("alt") || cardTitle.textContent.trim();
      image.hidden = false;
    } else {
      image.hidden = true;
    }

    modal.hidden = false;
    document.body.classList.add("modal-open");
  };

  cards.forEach((card) => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", copy.viewDetails(card.querySelector("h2, h4")?.textContent.trim()));
    card.addEventListener("click", () => openModal(card));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openModal(card);
    });
  });

  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-product-modal]")) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
})();
