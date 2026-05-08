# Update build notes

## Cél

Az elkészült Windows telepítő frissítésként fusson a korábbi Óvoda utca 6/a házpénztár telepítésre, ne külön új alkalmazásként.

## Megtartandó azonosítók

- `src-tauri/tauri.conf.json` / `identifier`: `com.deme.hazpenztar`
- `src-tauri/tauri.conf.json` / `productName`: `hazpenztar`
- localStorage kulcs: `ovoda6a_hazpenztar_state_v1`

Ezeket nem szabad átnevezni, mert az adatmegőrzés és a frissítési útvonal ezekhez kötődik.

## Verziózás

- Korábbi build: `0.1.0`
- Jelen update build: `0.1.1`

Windows MSI/NSIS frissítéshez a verziót emelni kell, miközben az app azonosítója változatlan marad.

## Ellenőrzés telepítés előtt

1. Készíts JSON exportot az éles programból.
2. Futtasd az új `hazpenztar_0.1.1_x64-setup.exe` telepítőt.
3. Indítás után ellenőrizd, hogy a korábbi adatok megmaradtak.
4. Ellenőrizd a garázsokat, a pénztárösszeget és a PDF munkaterületet.
