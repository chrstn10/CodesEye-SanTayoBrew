// ===== SHARED =====

// localStorage key for the cart (array of items, each with a "qty")
const CART_STORAGE_KEY = "stbCart";

// Must match the 768px breakpoint in style.css
const DESKTOP_BREAKPOINT = 768;

// Respect the visitor's "reduce motion" setting for JS scrolling
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reads the cart from localStorage; always returns an array, even if storage is blocked or broken
function getCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    return Array.isArray(savedCart) ? savedCart : [];
  } catch (error) {
    return [];
  }
}

// Saves the cart to localStorage and refreshes the navbar badge; returns false if storage is unavailable
function saveCart(cart) {
  let isSaved = true;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    // Storage can be unavailable (e.g. private mode); the page still works
    isSaved = false;
  }
  updateCartBadge();
  return isSaved;
}

// Escapes text before it is placed inside innerHTML
function escapeHTML(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Formats a number as a price, e.g. 139 -> "PHP 139.00"
function formatPrice(amount) {
  const formattedAmount = Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return "PHP " + formattedAmount;
}

// Feature 2: shows the total cart quantity on the navbar badge (hidden when the cart is empty)
function updateCartBadge() {
  const cartBadge = document.getElementById("cartCount");
  const cartLink = document.getElementById("cartLink");

  if (!cartBadge) {
    return;
  }

  let totalQuantity = 0;

  try {
    const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

    if (Array.isArray(cart)) {
      for (let i = 0; i < cart.length; i++) {
        const itemQuantity = parseInt(cart[i] && cart[i].qty, 10);
        if (itemQuantity > 0) {
          totalQuantity += itemQuantity;
        }
      }
    }
  } catch (error) {
    // Broken or blocked storage: treat the cart as empty instead of crashing
    totalQuantity = 0;
  }

  cartBadge.textContent = totalQuantity > 99 ? "99+" : String(totalQuantity);

  if (totalQuantity === 0) {
    cartBadge.classList.add("is-hidden");
  } else {
    cartBadge.classList.remove("is-hidden");
  }

  if (cartLink) {
    const itemWord = totalQuantity === 1 ? "item" : "items";
    cartLink.setAttribute("aria-label", "View cart, " + totalQuantity + " " + itemWord);
  }
}

// Feature 1: opens/closes the mobile nav links and swaps the icon (☰ / ✕)
function toggleMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (!hamburgerBtn || !navLinks) {
    return;
  }

  const isOpen = navLinks.classList.toggle("is-open");

  hamburgerBtn.textContent = isOpen ? "✕" : "☰"; // ✕ or ☰
  hamburgerBtn.setAttribute("aria-expanded", String(isOpen));
  hamburgerBtn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

// Closes the mobile menu if it is open (used when resizing to desktop)
function closeMobileMenu() {
  const navLinks = document.getElementById("navLinks");

  if (navLinks && navLinks.classList.contains("is-open")) {
    toggleMobileMenu();
  }
}

// Page transition: must match the pageLeave animation length in style.css
const PAGE_LEAVE_MS = 250;

// Page transition: fades the page out before following a link to another page
function handlePageLinkClick(event) {
  const link = event.target.closest("a[href]");

  // Skip clicks already handled elsewhere (e.g. "< Back"), new-tab clicks, and non-left clicks
  if (!link || event.defaultPrevented || event.button !== 0 ||
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
      link.target === "_blank" || link.hasAttribute("download")) {
    return;
  }

  const url = new URL(link.href, window.location.href);

  // Only our own pages (no mailto:, other sites, or #jumps on the same page)
  if (url.origin !== window.location.origin ||
      (url.pathname === window.location.pathname && url.hash !== "")) {
    return;
  }

  if (prefersReducedMotion) {
    return;
  }

  event.preventDefault();
  document.body.classList.add("is-leaving");
  setTimeout(function () {
    window.location.href = url.href;
  }, PAGE_LEAVE_MS);
}

// Sets up the features that appear on every page
function initSharedFeatures() {
  // Any click on the page: fade out before following links to our other pages
  document.onclick = handlePageLinkClick;

  // Back/Forward cache restore: show the page again (addEventListener, since Menu and Cart set window.onpageshow)
  window.addEventListener("pageshow", function () {
    document.body.classList.remove("is-leaving");
  });

  const hamburgerBtn = document.getElementById("hamburgerBtn");

  // Hamburger click: open/close the mobile menu
  if (hamburgerBtn) {
    hamburgerBtn.onclick = toggleMobileMenu;
  }

  // Window resize: close the mobile-only dropdown once the window reaches desktop size
  window.onresize = function () {
    if (window.innerWidth >= DESKTOP_BREAKPOINT) {
      closeMobileMenu();
    }
  };

  // Storage change in another tab: keep the cart badge in sync
  window.onstorage = function (event) {
    if (event.key === CART_STORAGE_KEY || event.key === null) {
      updateCartBadge();
    }
  };

  updateCartBadge();
}


// ===== HOME =====

// Feature 3: brown border, yellow glow, slight scale, and the yellow description panel
function highlightCard(card) {
  card.style.borderColor = "#5D2705";
  card.style.boxShadow = "0 0 0 4px rgba(255, 222, 89, 0.9), 0 14px 28px rgba(93, 39, 5, 0.25)";
  card.style.transform = "scale(1.04)";
  card.classList.add("is-open");
}

// Feature 3: restores the card to its CSS default look
function resetCard(card) {
  card.style.borderColor = "";
  card.style.boxShadow = "";
  card.style.transform = "";
  card.classList.remove("is-open");
}

// Feature 4: reveals the promo code inside the banner and restyles it
function showPromoCode() {
  const promoBanner = document.getElementById("promoBanner");

  if (!promoBanner) {
    return;
  }

  promoBanner.innerHTML = `
    <div class="promo-banner__content">
      <h2 class="promo-banner__title" id="promoTitle">Your treat is ready, brew!</h2>
      <p class="promo-banner__code">Use code <strong>KAPE10</strong> for 10% off!</p>
      <p class="promo-banner__text">Enter it at checkout on your first order. Enjoy every sip!</p>
    </div>
  `;

  // Coupon look: dashed yellow border and a little more breathing room
  promoBanner.style.border = "4px dashed #FFDE59";
  promoBanner.style.paddingTop = "4.5rem";
  promoBanner.style.paddingBottom = "4.5rem";

  // The button was removed, so move keyboard focus to the banner itself
  promoBanner.setAttribute("tabindex", "-1");
  promoBanner.focus({ preventScroll: true });
}

// Returns the index of the review slide closest to the current scroll position
function getCurrentReviewIndex(track, slides) {
  let closestIndex = 0;
  let smallestDistance = Infinity;

  for (let i = 0; i < slides.length; i++) {
    const distance = Math.abs(slides[i].offsetLeft - track.scrollLeft);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

// Marks the matching pagination dot as active
function setActiveReviewDot(activeIndex) {
  const reviewDots = document.getElementsByClassName("reviews__dot");

  for (let i = 0; i < reviewDots.length; i++) {
    const isActive = i === activeIndex;
    reviewDots[i].classList.toggle("is-active", isActive);
    reviewDots[i].setAttribute("aria-current", String(isActive));
  }
}

// Scrolls the review carousel to a specific slide
function goToReview(index) {
  const reviewsTrack = document.getElementById("reviewsTrack");

  if (!reviewsTrack) {
    return;
  }

  const reviewSlides = reviewsTrack.getElementsByClassName("review");

  if (!reviewSlides[index]) {
    return;
  }

  reviewsTrack.scrollTo({
    left: reviewSlides[index].offsetLeft,
    behavior: prefersReducedMotion ? "auto" : "smooth"
  });

  setActiveReviewDot(index);
}

// Feature 5: shows the next review (wraps back to the first after the last)
function nextReview() {
  const reviewsTrack = document.getElementById("reviewsTrack");

  if (!reviewsTrack) {
    return;
  }

  const reviewSlides = reviewsTrack.getElementsByClassName("review");

  if (reviewSlides.length === 0) {
    return;
  }

  const currentIndex = getCurrentReviewIndex(reviewsTrack, reviewSlides);
  const nextIndex = (currentIndex + 1) % reviewSlides.length;

  goToReview(nextIndex);
}

// Sets up the Home page features (skipped on other pages)
function initHomePage() {
  // Feature 3: hover effect, only on the best-seller cards
  const bestSellerCards = document.querySelectorAll("#bestSellers .product-card");

  for (let i = 0; i < bestSellerCards.length; i++) {
    const card = bestSellerCards[i];

    // Mouse enters a best-seller card: highlight it and show its description
    card.onmouseover = function () {
      highlightCard(card);
    };

    // Mouse leaves the card: back to normal
    card.onmouseout = function (event) {
      // Ignore moves between elements inside the same card
      if (event.relatedTarget && card.contains(event.relatedTarget)) {
        return;
      }
      resetCard(card);
    };
  }

  // Feature 4: "Claim Offer" click reveals the promo code
  const claimOfferBtn = document.getElementById("claimOfferBtn");

  if (claimOfferBtn) {
    claimOfferBtn.onclick = showPromoCode;
  }

  // Feature 5: review carousel (arrow, dots, and swipe tracking)
  const reviewsTrack = document.getElementById("reviewsTrack");
  const reviewNextBtn = document.getElementById("reviewNextBtn");
  const reviewDots = document.getElementsByClassName("reviews__dot");

  if (reviewsTrack && reviewNextBtn) {
    // Next arrow click: show the next review
    reviewNextBtn.onclick = nextReview;

    // Dot click: jump to that review
    for (let i = 0; i < reviewDots.length; i++) {
      const dotIndex = i;
      reviewDots[i].onclick = function () {
        goToReview(dotIndex);
      };
    }

    // Carousel scroll: update the dots after a swipe settles (debounced so they don't flicker)
    let scrollTimer = null;
    reviewsTrack.onscroll = function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        const reviewSlides = reviewsTrack.getElementsByClassName("review");
        setActiveReviewDot(getCurrentReviewIndex(reviewsTrack, reviewSlides));
      }, 100);
    };
  }
}


