# CHANGELOG_CODEX.md

## 2026-05-09

- Friss Mac-mentés vizsgálata: `MacBackupForUpdate/hazpenztar_backup_2026-05_08.json` és `MacBackupForUpdate/ovoda6a_mac_mentes.zip`.
- Garázs eltűnésének oka azonosítva: a friss mentésben a garázs tranzakciók megvannak, de a `Garázs 1` és `Garázs 2` hiányzik az `apartments` törzslistából.
- Javított, eredetit nem felülíró JSON készült: `reports/garage_restore_20260509/hazpenztar_backup_2026-05_08_GARAZS_VISSZAALLITVA.json`.
- Riport készült: `reports/garage_restore_20260509/GARAZS_VISSZAALLITAS_RIPORT.md`.
- Drive-szinkron megtörtént új almappába, törlés és felülírás nélkül: `MacBackupForUpdate/garage_restore_20260509/`.
- GitHub-szinkron előkészítve a `Disputa/hazpenztar_v3FinalUltimateUpgrade` repóba külön `codex/garage-restore-backup` ágon.
- Új későbbi fejlesztési feladat felvéve: havi riportok és teljes adatbázis-mentés programon belüli PDF előnézete, e-mail küldése és nyomtatása.
- Teljes kód- és adataudit elindítva, előtte repo- és adatbackup készült.
- Kódstabilizálás: garázsokat megtartó állapotbetöltés/import, központi pénzösszeg-normalizálás, JSON import előtti automatikus backup.
- Automatizált pénzügyi audit teszt hozzáadva: `tests/finance-audit.test.mjs`.
- Adat- és kódaudit riport készült: `reports/full_audit_20260509/ADAT_ES_KOD_AUDIT_RIPORT.md`.
- Ellenőrzések lefuttatva: `npm test`, `node --check src/main.js`, `cargo check`, `npm run tauri build`.
- Windows build elkészült verziózott kimenetként: `builds/full_audit_20260509/`.
- Drive-szinkron megtörtént új almappába, törlés nélkül: `CodexSync/full_audit_20260509/` és `CodexSync/full_audit_20260509/source_changes/`.

## 2026-05-06

- Codex projektmappa létrehozva.
- Alap dokumentációs fájlok létrehozva.
- Első helyi forrás-/anyagmap készítve.
- Forrásfájl nem lett másolva vagy módosítva.
