const games = Array.isArray(window.ARCADE_GAMES) ? window.ARCADE_GAMES : [];
const collator = new Intl.Collator("ja", { numeric: true, sensitivity: "base" });

const elements = {
  totalCount: document.querySelector("#total-count"),
  resultCount: document.querySelector("#result-count"),
  resultDescription: document.querySelector("#result-description"),
  search: document.querySelector("#search"),
  year: document.querySelector("#year-filter"),
  manufacturer: document.querySelector("#manufacturer-filter"),
  reset: document.querySelector("#reset-filters"),
  list: document.querySelector("#game-list"),
  empty: document.querySelector("#empty-state"),
  emptyReset: document.querySelector("#empty-state button"),
  sortButtons: [...document.querySelectorAll(".sort-button")],
};

const state = {
  query: "",
  year: "",
  manufacturer: "",
  sort: "year",
  direction: "asc",
};

const normalize = (value) =>
  String(value)
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/\s+/g, "");

const fillSelect = (select, values) => {
  const fragment = document.createDocumentFragment();
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    fragment.append(option);
  }
  select.append(fragment);
};

fillSelect(
  elements.year,
  [...new Set(games.map((game) => game.year).filter(Boolean))].sort(collator.compare),
);

const manufacturerReadings = new Map();
for (const game of games) {
  if (!manufacturerReadings.has(game.manufacturer)) {
    manufacturerReadings.set(
      game.manufacturer,
      game.manufacturerReading || game.manufacturer,
    );
  }
}

fillSelect(
  elements.manufacturer,
  [...manufacturerReadings.keys()].sort((left, right) =>
    collator.compare(
      manufacturerReadings.get(left) || left,
      manufacturerReadings.get(right) || right,
    ),
  ),
);

elements.totalCount.textContent = games.length.toLocaleString("ja-JP");

const makeCell = (value, label, className = "") => {
  const cell = document.createElement("td");
  cell.dataset.label = label;
  if (className) cell.className = className;
  cell.textContent = value;
  return cell;
};

const renderRow = (game) => {
  const row = document.createElement("tr");
  const titleCell = makeCell("", "ゲーム名", "game-title");
  const titleLink = document.createElement("a");
  const searchQuery = `${game.title} ${game.manufacturer} ${game.year}`;
  titleLink.className = "game-title-link";
  titleLink.textContent = game.title;
  titleLink.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  titleLink.target = "_blank";
  titleLink.rel = "noopener noreferrer";
  titleLink.setAttribute("aria-label", `${game.title}をGoogleで検索`);
  titleCell.append(titleLink);

  row.append(
    titleCell,
    makeCell("", "製造年"),
    makeCell(game.manufacturer, "製造元"),
    makeCell(game.name, "名前", "machine-name"),
    makeCell(game.note, "メモ", "game-note"),
  );

  const year = document.createElement("span");
  year.className = "year-value";
  year.textContent = game.year;
  row.children[1].append(year);
  return row;
};

const compareGames = (left, right) => {
  const sortValue = (game, key) => {
    if (key === "title") return game.titleReading || game.title;
    if (key === "manufacturer") {
      return game.manufacturerReading || game.manufacturer;
    }
    return game[key] || "";
  };

  const primary = collator.compare(
    sortValue(left, state.sort),
    sortValue(right, state.sort),
  );
  const secondary = collator.compare(left.year || "", right.year || "") ||
    collator.compare(
      left.titleReading || left.title || "",
      right.titleReading || right.title || "",
    );
  return (primary || secondary) * (state.direction === "asc" ? 1 : -1);
};

const render = () => {
  const query = normalize(state.query);
  const filtered = games
    .filter((game) => !state.year || game.year === state.year)
    .filter((game) => !state.manufacturer || game.manufacturer === state.manufacturer)
    .filter((game) => {
      if (!query) return true;
      return normalize(
        `${game.title} ${game.titleReading} ${game.year} ${game.manufacturer} ` +
        `${game.manufacturerReading} ${game.name} ${game.note}`,
      ).includes(query);
    })
    .sort(compareGames);

  const fragment = document.createDocumentFragment();
  for (const game of filtered) fragment.append(renderRow(game));
  elements.list.replaceChildren(fragment);

  const count = filtered.length.toLocaleString("ja-JP");
  elements.totalCount.textContent = count;
  elements.resultCount.textContent = count;
  elements.empty.hidden = filtered.length !== 0;
  elements.list.hidden = filtered.length === 0;

  const conditions = [];
  if (state.query) conditions.push(`「${state.query}」`);
  if (state.year) conditions.push(`${state.year}年`);
  if (state.manufacturer) conditions.push(state.manufacturer);
  elements.resultDescription.textContent = conditions.length
    ? `${conditions.join("・")}で絞り込み`
    : `全${games.length.toLocaleString("ja-JP")}件を表示`;

  elements.reset.disabled = !conditions.length;
};

const resetFilters = () => {
  state.query = "";
  state.year = "";
  state.manufacturer = "";
  elements.search.value = "";
  elements.year.value = "";
  elements.manufacturer.value = "";
  render();
  elements.search.focus();
};

elements.search.addEventListener("input", (event) => {
  state.query = event.currentTarget.value.trim();
  render();
});

elements.search.addEventListener("focus", (event) => {
  event.currentTarget.select();
});

elements.search.addEventListener("click", (event) => {
  event.currentTarget.select();
});

elements.year.addEventListener("change", (event) => {
  state.year = event.currentTarget.value;
  render();
});

elements.manufacturer.addEventListener("change", (event) => {
  state.manufacturer = event.currentTarget.value;
  render();
});

elements.reset.addEventListener("click", resetFilters);
elements.emptyReset.addEventListener("click", resetFilters);

for (const button of elements.sortButtons) {
  button.addEventListener("click", () => {
    const key = button.dataset.sort;
    state.direction = state.sort === key && state.direction === "asc" ? "desc" : "asc";
    state.sort = key;

    for (const sortButton of elements.sortButtons) {
      const active = sortButton === button;
      sortButton.classList.toggle("is-active", active);
      sortButton.setAttribute("aria-pressed", String(active));
      const icon = sortButton.querySelector("span");
      if (icon) icon.textContent = active ? (state.direction === "asc" ? "↑" : "↓") : "↕";
    }
    render();
  });
}

render();