// ===== ABOUT =====

// Feature 6: enlarges an About photo with a yellow border and shadow
function zoomAboutImage(image) {
  image.style.transform = "scale(1.05)";
  image.style.borderColor = "#FFDE59";
  image.style.boxShadow = "0 18px 36px rgba(93, 39, 5, 0.35)";
}

// Feature 6: restores the About photo to its CSS default look
function resetAboutImage(image) {
  image.style.transform = "";
  image.style.borderColor = "";
  image.style.boxShadow = "";
}

// Sets up the About Us page features (skipped on other pages)
function initAboutPage() {
  // Feature 6: hover zoom on the three About section photos (not the hero)
  const aboutImages = document.getElementsByClassName("about-feature__img");

  for (let i = 0; i < aboutImages.length; i++) {
    const image = aboutImages[i];

    // Mouse enters a photo: zoom it with a yellow border
    image.onmouseover = function () {
      zoomAboutImage(image);
    };

    // Mouse leaves the photo: back to normal
    image.onmouseout = function () {
      resetAboutImage(image);
    };
  }
}


// ===== MENU (Stage 2) =====

// Pop-up option groups, listed from more to less (the first choice is the default unless one is given)
const SERVING_OPTIONS = ["Iced", "Hot"];
const SUGAR_OPTIONS = ["More Sugar", "Less Sugar", "No Sugar"];
const ICE_OPTIONS = ["More Ice", "Standard", "Less Ice"];

// Sugar Level stays preselected on "Less Sugar" (as in the Figma), even though it's listed second
const DEFAULT_SUGAR = "Less Sugar";

// Placeholder text for the pop-up's "Special Instructions" box
const BEVERAGE_NOTE_PLACEHOLDER = "e.g.: no straw, extra hot, etc.";
const FOOD_NOTE_PLACEHOLDER = "e.g.: no onions, more sauce, extra mayo, etc.";

// Highest quantity allowed for one cart line
const MAX_ITEM_QTY = 99;

// Must match the 1024px sidebar breakpoint in style.css
const MENU_SIDEBAR_BREAKPOINT = 1024;

// true = mouse (panels open on hover), false = touch screen (panels open on tap)
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Menu page state
let openMenuCard = null;       // card whose yellow panel is showing
let activeCategory = "all";    // current sidebar filter
let modalItem = null;          // item shown in the pop-up
let modalQty = 1;              // quantity in the pop-up
let modalSourceCard = null;    // card that opened the pop-up (focus returns to it)
let backdropPressed = false;   // true when a click started on the dim backdrop
let toastTimer = null;         // hides the "Added to cart" toast

// Turns "Classic:79,Cajun:89" into [{ flavor: "Classic", price: 79 }, ...]
function parseFlavorPrices(pricesText) {
  const flavorPrices = [];

  if (!pricesText) {
    return flavorPrices;
  }

  const pairs = pricesText.split(",");
  for (let i = 0; i < pairs.length; i++) {
    const parts = pairs[i].split(":");
    flavorPrices.push({ flavor: parts[0].trim(), price: Number(parts[1]) || 0 });
  }

  return flavorPrices;
}

// Reads a menu card's data attributes into a plain object
function getMenuItemData(card) {
  const data = card.dataset;
  const flavorPrices = parseFlavorPrices(data.prices);

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    category: data.category,
    image: data.image,
    description: data.description || "",
    flavorPrices: flavorPrices,
    // Flavor items start at their first (Classic) price
    price: flavorPrices.length > 0 ? flavorPrices[0].price : Number(data.price) || 0
  };
}

// Returns the price of one flavor (e.g. "Cajun") for a flavor item
function getFlavorPrice(item, flavor) {
  for (let i = 0; i < item.flavorPrices.length; i++) {
    if (item.flavorPrices[i].flavor === flavor) {
      return item.flavorPrices[i].price;
    }
  }
  return item.price;
}

// "Iced Americano" -> "Americano" (used when Serving Type is offered)
function getBaseDrinkName(name) {
  return name.replace(/^Iced\s+/, "");
}

// Options object saved with every cart line (unused options stay null)
function createEmptyOptions() {
  return { serving: null, sugar: null, ice: null, flavor: null };
}


// ----- Feature 1: hover/tap yellow panel -----

// Fades a card into its yellow panel (only one panel open at a time)
function showItemPanel(card) {
  if (openMenuCard && openMenuCard !== card) {
    hideItemPanel(openMenuCard);
  }
  card.classList.add("is-open");
  openMenuCard = card;
}

// Fades the yellow panel back to the resting card
function hideItemPanel(card) {
  card.classList.remove("is-open");
  if (openMenuCard === card) {
    openMenuCard = null;
  }
}

// Used for taps (touch screens) and Enter/Space (keyboard)
function toggleItemPanel(card) {
  if (card.classList.contains("is-open")) {
    hideItemPanel(card);
  } else {
    showItemPanel(card);
  }
}

// The panel button: remove if already in the cart, otherwise add
function handleCardButton(card) {
  const item = getMenuItemData(card);

  if (isItemInCart(item.id)) {
    removeFromCart(item.id);
    return;
  }

  // Add-ons skip the pop-up and go straight to the cart (qty 1)
  if (item.type === "addon") {
    addToCart({
      id: item.id,
      name: item.name,
      image: item.image,
      unitPrice: item.price,
      qty: 1,
      options: createEmptyOptions(),
      note: ""
    });
    return;
  }

  openAddModal(card);
}


// ----- Feature 2: add-to-cart pop-up -----

