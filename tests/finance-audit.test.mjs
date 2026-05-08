import assert from "node:assert/strict";
import fs from "node:fs";

const dataPath = new URL("../reports/garage_restore_20260509/hazpenztar_backup_2026-05_08_GARAZS_VISSZAALLITVA.json", import.meta.url);
const backup = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const data = backup.data;

const defaultApartments = [
  { id: 1, name: "Lakás 1", monthlyFee: 12000 },
  { id: 2, name: "Lakás 2", monthlyFee: 12000 },
  { id: 3, name: "Lakás 3", monthlyFee: 12000 },
  { id: 4, name: "Lakás 4", monthlyFee: 12000 },
  { id: 5, name: "Lakás 5", monthlyFee: 12000 },
  { id: 6, name: "Garázs 1", monthlyFee: 12000 },
  { id: 7, name: "Garázs 2", monthlyFee: 12000 }
];

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

function normalizeApartments(apartments, entries = []) {
  const byId = new Map(defaultApartments.map(apartment => [apartment.id, { ...apartment }]));

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

  return [...byId.values()].sort((a, b) => a.id - b.id);
}

function normalizeEntries(entries, apartments) {
  const apartmentById = new Map(apartments.map(apartment => [apartment.id, apartment]));

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
          normalized.apartmentId = apartmentId;
          normalized.apartmentName = apartmentById.get(apartmentId)?.name || normalized.apartmentName;
        } else {
          normalized.apartmentId = null;
          normalized.apartmentName = String(normalized.apartmentName || "Kézi ellenőrzés szükséges");
        }
      }

      return normalized;
    })
    .filter(entry => entry.amount > 0);
}

function normalizeState(input) {
  const apartments = normalizeApartments(input.apartments, input.entries);
  return {
    openingCash: normalizeMoney(input.openingCash),
    apartments,
    entries: normalizeEntries(input.entries, apartments)
  };
}

const normalized = normalizeState(data);
const apartmentIds = new Set(normalized.apartments.map(apartment => apartment.id));
const entryIds = normalized.entries.map(entry => entry.id);

assert.equal(normalized.apartments.length, 7, "A törzslistában 5 lakásnak és 2 garázsnak kell lennie.");
assert.deepEqual(
  normalized.apartments.filter(apartment => apartment.name.includes("Garázs")).map(apartment => apartment.name),
  ["Garázs 1", "Garázs 2"]
);
assert.equal(normalized.entries.length, 544, "A javított mentésből nem veszhet el tranzakció.");
assert.equal(new Set(entryIds).size, entryIds.length, "Nem lehet duplikált tranzakció ID.");
assert.equal(
  normalized.entries.filter(entry =>
    entry.type === "payment" &&
    entry.apartmentId !== null &&
    !apartmentIds.has(entry.apartmentId)
  ).length,
  0,
  "Minden befizetésnek létező lakás/garázs törzsadatra kell mutatnia."
);
assert.equal(
  normalized.entries.filter(entry => !Number.isFinite(entry.amount) || entry.amount <= 0).length,
  0,
  "Minden tranzakció összege pozitív, számolható érték kell legyen."
);

const activeEntries = normalized.entries.filter(entry => !entry.archived);
const payments = activeEntries
  .filter(entry => entry.type === "payment")
  .reduce((sum, entry) => normalizeMoney(sum + entry.amount), 0);
const expenses = activeEntries
  .filter(entry => entry.type === "expense")
  .reduce((sum, entry) => normalizeMoney(sum + entry.amount), 0);
const cash = normalizeMoney(normalized.openingCash + payments - expenses);

assert.equal(payments, 4464223);
assert.equal(expenses, 4150759);
assert.equal(cash, 313464);

console.log("Finance audit OK", {
  apartments: normalized.apartments.length,
  entries: normalized.entries.length,
  payments,
  expenses,
  cash
});
