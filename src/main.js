// Created by Deme Gábor © 2026

const STORAGE_KEY = "ovoda6a_hazpenztar_state_v1";
const ACTIVE_SECTION_KEY = "ovoda6a_hazpenztar_active_section_v1";

const DEFAULT_APARTMENTS = [
  { id: 1, name: "Lakás 1", monthlyFee: 12000 },
  { id: 2, name: "Lakás 2", monthlyFee: 12000 },
  { id: 3, name: "Lakás 3", monthlyFee: 12000 },
  { id: 4, name: "Lakás 4", monthlyFee: 12000 },
  { id: 5, name: "Lakás 5", monthlyFee: 12000 },
  { id: 6, name: "Garázs 1", monthlyFee: 12000 },
  { id: 7, name: "Garázs 2", monthlyFee: 12000 }
];

function createAutoBackup(reason = "manual") {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");

    const backup = {
      timestamp: now.toISOString(),
      reason,
      version: "V3 Final Ultimate",
      state
    };

    const fileName = `backup_${timestamp}_${reason}.json`;

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();

    console.log("AUTO BACKUP:", fileName);
  } catch (err) {
    console.error("Backup hiba:", err);
  }
}

let reportStatus = {
  text: "",
  kind: ""
};

let autoMonthlyCheckStarted = false;

function defaultState() {
  return {
    openingCash: 0,
    apartments: DEFAULT_APARTMENTS.map(apartment => ({ ...apartment })),
    entries: [],
    reportSettings: {
      targetFolder: "",
      autoMonthlyEnabled: true,
      lastGeneratedMonth: ""
    },
    uiSettings: {
      showArchivedEntries: false
    }
  };
}

function parseMoney(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (!normalized) return 0;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMoney(value) {
  const amount = parseMoney(value);
  const roundedInteger = Math.round(amount);
  return Math.abs(amount - roundedInteger) < 0.0000001 ? roundedInteger : amount;
}

function positiveMoneyFromInput(value) {
  const amount = normalizeMoney(value);
  return amount > 0 ? amount : 0;
}

function normalizeApartments(apartments, entries = []) {
  const byId = new Map();

  for (const apartment of DEFAULT_APARTMENTS) {
    byId.set(Number(apartment.id), { ...apartment });
  }

  if (Array.isArray(apartments)) {
    for (const apartment of apartments) {
      const id = Number(apartment?.id);
      if (!Number.isFinite(id) || id <= 0) continue;

      byId.set(id, {
        id,
        name: String(apartment?.name || `Lakás ${id}`).trim() || `Lakás ${id}`,
        monthlyFee: normalizeMoney(apartment?.monthlyFee)
      });
    }
  }

  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (entry?.type !== "payment") continue;

      const id = Number(entry.apartmentId);
      if (!Number.isFinite(id) || id <= 0 || byId.has(id)) continue;

      byId.set(id, {
        id,
        name: String(entry.apartmentName || `Lakás ${id}`).trim() || `Lakás ${id}`,
        monthlyFee: 0
      });
    }
  }

  return [...byId.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

function normalizeEntries(entries, apartments) {
  const apartmentById = new Map(apartments.map(apartment => [Number(apartment.id), apartment]));

  if (!Array.isArray(entries)) return [];

  return entries
    .filter(entry => entry && (entry.type === "payment" || entry.type === "expense"))
    .map(entry => {
      const normalized = {
        ...entry,
        amount: normalizeMoney(entry.amount),
        archived: Boolean(entry.archived)
      };

      if (normalized.type === "payment") {
        const apartmentId = Number(normalized.apartmentId);
        if (Number.isFinite(apartmentId) && apartmentId > 0) {
          const apartment = apartmentById.get(apartmentId);
          normalized.apartmentId = apartmentId;
          normalized.apartmentName = apartment?.name || String(normalized.apartmentName || `Lakás ${apartmentId}`);
        } else {
          normalized.apartmentId = null;
          normalized.apartmentName = String(normalized.apartmentName || "Kézi ellenőrzés szükséges");
        }
      }

      return normalized;
    })
    .filter(entry => entry.amount > 0);
}

function normalizeState(input = {}) {
  const fallback = defaultState();
  const rawEntries = Array.isArray(input.entries) ? input.entries : [];
  const apartments = normalizeApartments(input.apartments, rawEntries);
  const entries = normalizeEntries(rawEntries, apartments);

  return {
    openingCash: normalizeMoney(input.openingCash),
    apartments,
    entries,
    reportSettings: {
      targetFolder: String(input?.reportSettings?.targetFolder || ""),
      autoMonthlyEnabled: typeof input?.reportSettings?.autoMonthlyEnabled === "boolean"
        ? input.reportSettings.autoMonthlyEnabled
        : fallback.reportSettings.autoMonthlyEnabled,
      lastGeneratedMonth: String(input?.reportSettings?.lastGeneratedMonth || "")
    },
    uiSettings: {
      showArchivedEntries: typeof input?.uiSettings?.showArchivedEntries === "boolean"
        ? input.uiSettings.showArchivedEntries
        : fallback.uiSettings.showArchivedEntries
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();

    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return defaultState();
  }
}

let state = loadState();

function saveState() {
  state = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveSection() {
  return localStorage.getItem(ACTIVE_SECTION_KEY) || "overviewSection";
}

function setActiveSection(sectionId) {
  localStorage.setItem(ACTIVE_SECTION_KEY, sectionId);
}

function formatFt(value) {
  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 2
  }).format(normalizeMoney(value)) + " Ft";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function nowIso() {
  return new Date().toISOString();
}

function nowStamp() {
  return new Date().toLocaleString("hu-HU");
}

function monthKeyFromDate(date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  return `${year}-${month}`;
}

function monthLabelHu(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "long" });
}