// Builds one option group (e.g. Sugar Level) with defaultChoice selected (or the first choice if none is given)
function buildOptionGroup(optionKey, label, choices, columnsClass, defaultChoice) {
  let buttonsHTML = "";

  for (let i = 0; i < choices.length; i++) {
    const isSelected = defaultChoice ? choices[i] === defaultChoice : i === 0;
    const choice = escapeHTML(choices[i]);
    buttonsHTML += `
        <button class="option-btn${isSelected ? " is-selected" : ""}" type="button" data-value="${choice}" aria-pressed="${isSelected}">${choice}</button>`;
  }

  return `
    <fieldset class="option-group" data-option="${optionKey}">
      <legend class="option-group__label">${label}</legend>
      <div class="option-group__choices ${columnsClass}">${buttonsHTML}
      </div>
    </fieldset>`;
}

// Picks the option groups for an item based on its data-type
function buildOptionGroupsHTML(item) {
  let groupsHTML = "";

  if (item.type === "beverage") {
    groupsHTML += buildOptionGroup("serving", "Serving Type", SERVING_OPTIONS, "option-group__choices--2");
    groupsHTML += buildOptionGroup("sugar", "Sugar Level", SUGAR_OPTIONS, "option-group__choices--3", DEFAULT_SUGAR);
    groupsHTML += buildOptionGroup("ice", "Ice Amount", ICE_OPTIONS, "option-group__choices--3");
  } else if (item.type === "frappe") {
    groupsHTML += buildOptionGroup("sugar", "Sugar Level", SUGAR_OPTIONS, "option-group__choices--3", DEFAULT_SUGAR);
  }

  // Onion Rings, French Fries and Nachos
  if (item.flavorPrices.length > 0) {
    const flavors = [];
    for (let i = 0; i < item.flavorPrices.length; i++) {
      flavors.push(item.flavorPrices[i].flavor);
    }
    groupsHTML += buildOptionGroup("flavor", "Flavor", flavors, "option-group__choices--4");
  }

  return groupsHTML;
}

// Fills the shared pop-up from a card's data attributes and opens it
function openAddModal(card) {
  const addModal = document.getElementById("addModal");
  const modalContent = document.getElementById("modalContent");
  const modalDialog = document.getElementById("modalDialog");

  if (!addModal || !modalContent) {
    return;
  }

  const item = getMenuItemData(card);
  const hasServingType = item.type === "beverage";
  const isDrink = item.type === "beverage" || item.type === "frappe";
  const displayName = hasServingType ? getBaseDrinkName(item.name) : item.name;
  const descriptionHTML = item.description
    ? `<p class="modal__desc">${escapeHTML(item.description)}</p>`
    : "";

  modalItem = item;
  modalQty = 1;
  modalSourceCard = card;

  modalContent.innerHTML = `
    <div class="modal__top">
      <div class="modal__media">
        <img class="modal__img" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">
      </div>
      <div class="modal__info">
        <h2 class="modal__title" id="modalTitle">${escapeHTML(displayName)}</h2>
        ${descriptionHTML}
        <p class="modal__price" id="modalPrice">${formatPrice(item.price)}</p>
      </div>
    </div>
    ${buildOptionGroupsHTML(item)}
    <div class="modal__field">
      <label class="modal__label" for="modalNote">Special Instructions</label>
      <textarea class="modal__note" id="modalNote" rows="3" maxlength="200" placeholder="${isDrink ? BEVERAGE_NOTE_PLACEHOLDER : FOOD_NOTE_PLACEHOLDER}"></textarea>
    </div>
    <div class="modal__actions">
      <div class="qty-stepper" role="group" aria-label="Quantity">
        <button class="qty-stepper__btn" id="qtyMinusBtn" type="button" data-qty-change="-1" aria-label="Decrease quantity" disabled>&minus;</button>
        <span class="qty-stepper__value" id="modalQty" aria-live="polite">1</span>
        <button class="qty-stepper__btn" id="qtyPlusBtn" type="button" data-qty-change="1" aria-label="Increase quantity">+</button>
      </div>
      <button class="modal__add-btn" id="modalAddBtn" type="button">Add to Cart</button>
    </div>
  `;

  addModal.classList.add("is-open");
  addModal.scrollTop = 0;
  document.body.classList.add("modal-open");

  if (modalDialog) {
    modalDialog.focus({ preventScroll: true });
  }
}

// Closes the pop-up and returns keyboard focus to the card
function closeAddModal() {
  const addModal = document.getElementById("addModal");

  if (!addModal || !addModal.classList.contains("is-open")) {
    return;
  }

  addModal.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  modalItem = null;

  if (modalSourceCard) {
    modalSourceCard.focus({ preventScroll: true });
    modalSourceCard = null;
  }
}

// One delegated click handler for everything built inside the pop-up
function handleModalClick(event) {
  const optionButton = event.target.closest(".option-btn");
  if (optionButton) {
    selectOption(optionButton);
    return;
  }

  const qtyButton = event.target.closest(".qty-stepper__btn");
  if (qtyButton) {
    changeModalQty(Number(qtyButton.dataset.qtyChange));
    return;
  }

  if (event.target.closest("#modalAddBtn")) {
    addFromModal();
  }
}


// ----- Feature 3: option buttons -----

// Moves the "selected" style within one group and applies its side effects
function selectOption(optionButton) {
  const optionGroup = optionButton.closest(".option-group");

  if (!optionGroup) {
    return;
  }

  const groupButtons = optionGroup.getElementsByClassName("option-btn");
  for (let i = 0; i < groupButtons.length; i++) {
    groupButtons[i].classList.remove("is-selected");
    groupButtons[i].setAttribute("aria-pressed", "false");
  }
  optionButton.classList.add("is-selected");
  optionButton.setAttribute("aria-pressed", "true");

  const optionKey = optionGroup.dataset.option;
  const optionValue = optionButton.dataset.value;

  // Hot drinks don't need an Ice Amount
  if (optionKey === "serving") {
    const iceGroup = document.querySelector('#modalContent .option-group[data-option="ice"]');
    if (iceGroup) {
      iceGroup.style.display = optionValue === "Hot" ? "none" : "";
    }
  }

  // Flavors have different prices
  if (optionKey === "flavor" && modalItem) {
    const modalPrice = document.getElementById("modalPrice");
    if (modalPrice) {
      modalPrice.textContent = formatPrice(getFlavorPrice(modalItem, optionValue));
    }
  }
}

// Returns the selected value of an option group, or null if it isn't shown
function getSelectedOption(optionKey) {
  const optionGroup = document.querySelector('#modalContent .option-group[data-option="' + optionKey + '"]');

  if (!optionGroup || optionGroup.style.display === "none") {
    return null;
  }

  const selectedButton = optionGroup.querySelector(".option-btn.is-selected");
  return selectedButton ? selectedButton.dataset.value : null;
}


// ----- Feature 4: quantity stepper -----

// Changes the pop-up quantity by +1 or -1 (stays between 1 and 99)
function changeModalQty(change) {
  modalQty = Math.min(MAX_ITEM_QTY, Math.max(1, modalQty + change));

  const qtyValue = document.getElementById("modalQty");
  const qtyMinusBtn = document.getElementById("qtyMinusBtn");
  const qtyPlusBtn = document.getElementById("qtyPlusBtn");

  if (qtyValue) {
    qtyValue.textContent = String(modalQty);
  }
  if (qtyMinusBtn) {
    qtyMinusBtn.disabled = modalQty <= 1;
  }
  if (qtyPlusBtn) {
    qtyPlusBtn.disabled = modalQty >= MAX_ITEM_QTY;
  }
}


// ----- Feature 5: cart (add / remove) -----

