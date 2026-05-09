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
- PDF munkaterület implementálva: havi PDF-ek és teljes adatbázis PDF generálása, appon belüli PDF előnézet, megnyitás, mappa megnyitása, nyomtatás, e-mail előkészítés PDF csatolmánnyal.
- Tauri backend bővítve PDF műveleti parancsokkal: `save_pdf_reports`, `read_pdf_base64`, `open_file`, `open_parent_folder`, `print_pdf`, `compose_email_with_pdf`.
- Ellenőrzések lefuttatva a PDF funkció után: `node --check src/main.js`, `npm test`, `cargo fmt --check`, `cargo check`, `npm run tauri build`.
- Update build előkészítve: verzió `0.1.1`, változatlan `com.deme.hazpenztar` identifier, változatlan `hazpenztar` productName és változatlan localStorage kulcs.
- Update build jegyzet készült: `UPDATE_BUILD_NOTES.md`.
- Update build elkészült: `hazpenztar_0.1.1_x64-setup.exe` és `hazpenztar_0.1.1_x64_en-US.msi`.
- Drive-szinkron megtörtént új almappába, törlés nélkül: `CodexSync/update_0.1.1_20260509/`.
- Tulajdonosnevek visszaállítva az állapot-normalizálásban: Lakás 1-5 és Garázs 1-2 generikus nevek helyett tulajdonosnevek.
- PDF funkció külön, látható `PDF riportok` menüpontba került; generálás után az app erre a képernyőre vált.
- Windows update build javítva: NSIS `.exe` helyett MSI-only csomag készül, stabil WiX upgrade azonosítóval.
- Tauri alapikon lecserélve saját házpénztár ikonra; az ikonforrás: `assets/hazpenztar-icon.svg`.
- Verzió emelve `0.1.3`-ra a tulajdonosnevek, a látható PDF menü és a valódi MSI update build miatt.
- Desktop shortcut ikonhiba javítva: az asztali parancsikon explicit `ProductIcon` hivatkozást kap.
- Verzió emelve `0.1.4`-re, hogy a Windows biztosan új update-ként telepítse az ikonjavítást.
- Négyzetméterarányos közösköltség díjtábla visszaállítva a 2026-03-22-es adatbázis alapján: Lakás 1 `12000`, Lakás 2 `9200`, Lakás 3 `7800`, Lakás 4 `6900`, Lakás 5 `4900`, Garázs 1-2 `12000`.
- Állapotmigráció hozzáadva: a korábban 12 000 Ft-ra átlagolt Lakás 2-5 díjakat egyszeri migrációval visszaállítja, miközben a későbbi kézi módosításokat már nem írja felül.
- Verzió emelve `0.1.5`-re az új adatokkal készülő buildhez.

## 2026-05-06

- Codex projektmappa létrehozva.
- Alap dokumentációs fájlok létrehozva.
- Első helyi forrás-/anyagmap készítve.
- Forrásfájl nem lett másolva vagy módosítva.