function parseHungarianDateTime(text) {
  const match = String(text || "").match(
    /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || 0);

  const date = new Date(year, month, day, hour, minute, second);
  return Number.isNaN(date.getTime()) ? null : date;
}

function entryDate(entry) {
  if (entry.createdAtIso) {
    const isoDate = new Date(entry.createdAtIso);
    if (!Number.isNaN(isoDate.getTime())) return isoDate;
  }

  const parsedHu = parseHungarianDateTime(entry.createdAt);
  if (parsedHu) return parsedHu;

  return new Date(0);
}

function entryMonthKey(entry) {
  return monthKeyFromDate(entryDate(entry));
}

function activeEntries() {
  return state.entries.filter(entry => !entry.archived);
}

function archivedEntries() {
  return state.entries.filter(entry => entry.archived);
}

function totalPayments() {
  return activeEntries()
    .filter(e => e.type === "payment")
    .reduce((sum, e) => normalizeMoney(sum + normalizeMoney(e.amount)), 0);
}

function totalExpenses() {
  return activeEntries()
    .filter(e => e.type === "expense")
    .reduce((sum, e) => normalizeMoney(sum + normalizeMoney(e.amount)), 0);
}

function currentCash() {
  return normalizeMoney(state.openingCash) + totalPayments() - totalExpenses();
}

function apartmentPaid(apartmentId) {
  return activeEntries()
    .filter(e => e.type === "payment" && Number(e.apartmentId) === Number(apartmentId))
    .reduce((sum, e) => normalizeMoney(sum + normalizeMoney(e.amount)), 0);
}

function apartmentBalance(apartmentId) {
  const apt = state.apartments.find(a => Number(a.id) === Number(apartmentId));
  if (!apt) return 0;
  return normalizeMoney(apartmentPaid(apartmentId) - normalizeMoney(apt.monthlyFee));
}

function sortedEntries() {
  return [...activeEntries()].sort((a, b) => entryDate(b) - entryDate(a));
}

function sortedArchivedEntries() {
  return [...archivedEntries()].sort((a, b) => entryDate(b) - entryDate(a));
}

function entriesForMonth(monthKey) {
  return activeEntries().filter(entry => entryMonthKey(entry) === monthKey);
}

function paymentsForMonth(monthKey) {
  return entriesForMonth(monthKey)
    .filter(entry => entry.type === "payment")
    .reduce((sum, entry) => normalizeMoney(sum + normalizeMoney(entry.amount)), 0);
}

function expensesForMonth(monthKey) {
  return entriesForMonth(monthKey)
    .filter(entry => entry.type === "expense")
    .reduce((sum, entry) => normalizeMoney(sum + normalizeMoney(entry.amount)), 0);
}

function apartmentPaidForMonth(apartmentId, monthKey) {
  return activeEntries()
    .filter(entry =>
      entry.type === "payment" &&
      Number(entry.apartmentId) === Number(apartmentId) &&
      entryMonthKey(entry) === monthKey
    )
    .reduce((sum, entry) => normalizeMoney(sum + normalizeMoney(entry.amount)), 0);
}

function cashBeforeMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);

  let balance = normalizeMoney(state.openingCash);

  for (const entry of activeEntries()) {
    const date = entryDate(entry);
    if (date < monthStart) {
      if (entry.type === "payment") {
        balance = normalizeMoney(balance + normalizeMoney(entry.amount));
      } else if (entry.type === "expense") {
        balance = normalizeMoney(balance - normalizeMoney(entry.amount));
      }
    }
  }

  return balance;
}