// Builds a cart line from the pop-up's current choices and adds it
function addFromModal() {
  if (!modalItem) {
    return;
  }

  const options = createEmptyOptions();
  options.serving = getSelectedOption("serving");
  options.sugar = getSelectedOption("sugar");
  options.ice = getSelectedOption("ice");      // null when Hot hides the group
  options.flavor = getSelectedOption("flavor");

  const noteField = document.getElementById("modalNote");
  const note = noteField ? noteField.value.trim() : "";

  const cartLine = {
    id: modalItem.id,
    // e.g. "Hot" + "Americano" -> "Hot Americano"
    name: options.serving ? options.serving + " " + getBaseDrinkName(modalItem.name) : modalItem.name,
    image: modalItem.image,
    unitPrice: options.flavor ? getFlavorPrice(modalItem, options.flavor) : modalItem.price,
    qty: modalQty,
    options: options,
    note: note
  };

  closeAddModal();
  addToCart(cartLine);
}

// True if two cart lines have the same options
function haveSameOptions(optionsA, optionsB) {
  const keys = ["serving", "sugar", "ice", "flavor"];
  const a = optionsA || {};
  const b = optionsB || {};

  for (let i = 0; i < keys.length; i++) {
    if ((a[keys[i]] || null) !== (b[keys[i]] || null)) {
      return false;
    }
  }
  return true;
}

// True if any cart line is this menu item
function isItemInCart(itemId) {
  const cart = getCart();
  for (let i = 0; i < cart.length; i++) {
    if (cart[i] && cart[i].id === itemId) {
      return true;
    }
  }
  return false;
}

// Saves a line to the cart (identical lines are merged by adding their qty)
function addToCart(newLine) {
  const cart = getCart();
  let matchingLine = null;

  for (let i = 0; i < cart.length; i++) {
    const line = cart[i];
    if (line && line.id === newLine.id &&
        haveSameOptions(line.options, newLine.options) &&
        (line.note || "") === newLine.note) {
      matchingLine = line;
      break;
    }
  }

  if (matchingLine) {
    const currentQty = parseInt(matchingLine.qty, 10) || 0;
    matchingLine.qty = Math.min(MAX_ITEM_QTY, currentQty + newLine.qty);
  } else {
    cart.push(newLine);
  }

  const isSaved = saveCart(cart);   // also updates the navbar badge
  refreshMenuCardButtons();
  showToast(isSaved ? "Added to cart ✓" : "Sorry, bro, your cart couldn't be saved.");
}

// Removes every cart line of this menu item
function removeFromCart(itemId) {
  const cart = getCart();
  const remainingLines = [];

  for (let i = 0; i < cart.length; i++) {
    if (cart[i] && cart[i].id !== itemId) {
      remainingLines.push(cart[i]);
    }
  }

  const isSaved = saveCart(remainingLines);
  refreshMenuCardButtons();
  showToast(isSaved ? "Removed from cart" : "Sorry, bro, your cart couldn't be saved.");
}

// Sets each panel button to "Add to Cart" or "Remove from Cart"
function refreshMenuCardButtons() {
  const cart = getCart();
  const idsInCart = [];

  for (let i = 0; i < cart.length; i++) {
    if (cart[i] && cart[i].id) {
      idsInCart.push(cart[i].id);
    }
  }

  const menuCards = document.getElementsByClassName("menu-card");
  for (let i = 0; i < menuCards.length; i++) {
    const card = menuCards[i];
    const cardButton = card.querySelector(".menu-card__btn");

    if (!cardButton) {
      continue;
    }

    const isInCart = idsInCart.indexOf(card.dataset.id) !== -1;
    cardButton.textContent = isInCart ? "Remove from Cart" : "Add to Cart";
    cardButton.classList.toggle("is-in-cart", isInCart);
    cardButton.setAttribute(
      "aria-label",
      isInCart ? "Remove " + card.dataset.name + " from cart" : "Add " + card.dataset.name + " to cart"
    );
  }
}

// Shows the yellow toast for about 2 seconds
function showToast(message) {
  const toast = document.getElementById("cartToast");

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 2000);
}


// ----- Features 6 + 7: category filter and search -----

// True if a card belongs to the chosen category ("beverages" = coffee + non-coffee)
function cardMatchesCategory(card, category) {
  if (category === "all") {
    return true;
  }
  if (category === "beverages") {
    return card.dataset.group === "beverages";
  }
  return card.dataset.category === category;
}

// Shows only the cards that match the active category AND the search text
function applyMenuFilters() {
  const menuCards = document.getElementsByClassName("menu-card");
  const menuSearch = document.getElementById("menuSearch");
  const menuEmpty = document.getElementById("menuEmpty");
  const searchText = menuSearch ? menuSearch.value.trim() : "";
  const query = searchText.toLowerCase();
  let visibleCount = 0;

  for (let i = 0; i < menuCards.length; i++) {
    const card = menuCards[i];
    const matchesSearch = query === "" || card.dataset.name.toLowerCase().indexOf(query) !== -1;
    const isVisible = cardMatchesCategory(card, activeCategory) && matchesSearch;

    card.style.display = isVisible ? "" : "none";

    if (isVisible) {
      visibleCount++;
    } else if (card === openMenuCard) {
      hideItemPanel(card);
    }
  }

  updateResultCount(visibleCount, searchText);

  // Start the scrollable grid from the top after every filter/search
  const menuGrid = document.getElementById("menuGrid");
  if (menuGrid) {
    menuGrid.scrollTop = 0;
  }

  if (menuEmpty) {
    menuEmpty.style.display = visibleCount === 0 ? "block" : "none";
  }
}

// Writes e.g. "Showing 11 items in Coffee for "latte"" into #resultCount
function updateResultCount(count, searchText) {
  const resultCount = document.getElementById("resultCount");

  if (!resultCount) {
    return;
  }

  const activeButton = document.querySelector(".category-btn.is-active");
  const categoryLabel = activeButton ? activeButton.textContent : "All Items";
  let countHTML = count === 0
    ? "No items found"
    : "Showing <strong>" + count + "</strong> " + (count === 1 ? "item" : "items");

  if (activeCategory !== "all") {
    countHTML += " in <strong>" + escapeHTML(categoryLabel) + "</strong>";
  }
  if (searchText !== "") {
    countHTML += " for &ldquo;" + escapeHTML(searchText) + "&rdquo;";
  }

  resultCount.innerHTML = countHTML;
}

// Feature 6: sets the active yellow pill and filters the cards
function filterByCategory(category) {
  activeCategory = category;

  const categoryButtons = document.getElementsByClassName("category-btn");
  for (let i = 0; i < categoryButtons.length; i++) {
    const isActive = categoryButtons[i].dataset.filter === category;
    categoryButtons[i].classList.toggle("is-active", isActive);
    categoryButtons[i].setAttribute("aria-pressed", String(isActive));
  }

  applyMenuFilters();
}

// Feature 7: filters as the visitor types
function searchMenu() {
  applyMenuFilters();
}

// Feature 7: highlight the search box while it has focus
function highlightSearchBox() {
  const searchBox = document.getElementById("menuSearchBox");
  if (searchBox) {
    searchBox.style.borderColor = "#B8500F";
    searchBox.style.boxShadow = "0 0 0 4px rgba(255, 222, 89, 0.9)";
  }
}

// Feature 7: restore the search box when it loses focus
function resetSearchBox() {
  const searchBox = document.getElementById("menuSearchBox");
  if (searchBox) {
    searchBox.style.borderColor = "";
    searchBox.style.boxShadow = "";
  }
}


// ----- Feature 8: mobile categories dropdown -----

// Expands/collapses the mobile category panel and flips the chevron
function toggleCategories() {
  const categoryPanel = document.getElementById("categoryPanel");
  const categoryToggle = document.getElementById("categoryToggle");
  const categoryChevron = document.getElementById("categoryChevron");

  if (!categoryPanel || !categoryToggle) {
    return;
  }

  const isOpen = categoryPanel.classList.toggle("is-open");
  categoryToggle.setAttribute("aria-expanded", String(isOpen));

  if (categoryChevron) {
    categoryChevron.textContent = isOpen ? "▴" : "▾"; // ▴ or ▾
  }
}


