/**
 *
 * @typedef {typeof gameState.upgrades[keyof typeof gameState.upgrades]} Upgrade
 */

const tickRate = 20;

let interval;

const clicker = document.getElementById("watermelon-button");
const watermelonImg = document.getElementById("watermelon-button-img");
const watermelonCount = document.getElementById("watermelon-count");
const watermelonCps = document.getElementById("watermelon-cps");

const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
});

const regularFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

/**
 *
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  return num >= 1_000_000
    ? compactFormatter.format(num)
    : regularFormatter.format(num);
}

/**
 * @type {Record<string, {button: HTMLElement | null; quantity: HTMLElement | null; cost: HTMLElement | null; }>}
 */
const upgradeElements = {};

function cacheUpgradeButtons() {
  for (const key in gameState.upgrades) {
    const upgradeKey = toKebabCase(key);
    upgradeElements[key] = {
      button: document.getElementById(`${upgradeKey}-upgrade`),
      quantity: document.getElementById(`${upgradeKey}-quantity`),
      cost: document.getElementById(`${upgradeKey}-cost`),
    };
  }
}

let gameState = {
  watermelons: 0,
  upgrades: {
    tapper: {
      quantity: 0,
      baseCost: 15,
      currentCost: 15,
      cps: 0.1,
    },
    juicer: {
      quantity: 0,
      baseCost: 100,
      currentCost: 100,
      cps: 1,
    },
    fruitStand: {
      quantity: 0,
      baseCost: 500,
      currentCost: 500,
      cps: 5,
    },
    farm: {
      quantity: 0,
      baseCost: 3000,
      currentCost: 3000,
      cps: 15,
    },
    tractor: {
      quantity: 0,
      baseCost: 10000,
      currentCost: 10000,
      cps: 50,
    },
    greenhouse: {
      quantity: 0,
      baseCost: 40000,
      currentCost: 40000,
      cps: 150,
    },
  },
  totalCPS: 0,
};

cacheUpgradeButtons();

function loadGame() {
  const gameSave = localStorage.getItem("save");

  if (gameSave) {
    gameState = JSON.parse(gameSave);
    updateWatermelonCountUi();
    updateWatermelonCpsUi();

    for (const [key, elem] of Object.entries(upgradeElements)) {
      updateUpgradeCountUi(elem.quantity, gameState.upgrades[key]);
      updateUpgradeCostUi(elem.cost, gameState.upgrades[key]);
    }

    updateUpgradeButtons();
    intitializeAutoclickerInterval();
  }
}

loadGame();

function updateWatermelonCountUi() {
  watermelonCount.innerText = formatNumber(Math.floor(gameState.watermelons));
}

function updateWatermelonCpsUi() {
  watermelonCps.innerText = formatNumber(gameState.totalCPS);
}

/**
 *
 * @param {Upgrade} upgrade
 */
function updateUpgradeCost(upgrade) {
  // update upgrade cost by 15%
  upgrade.currentCost = Math.floor(upgrade.baseCost * 1.15 ** upgrade.quantity);
}

/**
 *
 * @param {HTMLElement} upgradeElem
 * @param {Upgrade} upgrade
 */
function updateUpgradeCountUi(upgradeElem, upgrade) {
  upgradeElem.innerText = upgrade.quantity;
}

/**
 *
 * @param {HTMLElement} upgradeElem
 * @param {Upgrade} upgrade
 */
function updateUpgradeCostUi(upgradeElem, upgrade) {
  upgradeElem.innerText = formatNumber(upgrade.currentCost);
}

function recalculateCPS() {
  let total = 0;
  for (let key in gameState.upgrades) {
    const upgrade = gameState.upgrades[key];
    total += upgrade.quantity * upgrade.cps;
  }
  gameState.totalCPS = total;
}

/**
 *
 * @param {string} str
 * @returns {string}
 */
function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function handleWatermelonClickByInterval() {
  gameState.watermelons += gameState.totalCPS / tickRate;
  updateWatermelonCountUi();
  updateUpgradeButtons();
}

function intitializeAutoclickerInterval() {
  if (interval === undefined) {
    interval = setInterval(handleWatermelonClickByInterval, 1000 / tickRate);
  }
}

function updateUpgradeButtons() {
  for (const [key, upgrade] of Object.entries(gameState.upgrades)) {
    const button = upgradeElements[key].button;
    if (!button) return;

    if (gameState.watermelons >= upgrade.currentCost) {
      button.disabled = false;
    } else {
      button.disabled = true;
    }
  }
}

// initally add event listneres to all upgrades
for (const [key, upgrade] of Object.entries(gameState.upgrades)) {
  const upgradeElement = upgradeElements[key];

  upgradeElement.button.addEventListener("click", () => {
    if (gameState.watermelons >= upgrade.currentCost) {
      // subsctract the cost of the upgrade
      gameState.watermelons -= upgrade.currentCost;
      upgrade.quantity++;

      updateUpgradeCost(upgrade);

      recalculateCPS();
      updateWatermelonCountUi();
      updateWatermelonCpsUi();
      updateUpgradeCountUi(upgradeElement.quantity, upgrade);
      updateUpgradeCostUi(upgradeElement.cost, upgrade);
      updateUpgradeButtons();

      intitializeAutoclickerInterval();
      saveGame();
    }
  });
}

function bounceWatermelon() {
  watermelonImg.classList.remove("watermelon-bounce");
  void watermelonImg.offsetWidth;
  watermelonImg.classList.add("watermelon-bounce");
}

/**
 *
 * @param {number} x
 * @param {number} y
 */
function generateWatermelonClickFeedback(x, y) {
  const watermelon = document.createElement("img");
  watermelon.src = "./assets/sliced-watermelon.png";
  watermelon.classList.add("click-feedback");

  const offsetX = (Math.random() - 0.5) * 60;
  const offsetY = (Math.random() - 0.5) * 10;
  const rotation = `${(Math.random() - 0.5) * 30}deg`;

  watermelon.style.left = `${x + offsetX}px`;
  watermelon.style.top = `${y + offsetY}px`;
  watermelon.style.setProperty("--rotation", rotation);
  document.body.appendChild(watermelon);

  setTimeout(() => {
    watermelon.remove();
  }, 500);
}

/**
 *
 * @param {MouseEvent} ev
 */
function handleWatermelonClick(ev) {
  gameState.watermelons++;

  generateWatermelonClickFeedback(ev.clientX, ev.clientY);
  bounceWatermelon();
  updateWatermelonCountUi();
  updateUpgradeButtons();
}

clicker.addEventListener("click", handleWatermelonClick);

// initially check if any of the upgrades can be bought
updateUpgradeButtons();

const burgerOpen = document.getElementById("burger-open");
const burgerClose = document.getElementById("burger-close");
const storeScreen = document.getElementById("store-screen");

burgerOpen.addEventListener("click", () => {
  storeScreen.style.display = "initial";
});

burgerClose.addEventListener("click", () => {
  storeScreen.style.removeProperty("display");
});

function saveGame() {
  localStorage.setItem("save", JSON.stringify(gameState));
}

setInterval(() => {
  localStorage.setItem("save", JSON.stringify(gameState));
}, 1000 * 3);