function cashAfterMonth(monthKey) {
  return normalizeMoney(cashBeforeMonth(monthKey) + paymentsForMonth(monthKey) - expensesForMonth(monthKey));
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setReportStatus(text, kind = "") {
  reportStatus = { text, kind };
  render();
}

function clearReportStatus() {
  reportStatus = { text: "", kind: "" };
}

function buildSummaryReportText(monthKey) {
  const lines = [];
  const monthEntries = sortedEntries().filter(entry => entryMonthKey(entry) === monthKey);

  lines.push("TÁRSASHÁZ ÓVODA UTCA 6/A");
  lines.push("HAVI HÁZPÉNZTÁR REPORT");
  lines.push(`${monthLabelHu(monthKey)} (${monthKey})`);
  lines.push("");
  lines.push(`Hónap: ${monthLabelHu(monthKey)} (${monthKey})`);
  lines.push(`Generálva: ${nowStamp()}`);
  lines.push("");
  lines.push(`Nyitó egyenleg a hónap elején: ${formatFt(cashBeforeMonth(monthKey))}`);
  lines.push(`Havi befizetések összesen: ${formatFt(paymentsForMonth(monthKey))}`);
  lines.push(`Havi kiadások összesen: ${formatFt(expensesForMonth(monthKey))}`);
  lines.push(`Záró egyenleg a hónap végén: ${formatFt(cashAfterMonth(monthKey))}`);
  lines.push("");
  lines.push("LAKÁSONKÉNTI ÖSSZESÍTÉS");
  lines.push("");

  for (const apt of state.apartments) {
    const paid = apartmentPaidForMonth(apt.id, monthKey);
    const monthlyBalance = normalizeMoney(paid - normalizeMoney(apt.monthlyFee));

    lines.push(
      `${apt.id}. ${apt.name} | Havi közös költség: ${formatFt(apt.monthlyFee)} | Befizetve: ${formatFt(paid)} | Havi egyenleg: ${formatFt(monthlyBalance)}`
    );
  }

  lines.push("");
  lines.push("HAVI PÉNZTÁRNAPLÓ");
  lines.push("");

  if (monthEntries.length === 0) {
    lines.push("Ebben a hónapban nincs rögzített tétel.");
  } else {
    for (const entry of monthEntries) {
      if (entry.type === "payment") {
        lines.push(
          `${entry.createdAt} | BEFIZETÉS | ${entry.apartmentName} | ${entry.monthLabel || "-"} | ${entry.note || "-"} | +${formatFt(entry.amount)}`
        );
      } else {
        lines.push(
          `${entry.createdAt} | KIADÁS | ${entry.title} | ${entry.note || "-"} | -${formatFt(entry.amount)}`
        );
      }
    }
  }

  return lines.join("\n");
}

function buildApartmentReportText(apartment, monthKey) {
  const monthPayments = sortedEntries().filter(entry =>
    entry.type === "payment" &&
    Number(entry.apartmentId) === Number(apartment.id) &&
    entryMonthKey(entry) === monthKey
  );

  const paid = apartmentPaidForMonth(apartment.id, monthKey);
  const monthlyFee = normalizeMoney(apartment.monthlyFee);
  const monthlyBalance = normalizeMoney(paid - monthlyFee);

  const lines = [];
  lines.push("TÁRSASHÁZ ÓVODA UTCA 6/A");
  lines.push("LAKÁSONKÉNTI HAVI REPORT");
  lines.push(`${monthLabelHu(monthKey)} (${monthKey})`);
  lines.push("");
  lines.push(`Lakás: ${apartment.name}`);
  lines.push(`Lakás azonosító: ${apartment.id}`);
  lines.push(`Hónap: ${monthLabelHu(monthKey)} (${monthKey})`);
  lines.push(`Generálva: ${nowStamp()}`);
  lines.push("");
  lines.push(`Havi közös költség: ${formatFt(monthlyFee)}`);
  lines.push(`Ebben a hónapban befizetve: ${formatFt(paid)}`);
  lines.push(`Havi egyenleg: ${formatFt(monthlyBalance)}`);
  lines.push("");
  lines.push("HAVI BEFIZETÉSI TÉTELEK");
  lines.push("");

  if (monthPayments.length === 0) {
    lines.push("Ebben a hónapban nincs befizetés rögzítve ehhez a lakáshoz.");
  } else {
    for (const entry of monthPayments) {
      lines.push(
        `${entry.createdAt} | ${entry.monthLabel || "-"} | ${entry.note || "-"} | ${formatFt(entry.amount)}`
      );
    }
  }

  return lines.join("\n");
}

function buildMonthlyReports(monthKey) {
  const reports = [];

  reports.push({
    filename: `hazpenztar_osszefoglalo_${monthKey}.pdf`,
    title: `Házpénztár összefoglaló - ${monthLabelHu(monthKey)}`,
    content: buildSummaryReportText(monthKey)
  });

  for (const apt of state.apartments) {
    reports.push({
      filename: `lakas_${apt.id}_${monthKey}.pdf`,
      title: `${apt.name} havi report - ${monthLabelHu(monthKey)}`,
      content: buildApartmentReportText(apt, monthKey)
    });
  }

  return reports;
}

function renderEntryRows(entries, archivedMode = false) {
  if (entries.length === 0) {
    return `
      <tr>
        <td colspan="5">${archivedMode ? "Még nincs archivált tétel." : "Még nincs rögzített tétel."}</td>
      </tr>
    `;
  }

  return entries.map(entry => `
    <tr class="${archivedMode ? "archived-row" : ""}">
      <td>${escapeHtml(entry.createdAt)}</td>
      <td>${entry.type === "payment" ? "Befizetés" : "Kiadás"}</td>
      <td>
        ${entry.type === "payment"
          ? `<strong>${escapeHtml(entry.apartmentName)}</strong> – ${escapeHtml(entry.monthLabel || "")}${entry.note ? ` – ${escapeHtml(entry.note)}` : ""}`
          : `<strong>${escapeHtml(entry.title)}</strong>${entry.note ? ` – ${escapeHtml(entry.note)}` : ""}`
        }
      </td>
      <td class="${entry.type === "payment" ? "positive" : "negative"}">
        ${entry.type === "payment" ? "+" : "-"} ${formatFt(entry.amount)}
      </td>
      <td>
        ${archivedMode
          ? `<button class="secondary" onclick="app.restoreEntry('${entry.id}')">Visszaállítás</button>`
          : `<button class="danger" onclick="app.archiveEntry('${entry.id}')">Archiválás</button>`
        }
      </td>
    </tr>
  `).join("");
}

function render() {
  const archivedCount = archivedEntries().length;
  const currentMonthKey = monthKeyFromDate(new Date());

  document.body.innerHTML = `
  <div id="curtainOverlay">
    <div class="curtain left"></div>
    <div class="curtain right"></div>
    <div id="curtainTitle">🎭 Felgördül a függöny...</div>
  </div>

  <div id="appRoot">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-icon">🏠</div>
        <div class="topbar-texts">
          <div class="topbar-title">Társasház Óvoda utca 6/a házpénztár</div>
          <div class="topbar-subtitle">Óvoda utca 6/a</div>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <button class="menu" data-section="overviewSection">Áttekintés</button>
        <button class="menu" data-section="apartmentsSection">Lakások</button>
        <button class="menu" data-section="paymentsSection">Befizetések</button>
        <button class="menu" data-section="expensesSection">Kiadások</button>
        <button class="menu" data-section="ledgerSection">Pénztárnapló</button>
        <button class="menu" data-section="settingsSection">Beállítások</button>
      </aside>

      <main class="content">

        <section id="overviewSection" class="app-section card">
          <h2>Áttekintés</h2>
          <div class="stats">
            <div class="stat">
              <div class="stat-title">Nyitó készpénz</div>
              <div class="stat-value">${formatFt(state.openingCash)}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Összes befizetés</div>
              <div class="stat-value">${formatFt(totalPayments())}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Összes kiadás</div>
              <div class="stat-value">${formatFt(totalExpenses())}</div>
            </div>
            <div class="stat">
              <div class="stat-title">Aktuális pénztár</div>
              <div class="stat-value highlight">${formatFt(currentCash())}</div>
            </div>
          </div>
        </section>

        <section id="apartmentsSection" class="app-section card">
          <h2>Lakások</h2>
          <table class="table">
            <thead>
              <tr>
                <th>Lakás</th>
                <th>Havi közös költség</th>
                <th>Befizetve</th>
                <th>Egyenleg</th>
              </tr>
            </thead>
            <tbody>
              ${state.apartments.map(apt => `
                <tr>
                  <td>
                    <input
                      class="text-input"
                      value="${escapeHtml(apt.name)}"
                      onchange="app.renameApartment(${apt.id}, this.value)"
                    />
                  </td>
                  <td>
                    <input
                      class="number-input"
                      type="number"
                      min="0"
                      value="${normalizeMoney(apt.monthlyFee)}"
                      onchange="app.setMonthlyFee(${apt.id}, this.value)"
                    />
                  </td>
                  <td>${formatFt(apartmentPaid(apt.id))}</td>
                  <td class="${apartmentBalance(apt.id) >= 0 ? "positive" : "negative"}">
                    ${formatFt(apartmentBalance(apt.id))}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </section>

        <section id="paymentsSection" class="app-section card">
          <h2>Új befizetés</h2>

          <div class="form-grid">
            <div>
              <label>Lakás</label>
              <select id="paymentApartment" class="text-input full">
                ${state.apartments.map(apt => `
                  <option value="${apt.id}">${escapeHtml(apt.name)}</option>
                `).join("")}
              </select>
            </div>

            <div>
              <label>Összeg</label>
              <input id="paymentAmount" class="number-input full" type="number" min="0" value="12000" />
            </div>

            <div>
              <label>Hónap / megjegyzés</label>
              <input id="paymentMonth" class="text-input full" type="text" value="${new Date().toLocaleDateString("hu-HU", { year: "numeric", month: "long" })}" />
            </div>

            <div>
              <label>Megjegyzés</label>
              <input id="paymentNote" class="text-input full" type="text" placeholder="opcionális" />
            </div>
          </div>

          <button class="primary mt16" onclick="app.addPayment()">Befizetés rögzítése</button>
        </section>

        <section id="expensesSection" class="app-section card">
          <h2>Új kiadás</h2>

          <div class="form-grid">
            <div>
              <label>Tétel megnevezése</label>
              <input id="expenseTitle" class="text-input full" type="text" placeholder="pl. szemétszállítás" />
            </div>

            <div>
              <label>Összeg</label>
              <input id="expenseAmount" class="number-input full" type="number" min="0" />
            </div>

            <div class="span-2">
              <label>Megjegyzés</label>
              <input id="expenseNote" class="text-input full" type="text" placeholder="opcionális" />
            </div>
          </div>

          <button class="primary mt16" onclick="app.addExpense()">Kiadás rögzítése</button>
        </section>

        <section id="ledgerSection" class="app-section card">
          <div class="section-head">
            <h2>Pénztárnapló</h2>
            <div class="archived-badge">Archivált tételek: ${archivedCount}</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Típus</th>
                <th>Részletek</th>
                <th>Összeg</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${renderEntryRows(sortedEntries(), false)}
            </tbody>
          </table>

          <div class="archived-panel">
            <button class="secondary mt16" onclick="app.toggleArchivedEntries()">
              ${state.uiSettings.showArchivedEntries ? "Archivált tételek elrejtése" : "Archivált tételek megjelenítése"}
            </button>

            ${state.uiSettings.showArchivedEntries ? `
              <div class="archived-box mt16">
                <h3>Archivált tételek</h3>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Dátum</th>
                      <th>Típus</th>
                      <th>Részletek</th>
                      <th>Összeg</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${renderEntryRows(sortedArchivedEntries(), true)}
                  </tbody>
                </table>
              </div>
            ` : ""}
          </div>
        </section>

        <section id="settingsSection" class="app-section card">
          <h2>Beállítások és titkos parancs</h2>

          <div class="form-row">
            <label>Nyitó készpénz</label>
            <input
              id="openingCashInput"
              class="number-input"
              type="number"
              min="0"
              value="${normalizeMoney(state.openingCash)}"
            />
            <button class="primary" onclick="app.saveOpeningCash()">Mentés</button>
          </div>

          <hr class="sep" />

          <div>
            <h3>Titkos parancs</h3>
            <div class="inline-actions">
              <input
                id="secretCommand"
                class="text-input"
                type="password"
                placeholder="titkos szó..."
                autocomplete="new-password"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
              />
              <button type="button" class="primary" onclick="app.checkEasterEgg()">Ellenőrzés</button>
            </div>
            <div id="easterResult" class="mt12"></div>
          </div>

          <hr class="sep" />

          <div>
            <h3>Havi PDF reportok</h3>

            <div class="form-grid">
              <div class="span-2">
                <label>Célmappa a Mac-en</label>
                <input
                  class="text-input full"
                  type="text"
                  value="${escapeHtml(state.reportSettings.targetFolder || "")}"
                  placeholder="Még nincs kiválasztva"
                  readonly
                />
              </div>

              <div class="span-2 report-actions">
                <button class="primary" type="button" onclick="app.chooseReportFolder()">Mappa kiválasztása</button>
                <button class="primary" type="button" onclick="app.generateMonthlyReportsNow()">Havi report készítése most</button>
                <button class="primary" type="button" onclick="app.exportBackup()">Adatbázis export / backup</button>
				<input type="file" id="jsonImportInput" accept=".json" style="display:none" onchange="app.importJson()" />
				<button onclick="document.getElementById('jsonImportInput').click()">Adatbázis JSON import</button>
			  </div>

              <div class="span-2 checkbox-row">
                <input
                  id="autoMonthlyEnabled"
                  type="checkbox"
                  ${state.reportSettings.autoMonthlyEnabled ? "checked" : ""}
                  onchange="app.setAutoMonthlyEnabled(this.checked)"
                />
                <label for="autoMonthlyEnabled" class="checkbox-label">Havonta egyszer automatikus generálás</label>
              </div>

              <div class="span-2 hint-text">
                Aktuális hónap: <strong>${currentMonthKey}</strong><br>
                Reporton megjelenő hónap: <strong>${escapeHtml(monthLabelHu(currentMonthKey))}</strong><br>
                Utoljára legenerált hónap: <strong>${escapeHtml(state.reportSettings.lastGeneratedMonth || "még nincs")}</strong>
              </div>

              ${reportStatus.text ? `
                <div class="span-2 status-box ${reportStatus.kind}">
                  ${escapeHtml(reportStatus.text)}
                </div>
              ` : ""}
            </div>
          </div>
        </section>

      </main>
    </div>

    <footer class="footer">
      Created by Deme Gábor © 2026
    </footer>
  </div>

  <div id="signatureOverlay">
    <div id="signatureBox">
      <div id="signatureTitle">🎭 Easter Egg</div>
      <div id="signatureText">Created by Deme Gábor © 2026</div>
      <button id="signatureClose" class="primary">Bezárás</button>
    </div>
  </div>

  <style>
    * { box-sizing: border-box; }
    body { margin:0; background:#f3f5f7; color:#1f2937; font-family: Arial, sans-serif; }

    .topbar {
      background:#1f2937;
      color:white;
      padding:18px 22px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    }

    .topbar-inner {
      display:flex;
      align-items:center;
      gap:14px;
    }

    .topbar-icon {
      width:52px;
      height:52px;
      border-radius:14px;
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:28px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.20);
    }

    .topbar-title {
      font-size:24px;
      font-weight:bold;
      line-height:1.1;
    }

    .topbar-subtitle {
      margin-top:4px;
      font-size:13px;
      color:#d1d5db;
    }

    .layout {
      display:flex;
      min-height:calc(100vh - 88px);
    }

    .sidebar {
      width:220px;
      background:#374151;
      color:white;
      padding:20px;
    }

    .menu {
      display:block;
      width:100%;
      margin-bottom:10px;
      padding:11px 12px;
      border:none;
      background:#4b5563;
      color:white;
      cursor:pointer;
      text-align:left;
      border-radius:10px;
      transition:0.15s ease;
    }

    .menu:hover { background:#6b7280; }

    .menu.active {
      background:#f59e0b;
      color:#111827;
      font-weight:bold;
    }

    .content {
      flex:1;
      padding:24px;
    }

    .app-section {
      display:none;
    }

    .app-section.active {
      display:block;
    }

    .card {
      background:white;
      padding:20px;
      border-radius:12px;
      box-shadow:0 2px 10px rgba(0,0,0,0.08);
      margin-bottom:20px;
    }

    .stats {
      display:grid;
      grid-template-columns: repeat(4, 1fr);
      gap:16px;
    }

    .stat {
      background:#f8fafc;
      border-radius:10px;
      padding:16px;
    }

    .stat-title {
      color:#6b7280;
      font-size:14px;
      margin-bottom:8px;
    }

    .stat-value {
      font-size:28px;
      font-weight:bold;
    }

    .highlight { color:#0f766e; }

    .table {
      width:100%;
      border-collapse: collapse;
    }

    .table th, .table td {
      padding:10px;
      border-bottom:1px solid #e5e7eb;
      text-align:left;
      vertical-align:top;
    }

    .text-input, .number-input, select {
      width:100%;
      padding:8px 10px;
      border:1px solid #cbd5e1;
      border-radius:8px;
      font-size:14px;
      background:white;
    }

    .full { width:100%; }
    .mt12 { margin-top:12px; }
    .mt16 { margin-top:16px; }

    .form-row {
      display:grid;
      grid-template-columns: 1fr 160px 120px;
      gap:10px;
      align-items:end;
    }

    .form-grid {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:12px;
    }

    .inline-actions {
      display:grid;
      grid-template-columns: 1fr auto;
      gap:10px;
      align-items:center;
    }

    .report-actions {
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }

    .checkbox-row {
      display:flex;
      align-items:center;
      gap:10px;
      margin-top:2px;
    }

    .checkbox-row input {
      width:auto;
      margin:0;
    }

    .checkbox-label {
      margin:0;
      color:#1f2937;
    }

    .hint-text {
      color:#475569;
      font-size:13px;
      line-height:1.5;
      background:#f8fafc;
      border-radius:10px;
      padding:10px 12px;
    }

    .status-box {
      padding:10px 12px;
      border-radius:10px;
      font-size:14px;
      font-weight:bold;
    }

    .status-box.success {
      background:#ecfdf5;
      color:#065f46;
      border:1px solid #a7f3d0;
    }

    .status-box.error {
      background:#fef2f2;
      color:#991b1b;
      border:1px solid #fecaca;
    }

    .section-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      margin-bottom:10px;
    }

    .archived-badge {
      background:#eef2f7;
      color:#475569;
      font-size:13px;
      padding:8px 12px;
      border-radius:999px;
      font-weight:bold;
    }

    .archived-panel {
      margin-top:16px;
    }

    .archived-box {
      background:#f8fafc;
      border:1px solid #e2e8f0;
      border-radius:12px;
      padding:16px;
    }

    .archived-row td {
      opacity:0.82;
    }

    .span-2 { grid-column: span 2; }

    label {
      display:block;
      margin-bottom:6px;
      font-size:14px;
      color:#475569;
    }

    .primary {
      padding:10px 14px;
      border:none;
      background:#1f2937;
      color:white;
      border-radius:8px;
      cursor:pointer;
    }

    .primary:hover { background:#111827; }

    .secondary {
      padding:10px 14px;
      border:none;
      background:#64748b;
      color:white;
      border-radius:8px;
      cursor:pointer;
    }

    .secondary:hover { background:#475569; }

    .danger {
      padding:7px 10px;
      border:none;
      background:#991b1b;
      color:white;
      border-radius:8px;
      cursor:pointer;
    }

    .danger:hover { background:#7f1d1d; }

    .positive { color:#065f46; font-weight:bold; }
    .negative { color:#991b1b; font-weight:bold; }

    .sep {
      border:none;
      border-top:1px solid #e5e7eb;
      margin:18px 0;
    }

    .footer {
      position:fixed;
      right:18px;
      bottom:10px;
      font-size:12px;
      color:#6b7280;
    }

    #signatureOverlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.72);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    #signatureBox {
      background: white;
      padding: 30px 36px;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 520px;
    }

    #signatureTitle {
      font-size: 30px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    #signatureText {
      font-size: 20px;
      color: #374151;
      margin-bottom: 16px;
    }

    #curtainOverlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      overflow: hidden;
      background: #12070a;
    }

    .curtain {
      position: absolute;
      top: 0;
      width: 50%;
      height: 100%;
      background:
        repeating-linear-gradient(
          90deg,
          #5b0f17 0px,
          #7d1621 18px,
          #8f1c29 36px,
          #6d121c 54px
        );
      box-shadow: inset -10px 0 20px rgba(0,0,0,0.25);
    }

    .curtain.left {
      left: 0;
      animation: curtainLeftOpen 2.2s ease-in-out forwards;
    }

    .curtain.right {
      right: 0;
      animation: curtainRightOpen 2.2s ease-in-out forwards;
      box-shadow: inset 10px 0 20px rgba(0,0,0,0.25);
    }

    #curtainTitle {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #f8e7b0;
      font-size: 34px;
      font-weight: bold;
      text-shadow: 0 2px 10px rgba(0,0,0,0.45);
      animation: titleFade 1.4s ease forwards;
    }

    @keyframes curtainLeftOpen {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }

    @keyframes curtainRightOpen {
      0% { transform: translateX(0); }
      100% { transform: translateX(100%); }
    }

    @keyframes titleFade {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }

    @media (max-width: 1200px) {
      .stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 900px) {
      .layout {
        flex-direction: column;
      }

      .sidebar {
        width: 100%;
      }

      .form-grid,
      .form-row {
        grid-template-columns: 1fr;
      }

      .span-2 {
        grid-column: span 1;
      }

      .footer {
        position: static;
        padding: 0 24px 16px;
      }
    }
  </style>
  `;

  attachEvents();
  attachMenuHandlers();
  handleCurtain();
  queueAutoMonthlyCheck();
  applyActiveSection(getActiveSection());
}

function attachEvents() {
  const signatureOverlay = document.getElementById("signatureOverlay");
  const signatureClose = document.getElementById("signatureClose");

  if (signatureClose) {
    signatureClose.addEventListener("click", function () {
      signatureOverlay.style.display = "none";
    });
  }

  if (signatureOverlay) {
    signatureOverlay.addEventListener("click", function (event) {
      if (event.target === signatureOverlay) {
        signatureOverlay.style.display = "none";
      }
    });
  }

  const secretInput = document.getElementById("secretCommand");
  if (secretInput) {
    secretInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        app.checkEasterEgg();
      }
    });
  }
}

function attachMenuHandlers() {
  const buttons = document.querySelectorAll(".menu[data-section]");
  buttons.forEach(button => {
    button.addEventListener("click", function () {
      const sectionId = button.dataset.section;
      applyActiveSection(sectionId);
      setActiveSection(sectionId);
    });
  });
}

function applyActiveSection(sectionId) {
  const validIds = [
    "overviewSection",
    "apartmentsSection",
    "paymentsSection",
    "expensesSection",
    "ledgerSection",
    "settingsSection"
  ];

  const finalSectionId = validIds.includes(sectionId) ? sectionId : "overviewSection";

  document.querySelectorAll(".app-section").forEach(section => {
    section.classList.remove("active");
  });

  document.querySelectorAll(".menu[data-section]").forEach(button => {
    button.classList.remove("active");
  });

  const activeSection = document.getElementById(finalSectionId);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  const activeButton = document.querySelector(`.menu[data-section="${finalSectionId}"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }
}

function handleCurtain() {
  const curtainOverlay = document.getElementById("curtainOverlay");
  if (!curtainOverlay) return;

  if (!localStorage.getItem("curtainPlayed")) {
    setTimeout(function () {
      curtainOverlay.style.transition = "opacity 0.8s ease";
      curtainOverlay.style.opacity = "0";
    }, 2300);

    setTimeout(function () {
      curtainOverlay.remove();
    }, 3200);

    localStorage.setItem("curtainPlayed", "yes");
  } else {
    curtainOverlay.remove();
  }
}

function queueAutoMonthlyCheck() {
  if (autoMonthlyCheckStarted) return;
  autoMonthlyCheckStarted = true;

  setTimeout(function () {
    app.autoGenerateMonthlyReportsIfNeeded();
  }, 500);
}

const app = {
  renameApartment(id, value) {
    const apt = state.apartments.find(a => Number(a.id) === Number(id));
    if (!apt) return;
    apt.name = value.trim() || `Lakás ${id}`;
    for (const entry of state.entries) {
      if (entry.type === "payment" && Number(entry.apartmentId) === Number(id)) {
        entry.apartmentName = apt.name;
      }
    }
    saveState();
    render();
  },

  setMonthlyFee(id, value) {
    const apt = state.apartments.find(a => Number(a.id) === Number(id));
    if (!apt) return;
    apt.monthlyFee = positiveMoneyFromInput(value);
    saveState();
    render();
  },

  saveOpeningCash() {
    const input = document.getElementById("openingCashInput");
    state.openingCash = positiveMoneyFromInput(input.value);
    saveState();
    render();
  },

  setAutoMonthlyEnabled(checked) {
    state.reportSettings.autoMonthlyEnabled = Boolean(checked);
    saveState();
    clearReportStatus();
    render();
  },

  toggleArchivedEntries() {
    state.uiSettings.showArchivedEntries = !state.uiSettings.showArchivedEntries;
    saveState();
    render();
  },

  async chooseReportFolder() {
    clearReportStatus();

    try {
      const dialog = window.__TAURI__?.dialog;
      if (!dialog || typeof dialog.open !== "function") {
        throw new Error("A Tauri dialog API nem érhető el.");
      }

      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: "Havi report mappa kiválasztása"
      });

      if (!selected || Array.isArray(selected)) return;

      state.reportSettings.targetFolder = String(selected);
      saveState();
      setReportStatus("A report célmappa elmentve.", "success");
    } catch (error) {
      setReportStatus(`Mappaválasztási hiba: ${error.message || error}`, "error");
    }
  },

  async generateMonthlyReports(monthKey, automaticMode = false) {
    if (!state.reportSettings.targetFolder) {
      throw new Error("Előbb válassz ki egy célmappát a reportokhoz.");
    }

    const core = window.__TAURI__?.core;
    if (!core || typeof core.invoke !== "function") {
      throw new Error("A Tauri invoke API nem érhető el.");
    }

    const reports = buildMonthlyReports(monthKey);

    const savedFolder = await core.invoke("save_monthly_reports", {
      targetFolder: state.reportSettings.targetFolder,
      monthKey,
      reports
    });

    state.reportSettings.lastGeneratedMonth = monthKey;
    saveState();

    if (!automaticMode) {
      setReportStatus(`A havi reportok elkészültek ide: ${savedFolder}`, "success");
    }

    return savedFolder;
  },

  async generateMonthlyReportsNow() {
    clearReportStatus();

    try {
      const monthKey = monthKeyFromDate(new Date());
      await this.generateMonthlyReports(monthKey, false);
    } catch (error) {
      setReportStatus(`Report generálási hiba: ${error.message || error}`, "error");
    }
  },

  async autoGenerateMonthlyReportsIfNeeded() {
    try {
      if (!state.reportSettings.autoMonthlyEnabled) return;
      if (!state.reportSettings.targetFolder) return;

      const monthKey = monthKeyFromDate(new Date());
      if (state.reportSettings.lastGeneratedMonth === monthKey) return;

      await this.generateMonthlyReports(monthKey, true);
      setReportStatus(`Automatikus havi report elkészült: ${monthKey}`, "success");
    } catch (error) {
      setReportStatus(`Automatikus havi report hiba: ${error.message || error}`, "error");
    }
  },

  exportBackup() {
    try {
      const backup = {
        exportedAt: nowStamp(),
        exportedAtIso: nowIso(),
        app: "Társasház Óvoda utca 6/a házpénztár",
        version: "V1.1",
        data: state
      };

      const fileName = `hazpenztar_backup_${monthKeyFromDate(new Date())}_${pad2(new Date().getDate())}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);

      setReportStatus(`Backup export elkészült: ${fileName}`, "success");
    } catch (error) {
      setReportStatus(`Backup hiba: ${error.message || error}`, "error");
    }
  },

  addPayment() {
    const apartmentId = Number(document.getElementById("paymentApartment").value);
    const amount = positiveMoneyFromInput(document.getElementById("paymentAmount").value);
    const monthLabel = document.getElementById("paymentMonth").value.trim();
    const note = document.getElementById("paymentNote").value.trim();

    if (!amount || amount <= 0) {
      alert("Adj meg érvényes befizetési összeget.");
      return;
    }

    const apt = state.apartments.find(a => Number(a.id) === apartmentId);
    if (!apt) return;

    state.entries.push({
      id: crypto.randomUUID(),
      type: "payment",
      apartmentId,
      apartmentName: apt.name,
      amount,
      monthLabel,
      note,
      archived: false,
      createdAt: nowStamp(),
      createdAtIso: nowIso()
    });

    saveState();
    render();
    setActiveSection("paymentsSection");
  },

  addExpense() {
    const title = document.getElementById("expenseTitle").value.trim();
    const amount = positiveMoneyFromInput(document.getElementById("expenseAmount").value);
    const note = document.getElementById("expenseNote").value.trim();

    if (!title) {
      alert("Adj meg kiadási tételnevet.");
      return;
    }

    if (!amount || amount <= 0) {
      alert("Adj meg érvényes kiadási összeget.");
      return;
    }

    state.entries.push({
      id: crypto.randomUUID(),
      type: "expense",
      title,
      amount,
      note,
      archived: false,
      createdAt: nowStamp(),
      createdAtIso: nowIso()
    });

    saveState();
    render();
    setActiveSection("expensesSection");
  },

  archiveEntry(id) {
    if (!confirm("A tétel nem törlődik, csak archiválva lesz. Folytatod?")) return;

    const entry = state.entries.find(e => e.id === id);
    if (!entry) return;

    entry.archived = true;
    saveState();
    render();
    setActiveSection("ledgerSection");
  },

  restoreEntry(id) {
    const entry = state.entries.find(e => e.id === id);
    if (!entry) return;

    entry.archived = false;
    saveState();
    render();
    setActiveSection("ledgerSection");
  },

  checkEasterEgg() {
    const input = document.getElementById("secretCommand");
    const result = document.getElementById("easterResult");
    const signatureOverlay = document.getElementById("signatureOverlay");

    if (!input || !result || !signatureOverlay) return;

    const value = input.value.trim().toLowerCase();

    if (value === "deme") {
      result.textContent = "Talált, süllyedt. 😉";
      result.className = "positive mt12";
      signatureOverlay.style.display = "flex";
      input.value = "";
    } else if (!value) {
      result.textContent = "Írj be valamit.";
      result.className = "negative mt12";
    } else {
      result.textContent = "Ez most még nem a helyes varázsszó.";
      result.className = "negative mt12";
      input.value = "";
    }
  },

  replayCurtain() {
    localStorage.removeItem("curtainPlayed");
    render();
  },

  importJson() {
    const input = document.getElementById("jsonImportInput");

    if (!input || !input.files || !input.files[0]) {
      alert("Válassz ki egy JSON fájlt!");
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const json = JSON.parse(event.target.result);

        if (!json || !json.data || typeof json.data !== "object") {
          alert("Hibás JSON formátum!");
          return;
        }

        createAutoBackup("before_json_import");
        state = normalizeState(json.data);
        saveState();
        render();

        alert("Sikeres import!");
      } catch (err) {
        console.error(err);
        alert("Hiba történt a betöltés során!");
      } finally {
        input.value = "";
      }
    };

    reader.readAsText(file);
  }
};

window.app = app;

console.log("Created by Deme Gábor © 2026");
window.__deme_signature = "Created by Deme Gábor © 2026";

render();