// Sets up the Menu page features (skipped on other pages)
function initMenuPage() {
  const menuGrid = document.getElementById("menuGrid");

  if (!menuGrid) {
    return;
  }

  // Features 1 + 5: card panels and their Add/Remove buttons
  const menuCards = menuGrid.getElementsByClassName("menu-card");

  for (let i = 0; i < menuCards.length; i++) {
    const card = menuCards[i];
    const cardButton = card.querySelector(".menu-card__btn");

    // Mouse enters a card: open its yellow panel
    card.onmouseover = function () {
      if (canHover) {
        showItemPanel(card);
      }
    };

    // Mouse leaves the card: close its panel (moves inside the same card are ignored)
    card.onmouseout = function (event) {
      if (!canHover || (event.relatedTarget && card.contains(event.relatedTarget))) {
        return;
      }
      hideItemPanel(card);
    };

    // Tap on a touch screen: toggle the panel (taps on the panel button don't)
    card.onclick = function (event) {
      if (!canHover && !event.target.closest(".menu-card__btn")) {
        toggleItemPanel(card);
      }
    };

    // Enter/Space on the focused card: toggle the panel
    card.onkeydown = function (event) {
      if (event.target === card && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        toggleItemPanel(card);
      }
    };

    // Panel button click: add to cart (or open the pop-up) / remove from cart
    if (cardButton) {
      cardButton.onclick = function () {
        handleCardButton(card);
      };
    }
  }

  // Feature 6: category click filters the cards (and collapses the mobile dropdown)
  const categoryButtons = document.getElementsByClassName("category-btn");

  for (let i = 0; i < categoryButtons.length; i++) {
    const categoryButton = categoryButtons[i];
    categoryButton.onclick = function () {
      filterByCategory(categoryButton.dataset.filter);

      const categoryPanel = document.getElementById("categoryPanel");
      if (window.innerWidth < MENU_SIDEBAR_BREAKPOINT && categoryPanel && categoryPanel.classList.contains("is-open")) {
        toggleCategories();
      }
    };
  }

  // Feature 8: "Categories" bar click opens/closes the mobile dropdown
  const categoryToggle = document.getElementById("categoryToggle");
  if (categoryToggle) {
    categoryToggle.onclick = toggleCategories;
  }

  // Feature 7: typing filters the cards; focus/blur highlights the search box
  const menuSearch = document.getElementById("menuSearch");
  if (menuSearch) {
    menuSearch.onkeyup = searchMenu;
    menuSearch.onfocus = highlightSearchBox;
    menuSearch.onblur = resetSearchBox;
  }

  // Features 2-4: pop-up (backdrop, close button, delegated clicks inside)
  const addModal = document.getElementById("addModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalContent = document.getElementById("modalContent");

  if (addModal) {
    // Mouse down: remember whether the click started on the backdrop
    addModal.onmousedown = function (event) {
      backdropPressed = event.target === addModal;
    };

    // Backdrop click: close only when the click started AND ended on the backdrop
    addModal.onclick = function (event) {
      if (event.target === addModal && backdropPressed) {
        closeAddModal();
      }
    };
  }

  // "x" button click: close the pop-up
  if (modalCloseBtn) {
    modalCloseBtn.onclick = closeAddModal;
  }

  // Clicks inside the pop-up: options, quantity and "Add to Cart"
  if (modalContent) {
    modalContent.onclick = handleModalClick;
  }

  // Escape key: close the pop-up (assigned only here, on the Menu page)
  document.onkeydown = function (event) {
    if (event.key === "Escape") {
      closeAddModal();
    }
  };

  // Page shown again with the Back button: refresh the badge and card buttons
  window.onpageshow = function () {
    updateCartBadge();
    refreshMenuCardButtons();
  };

  refreshMenuCardButtons();
  applyMenuFilters();
}


// ===== CART + CHECKOUT (Stage 3) =====

// localStorage key for the applied promo code (set on cart.html, read on checkout.html)
const PROMO_STORAGE_KEY = "stbPromo";

// Valid promo codes and their % discount on the subtotal
const PROMO_CODES = { KAPE10: 10 };

// Flat delivery fee in PHP (no fee for Pickup)
const DELIVERY_FEE = 49;

// Message colors (match --success-green and --error-text in style.css)
const SUCCESS_COLOR = "#16642A";
const ERROR_COLOR = "#A61B1B";
const ERROR_BORDER_COLOR = "#D62828";

// Checkout state
let orderType = "delivery";   // "delivery" or "pickup"

// Cart state
let clearCartTimer = null;    // resets the "Click again to clear all" step

// Reads the cart and keeps only valid lines (qty 1-99, price a number)
function getCleanCart() {
  const cart = getCart();
  const cleanCart = [];

  for (let i = 0; i < cart.length; i++) {
    const line = cart[i];
    if (line && typeof line === "object" && line.name) {
      line.qty = Math.min(MAX_ITEM_QTY, Math.max(1, parseInt(line.qty, 10) || 1));
      line.unitPrice = Number(line.unitPrice) || 0;
      cleanCart.push(line);
    }
  }

  return cleanCart;
}

// Returns the applied promo, e.g. { code: "KAPE10", percent: 10 }, or null
function getAppliedPromo() {
  let code = null;
  try {
    code = localStorage.getItem(PROMO_STORAGE_KEY);
  } catch (error) {
    code = null;
  }
  return code && PROMO_CODES[code] ? { code: code, percent: PROMO_CODES[code] } : null;
}

// Saves (or clears, when code is null) the applied promo code
function saveAppliedPromo(code) {
  try {
    if (code) {
      localStorage.setItem(PROMO_STORAGE_KEY, code);
    } else {
      localStorage.removeItem(PROMO_STORAGE_KEY);
    }
  } catch (error) {
    // Storage unavailable: the promo just won't carry over to checkout
  }
}

// Rounds to 2 decimals (avoids results like 13.900000000000002)
function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

// Calculates subtotal, discount and total for a cart and a delivery fee
function calculateTotals(cart, deliveryFee) {
  let subtotal = 0;
  for (let i = 0; i < cart.length; i++) {
    subtotal += cart[i].unitPrice * cart[i].qty;
  }

  const promo = getAppliedPromo();
  const discount = promo ? roundMoney(subtotal * promo.percent / 100) : 0;

  return {
    subtotal: roundMoney(subtotal),
    deliveryFee: deliveryFee,
    discount: discount,
    promo: promo,
    total: roundMoney(Math.max(0, subtotal - discount + deliveryFee))
  };
}

// Writes totals into Subtotal / Delivery Fee / Discount / Total (prefix "cart" or "checkout")
function showTotals(idPrefix, totals) {
  const subtotalEl = document.getElementById(idPrefix + "Subtotal");
  const deliveryFeeEl = document.getElementById(idPrefix + "DeliveryFee");
  const discountRow = document.getElementById(idPrefix + "DiscountRow");
  const discountLabel = document.getElementById(idPrefix + "DiscountLabel");
  const discountEl = document.getElementById(idPrefix + "Discount");
  const totalEl = document.getElementById(idPrefix + "Total");

  if (subtotalEl) {
    subtotalEl.textContent = formatPrice(totals.subtotal);
  }
  if (deliveryFeeEl) {
    deliveryFeeEl.textContent = formatPrice(totals.deliveryFee);
  }
  if (discountRow) {
    // The Discount row only appears when a promo is applied
    discountRow.style.display = totals.promo ? "flex" : "none";
  }
  if (discountLabel && totals.promo) {
    discountLabel.textContent = "Discount (" + totals.promo.code + ")";
  }
  if (discountEl) {
    discountEl.textContent = "− " + formatPrice(totals.discount);
  }
  if (totalEl) {
    totalEl.textContent = formatPrice(totals.total);
  }
}

// Details line for a cart item, e.g. "More Ice, Less Sugar" or "Cajun flavor"
function getLineOptionsText(line) {
  const options = line.options || {};
  const parts = [];

  if (options.ice) {
    parts.push(options.ice);
  }
  if (options.sugar) {
    parts.push(options.sugar);
  }
  if (options.flavor) {
    parts.push(options.flavor + " flavor");
  }

  return parts.join(", ");
}

// Special instructions in quotes, e.g. “Can I request more adobo sauce”
function getLineNoteText(line) {
  return line.note ? "“" + line.note + "”" : "";
}

// Shows a green (success) or red (error) message under a field
function showFormMessage(messageEl, text, type) {
  if (!messageEl) {
    return;
  }
  messageEl.textContent = text;
  messageEl.className = "form-message form-message--" + type;
  messageEl.style.color = type === "success" ? SUCCESS_COLOR : ERROR_COLOR;
}

// Feature 8: "< Back" goes to the previous page (or the link's page if there is none)
function goBack(event) {
  if (window.history.length > 1 && document.referrer !== "") {
    event.preventDefault();
    window.history.back();
  }
  // Otherwise the link's own href (menu.html / cart.html) is followed
}


// ----- CART PAGE -----

// Trash icon SVG used in every cart row and the "Clear cart" button
const TRASH_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
  '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

// Builds the HTML of one cart row
function buildCartRowHTML(line, index) {
  const name = escapeHTML(line.name);
  const optionsText = getLineOptionsText(line);
  const noteText = getLineNoteText(line);

  return `
    <article class="cart-item" data-index="${index}">
      <div class="cart-item__media">
        <img src="${escapeHTML(line.image || "")}" alt="${name}">
      </div>
      <div class="cart-item__body">
        <div class="cart-item__top">
          <div>
            <h3 class="cart-item__name">${name}</h3>
            ${optionsText ? `<p class="cart-item__details">${escapeHTML(optionsText)}</p>` : ""}
            ${noteText ? `<p class="cart-item__note">${escapeHTML(noteText)}</p>` : ""}
          </div>
          <button class="cart-item__remove" type="button" data-action="remove" aria-label="Remove ${name} from cart">${TRASH_ICON_SVG}</button>
        </div>
        <div class="cart-item__bottom">
          <p class="cart-item__price">${formatPrice(line.unitPrice * line.qty)}</p>
          <div class="qty-stepper" role="group" aria-label="Quantity of ${name}">
            <button class="qty-stepper__btn" type="button" data-action="decrease" aria-label="Decrease quantity"${line.qty <= 1 ? " disabled" : ""}>&minus;</button>
            <span class="qty-stepper__value">${line.qty}</span>
            <button class="qty-stepper__btn" type="button" data-action="increase" aria-label="Increase quantity"${line.qty >= MAX_ITEM_QTY ? " disabled" : ""}>+</button>
          </div>
        </div>
      </div>
    </article>`;
}

// Recalculates the cart Order Summary and enables/disables Proceed to Checkout
function updateCartSummary(cart) {
  const proceedBtn = document.getElementById("proceedCheckoutBtn");
  const cartItemsHeader = document.getElementById("cartItemsHeader");
  const cartItemCount = document.getElementById("cartItemCount");
  const hasItems = cart.length > 0;

  showTotals("cart", calculateTotals(cart, hasItems ? DELIVERY_FEE : 0));

  // "5 items" + Clear cart button (hidden when the cart is empty)
  let totalQuantity = 0;
  for (let i = 0; i < cart.length; i++) {
    totalQuantity += cart[i].qty;
  }
  if (cartItemCount) {
    cartItemCount.textContent = totalQuantity + (totalQuantity === 1 ? " item" : " items");
  }
  if (cartItemsHeader) {
    cartItemsHeader.style.display = hasItems ? "" : "none";
  }

  if (proceedBtn) {
    proceedBtn.classList.toggle("is-disabled", !hasItems);
    proceedBtn.setAttribute("aria-disabled", String(!hasItems));
    if (hasItems) {
      proceedBtn.removeAttribute("tabindex");
    } else {
      proceedBtn.setAttribute("tabindex", "-1");
    }
  }
}

// Feature 1: builds the cart rows from localStorage and updates the totals
function renderCart() {
  const cartList = document.getElementById("cartList");

  if (!cartList) {
    return;
  }

  const cart = getCleanCart();

  if (cart.length === 0) {
    cartList.innerHTML = `
      <div class="cart-empty">
        <p class="cart-empty__title">Your cart is empty, bro!</p>
        <p class="cart-empty__text">Your next favorite brew is just a few taps away.</p>
        <a class="btn btn--primary" href="menu.html">Browse the menu</a>
      </div>`;
  } else {
    let rowsHTML = "";
    for (let i = 0; i < cart.length; i++) {
      rowsHTML += buildCartRowHTML(cart[i], i);
    }
    cartList.innerHTML = rowsHTML;
  }

  updateCartSummary(cart);
  updateCartBadge();
}

// Feature 1: + / − on a cart row (qty stays between 1 and 99)
function changeCartQty(index, change) {
  const cart = getCleanCart();

  if (!cart[index]) {
    return;
  }

  cart[index].qty = Math.min(MAX_ITEM_QTY, Math.max(1, cart[index].qty + change));
  saveCart(cart);
  renderCart();

  // Keep keyboard focus on the same button after the rows are rebuilt
  const action = change > 0 ? "increase" : "decrease";
  const sameButton = document.querySelector('.cart-item[data-index="' + index + '"] [data-action="' + action + '"]');
  if (sameButton && !sameButton.disabled) {
    sameButton.focus();
  }
}

// Feature 1: trash icon removes the row (empty state when none are left)
function removeCartItem(index) {
  const cart = getCleanCart();

  if (!cart[index]) {
    return;
  }

  cart.splice(index, 1);
  saveCart(cart);
  renderCart();

  // Move focus to the next row's trash icon, or to "Browse the menu"
  const nextFocus = document.querySelector(".cart-list .cart-item__remove, .cart-list .btn");
  if (nextFocus) {
    nextFocus.focus();
  }
}

// One delegated click handler for all the rows built by renderCart()
function handleCartListClick(event) {
  const actionButton = event.target.closest("button[data-action]");

  if (!actionButton) {
    return;
  }

  const cartRow = actionButton.closest(".cart-item");
  const index = cartRow ? Number(cartRow.dataset.index) : -1;
  const action = actionButton.dataset.action;

  if (action === "increase") {
    changeCartQty(index, 1);
  } else if (action === "decrease") {
    changeCartQty(index, -1);
  } else if (action === "remove") {
    removeCartItem(index);
  }
}

// Puts the "Clear cart" button back to its first step
function resetClearCartButton() {
  const clearCartBtn = document.getElementById("clearCartBtn");

  clearTimeout(clearCartTimer);

  if (clearCartBtn) {
    clearCartBtn.classList.remove("is-confirming");
    clearCartBtn.innerHTML = TRASH_ICON_SVG + "<span>Clear cart</span>";
  }
}

// Deletes every item: the first click asks to confirm, the second click clears the cart
function clearCart() {
  const clearCartBtn = document.getElementById("clearCartBtn");

  if (!clearCartBtn || getCleanCart().length === 0) {
    return;
  }

  // Step 1: ask for confirmation (turns red for 3 seconds)
  if (!clearCartBtn.classList.contains("is-confirming")) {
    clearCartBtn.classList.add("is-confirming");
    clearCartBtn.innerHTML = TRASH_ICON_SVG + "<span>Click again to clear all</span>";
    clearCartTimer = setTimeout(resetClearCartButton, 3000);
    return;
  }

  // Step 2: confirmed, so empty the cart (saveCart() also resets the badge)
  resetClearCartButton();
  saveCart([]);
  renderCart();

  const browseMenuLink = document.querySelector(".cart-list .btn");
  if (browseMenuLink) {
    browseMenuLink.focus();
  }
}

// Feature 2: KAPE10 = 10% off the subtotal; other codes show a red error
function applyPromoCode() {
  const promoInput = document.getElementById("promoInput");
  const promoField = document.getElementById("promoField");
  const promoMessage = document.getElementById("promoMessage");

  if (!promoInput) {
    return;
  }

  const code = promoInput.value.trim().toUpperCase();

  if (code === "") {
    showFormMessage(promoMessage, "Please enter a promo code first, bro.", "error");
    if (promoField) {
      promoField.style.borderColor = ERROR_BORDER_COLOR;
    }
    return;
  }

  if (PROMO_CODES[code]) {
    saveAppliedPromo(code);
    promoInput.value = code;
    showFormMessage(promoMessage, code + " applied! You get " + PROMO_CODES[code] + "% off your subtotal.", "success");
    if (promoField) {
      promoField.style.borderColor = SUCCESS_COLOR;
    }
    updateCartSummary(getCleanCart());
  } else {
    showFormMessage(promoMessage, "Sorry, bro, “" + code + "” isn't a valid promo code.", "error");
    if (promoField) {
      promoField.style.borderColor = ERROR_BORDER_COLOR;
    }
  }
}

// Feature 3: checks the email format, then thanks the subscriber
function subscribeEmail() {
  const emailInput = document.getElementById("newsletterEmail");
  const emailField = document.getElementById("newsletterField");
  const newsletterForm = document.getElementById("newsletterForm");
  const newsletterMessage = document.getElementById("newsletterMessage");

  if (!emailInput || !newsletterForm) {
    return;
  }

  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    showFormMessage(newsletterMessage, "Please enter a valid email address, e.g. example@mail.com.", "error");
    if (emailField) {
      emailField.style.borderColor = ERROR_BORDER_COLOR;
    }
    emailInput.focus();
    return;
  }

  newsletterForm.innerHTML = `
    <div class="newsletter__thanks" role="status">
      <p class="newsletter__thanks-title">Salamat, brew! &#10003;</p>
      <p>You're now subscribed with <strong>${escapeHTML(email)}</strong>.</p>
      <p>Watch your inbox for cafe updates and brew-tiful offers.</p>
    </div>`;
}

