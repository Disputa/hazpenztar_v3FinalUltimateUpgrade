# CODEX_TASKS.md

## Azonnali feladatok

- Helyi forrásmappa megerősítése.
- LOCAL_FILES_MAP.md pontosítása mélyebb vizsgálattal.
- Kockázatos módosítás előtt backup terv készítése.

## Későbbi feladatok

- Build/futtatási folyamat ellenőrzése, ha a projekt kódprojekt.
- Tesztelendő funkciók listázása.
- Jóváhagyás után célzott javítás vagy dokumentációbővítés.
- Programon belüli riport- és mentéskezelés beépítése:
  - havi riportok PDF előnézete az alkalmazáson belül,
  - teljes adatbázis-mentés PDF nézete/összefoglalója az alkalmazáson belül,
  - PDF-ek közvetlen e-mail küldése,
  - PDF-ek közvetlen nyomtatása,
  - export/nyomtatás előtt adatellenőrzés és mentési visszajelzés.

## Elkészült fejlesztések

- PDF munkaterület az alkalmazáson belül:
  - külön `PDF riportok` bal oldali menüpont,
  - havi PDF-ek listázása és előnézete,
  - teljes adatbázis PDF generálása és előnézete,
  - PDF megnyitása,
  - PDF mappájának megnyitása,
  - PDF nyomtatás indítása,
  - e-mail ablak előkészítése PDF csatolmánnyal, ahol az operációs rendszer és a levelező támogatja.
- Update build előkészítve:
  - app identifier változatlan: `com.deme.hazpenztar`,
  - productName változatlan: `hazpenztar`,
  - localStorage kulcs változatlan: `ovoda6a_hazpenztar_state_v1`,
  - verzió emelve: `0.1.3`,
  - Windows update build MSI-only, stabil WiX upgrade azonosítóval.
- Tulajdonosnevek visszaállítása:
  - Lakás 1: Békéssy Klára,
  - Lakás 2: Pócz János,
  - Lakás 3: Fazekas Sándor,
  - Lakás 4: Komoróczki Gábor,
  - Lakás 5: Lits László,
  - Garázs 1: Janauschek Ernő,
  - Garázs 2: Vörös Miklós.
- Saját alkalmazásikon beépítve a Tauri alapikon helyett.

## Blokkoló kérdések

- Ez a megtalált mappa tekinthető-e elsődleges forrásnak?
- Közvetlenül az eredeti mappában dolgozzunk, vagy készüljön külön munkamásolat a source_or_worktree alá?

## Állandó zárófeladat minden módosítás után

- Módosított fájlok listázása.
- Google Drive projektmappa céljának ellenőrzése.
- Szinkronizálás a megfelelő Drive projektmappába.
- CHANGELOG_CODEX.md frissítése.