// Simple email format check: something@something.domain
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Sets up the cart page (skipped on other pages)
function initCartPage() {
  const cartList = document.getElementById("cartList");

  if (!cartList) {
    return;
  }

  // Show a promo that was already applied earlier
  const promoInput = document.getElementById("promoInput");
  const promo = getAppliedPromo();
  if (promo && promoInput) {
    promoInput.value = promo.code;
    showFormMessage(document.getElementById("promoMessage"), promo.code + " applied! You get " + promo.percent + "% off your subtotal.", "success");
  }

  renderCart();

  // Feature 1: clicks on +, − and trash in any cart row (one delegated handler)
  cartList.onclick = handleCartListClick;

  // "Clear cart" click: delete all items (two-step confirm)
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) {
    clearCartBtn.onclick = clearCart;
  }

  // Feature 2: check button click applies the promo code
  const promoApplyBtn = document.getElementById("promoApplyBtn");
  if (promoApplyBtn) {
    promoApplyBtn.onclick = applyPromoCode;
  }

  // Enter in the promo field also applies it
  if (promoInput) {
    promoInput.onkeyup = function (event) {
      if (event.key === "Enter") {
        applyPromoCode();
      }
    };
  }

  // Feature 3: "Subscribe" click checks the email and subscribes
  const subscribeBtn = document.getElementById("subscribeBtn");
  const emailInput = document.getElementById("newsletterEmail");
  if (subscribeBtn) {
    subscribeBtn.onclick = subscribeEmail;
  }

  // Typing in the email field: Enter subscribes, any other key clears the red border
  if (emailInput) {
    emailInput.onkeyup = function (event) {
      if (event.key === "Enter") {
        subscribeEmail();
        return;
      }
      const emailField = document.getElementById("newsletterField");
      if (emailField) {
        emailField.style.borderColor = "";
      }
    };
  }

  // Page shown again with the Back button (from checkout): re-read the cart
  window.onpageshow = function () {
    renderCart();
  };
}


// ----- CHECKOUT PAGE -----

// Required checkout fields: how each is checked and the error shown when it's wrong
const CHECKOUT_FIELD_RULES = {
  fullName: {
    isValid: function (value) { return value.length >= 2; },
    message: "Please enter your full name."
  },
  contactNumber: {
    isValid: isValidPhMobile,
    message: "Enter a valid PH mobile number, e.g. 0917-123-4567."
  },
  emailAddress: {
    isValid: isValidEmail,
    message: "Enter a valid email address, e.g. example@mail.com."
  },
  streetAddress: {
    isValid: function (value) { return value.length >= 3; },
    message: "Please enter your house/building no. and street.",
    deliveryOnly: true
  },
  city: {
    isValid: function (value) { return value.length >= 2; },
    message: "Please enter your city.",
    deliveryOnly: true
  }
};

// PH mobile number: 09XX-XXX-XXXX (dashes/spaces optional) or +639XXXXXXXXX
function isValidPhMobile(value) {
  const digits = value.replace(/[\s-]/g, "");
  return /^09\d{9}$/.test(digits) || /^\+639\d{9}$/.test(digits);
}

// Shows or clears the red border + message under one field
function setFieldError(input, message) {
  const errorEl = document.getElementById(input.id + "Error");

  if (message) {
    input.style.borderColor = ERROR_BORDER_COLOR;
    input.setAttribute("aria-invalid", "true");
  } else {
    input.style.borderColor = "";
    input.removeAttribute("aria-invalid");
  }

  if (errorEl) {
    errorEl.textContent = message;
  }
}

// Checks one checkout field; returns true when it's valid (or not needed)
function validateCheckoutField(fieldId) {
  const input = document.getElementById(fieldId);
  const rule = CHECKOUT_FIELD_RULES[fieldId];

  if (!input || !rule) {
    return true;
  }

  // Address fields don't matter for Pickup
  if (rule.deliveryOnly && orderType !== "delivery") {
    setFieldError(input, "");
    return true;
  }

  const isValid = rule.isValid(input.value.trim());
  setFieldError(input, isValid ? "" : rule.message);
  return isValid;
}

// Builds the item list + totals in the checkout Order Summary
function renderCheckoutSummary() {
  const checkoutItems = document.getElementById("checkoutItems");

  if (!checkoutItems) {
    return;
  }

  const cart = getCleanCart();
  let itemsHTML = "";

  for (let i = 0; i < cart.length; i++) {
    const detailsParts = [];
    const optionsText = getLineOptionsText(cart[i]);
    const noteText = getLineNoteText(cart[i]);
    if (optionsText) {
      detailsParts.push(escapeHTML(optionsText));
    }
    if (noteText) {
      detailsParts.push(escapeHTML(noteText));
    }

    itemsHTML += `
      <li class="summary-item">
        <span class="summary-item__name">${i + 1} &ndash; ${escapeHTML(cart[i].name)}</span>
        <span class="summary-item__qty">Qty: ${cart[i].qty}</span>
        ${detailsParts.length > 0 ? `<span class="summary-item__details">${detailsParts.join("<br>")}</span>` : ""}
      </li>`;
  }

  checkoutItems.innerHTML = itemsHTML;
  showTotals("checkout", calculateTotals(cart, orderType === "delivery" ? DELIVERY_FEE : 0));
}

// Feature 4: Delivery / Pickup cards swap style, fields and delivery fee
function selectOrderType(type) {
  orderType = type;

  const optionCards = document.getElementsByClassName("order-type__option");
  for (let i = 0; i < optionCards.length; i++) {
    const isSelected = optionCards[i].dataset.orderType === type;
    optionCards[i].classList.toggle("is-selected", isSelected);
    optionCards[i].setAttribute("aria-pressed", String(isSelected));
  }

  const deliveryFields = document.getElementById("deliveryFields");
  const pickupNote = document.getElementById("pickupNote");
  if (deliveryFields) {
    deliveryFields.style.display = type === "delivery" ? "" : "none";
  }
  if (pickupNote) {
    pickupNote.style.display = type === "pickup" ? "block" : "none";
  }

  // Hidden address fields shouldn't keep their red errors
  if (type === "pickup") {
    validateCheckoutField("streetAddress");
    validateCheckoutField("city");
  }

  updatePaymentNote();
  renderCheckoutSummary();
}

// Feature 5: simulated map picker that fills in a sample address
function chooseFromMaps() {
  const streetInput = document.getElementById("streetAddress");
  const cityInput = document.getElementById("city");
  const provinceSelect = document.getElementById("province");

  if (streetInput) {
    streetInput.value = "123 Example Brew Street";
    setFieldError(streetInput, "");
  }
  if (cityInput) {
    cityInput.value = "Santa Maria";
    setFieldError(cityInput, "");
  }
  if (provinceSelect) {
    provinceSelect.value = "Bulacan";
  }

  updateProvinceNote();
  showFormMessage(document.getElementById("mapsMessage"), "Location selected ✓ (sample address)", "success");
}

// Feature 6: short note under the payment dropdown
function updatePaymentNote() {
  const paymentSelect = document.getElementById("paymentMethod");
  const paymentNote = document.getElementById("paymentNote");

  if (!paymentSelect || !paymentNote) {
    return;
  }

  const notes = {
    "Cash on Delivery": orderType === "delivery"
      ? "Pay in cash when your order arrives."
      : "Pay in cash when you pick up your order.",
    "GCash": "We'll send a <strong>GCash</strong> payment request to your mobile number.",
    "Maya": "We'll send a <strong>Maya</strong> payment request to your mobile number."
  };

  paymentNote.innerHTML = notes[paymentSelect.value] || "";
}

// Feature 6: "Delivering to [province]" line under the Province dropdown
function updateProvinceNote() {
  const provinceSelect = document.getElementById("province");
  const provinceNote = document.getElementById("provinceNote");

  if (provinceSelect && provinceNote) {
    provinceNote.innerHTML = "Delivering to <strong>" + escapeHTML(provinceSelect.value) + "</strong>";
  }
}

// Feature 7: validates the form, then shows the confirmation pop-up and clears the cart
function placeOrder() {
  const placeOrderMessage = document.getElementById("placeOrderMessage");
  const fieldIds = Object.keys(CHECKOUT_FIELD_RULES);
  let firstInvalidInput = null;

  for (let i = 0; i < fieldIds.length; i++) {
    const isValid = validateCheckoutField(fieldIds[i]);
    if (!isValid && !firstInvalidInput) {
      firstInvalidInput = document.getElementById(fieldIds[i]);
    }
  }

  if (firstInvalidInput) {
    showFormMessage(placeOrderMessage, "Please check the highlighted fields, bro.", "error");
    firstInvalidInput.focus();
    return;
  }

  const cart = getCleanCart();
  if (cart.length === 0) {
    showFormMessage(placeOrderMessage, "Your cart is empty, bro!", "error");
    return;
  }

  const totals = calculateTotals(cart, orderType === "delivery" ? DELIVERY_FEE : 0);
  const fullName = document.getElementById("fullName").value.trim();
  const paymentSelect = document.getElementById("paymentMethod");
  const orderNumber = "STB-" + (1000 + Math.floor(Math.random() * 9000));
  let orderTypeText = "Pickup at our cafe";

  if (orderType === "delivery") {
    const cityInput = document.getElementById("city");
    const provinceSelect = document.getElementById("province");
    orderTypeText = "Delivery to " + (cityInput ? cityInput.value.trim() : "") +
      (provinceSelect ? ", " + provinceSelect.value : "");
  }

  const orderConfirmContent = document.getElementById("orderConfirmContent");
  const orderModal = document.getElementById("orderModal");
  const orderDialog = document.getElementById("orderDialog");

  if (orderConfirmContent) {
    orderConfirmContent.innerHTML = `
      <div class="order-confirm__content">
        <div class="order-confirm__icon" aria-hidden="true">&#10003;</div>
        <h2 class="order-confirm__title" id="orderConfirmTitle">Order placed! Salamat, ${escapeHTML(fullName)}!</h2>
        <dl class="order-confirm__details">
          <div class="summary-row"><dt>Order number</dt><dd>${orderNumber}</dd></div>
          <div class="summary-row"><dt>Total</dt><dd>${formatPrice(totals.total)}</dd></div>
          <div class="summary-row"><dt>Order type</dt><dd>${escapeHTML(orderTypeText)}</dd></div>
          <div class="summary-row"><dt>Payment</dt><dd>${escapeHTML(paymentSelect ? paymentSelect.value : "")}</dd></div>
        </dl>
        <p class="order-confirm__note">This is a prototype, no real transaction was made.</p>
        <a class="btn btn--primary" href="index.html">Back to Home</a>
      </div>`;
  }

  if (orderModal) {
    orderModal.classList.add("is-open");
    document.body.classList.add("modal-open");
  }
  if (orderDialog) {
    orderDialog.focus({ preventScroll: true });
  }

  // Clear the cart + promo; saveCart() resets the badge
  saveCart([]);
  saveAppliedPromo(null);
  showFormMessage(placeOrderMessage, "", "success");
}

// Sets up the checkout page (skipped on other pages)
function initCheckoutPage() {
  const checkoutLayout = document.getElementById("checkoutLayout");

  if (!checkoutLayout) {
    return;
  }

  // Empty cart: show the message instead of the form
  if (getCleanCart().length === 0) {
    const checkoutEmpty = document.getElementById("checkoutEmpty");
    checkoutLayout.style.display = "none";
    if (checkoutEmpty) {
      checkoutEmpty.style.display = "flex";
    }
    return;
  }

  renderCheckoutSummary();

  // Feature 4: Delivery / Pickup card click switches the order type
  const optionCards = document.getElementsByClassName("order-type__option");
  for (let i = 0; i < optionCards.length; i++) {
    const optionCard = optionCards[i];
    optionCard.onclick = function () {
      selectOrderType(optionCard.dataset.orderType);
    };
  }

  // Feature 5: "Choose from Google Maps" click fills in a sample address
  const chooseMapsBtn = document.getElementById("chooseMapsBtn");
  if (chooseMapsBtn) {
    chooseMapsBtn.onclick = chooseFromMaps;
  }

  // Feature 6: changing Payment or Province updates the note under it
  const paymentSelect = document.getElementById("paymentMethod");
  const provinceSelect = document.getElementById("province");
  if (paymentSelect) {
    paymentSelect.onchange = updatePaymentNote;
  }
  if (provinceSelect) {
    provinceSelect.onchange = updateProvinceNote;
  }

  // Feature 7: "Place Order" click validates the form and places the order
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  if (placeOrderBtn) {
    placeOrderBtn.onclick = placeOrder;
  }

  // Typing in a field marked red: re-check it right away

  const fieldIds = Object.keys(CHECKOUT_FIELD_RULES);
  for (let i = 0; i < fieldIds.length; i++) {
    const input = document.getElementById(fieldIds[i]);
    if (input) {
      input.onkeyup = function () {
        if (input.getAttribute("aria-invalid") === "true") {
          validateCheckoutField(input.id);
        }
      };
    }
  }

  updatePaymentNote();
  updateProvinceNote();
}


// Feature 8: every "< Back" link (cart + checkout pages)
function initBackLinks() {
  const backLinks = document.getElementsByClassName("back-link");
  // "< Back" click: go to the previous page
  for (let i = 0; i < backLinks.length; i++) {
    backLinks[i].onclick = goBack;
  }
}


// ===== PAGE START-UP =====
// Every init function checks for its own elements, so all of them can run on every page
initSharedFeatures();
initHomePage();
initAboutPage();
initMenuPage();
initCartPage();
initCheckoutPage();
initBackLinks();
