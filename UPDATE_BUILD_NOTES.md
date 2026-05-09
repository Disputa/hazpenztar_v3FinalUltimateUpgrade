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
- PDF/update build: `0.1.1`
- Tulajdonosnév update build: `0.1.2`
- Látható PDF menü + MSI-only update build: `0.1.3`
- Desktop ikon javító update build: `0.1.4`

Windows frissítéshez a verziót emelni kell, miközben az app azonosítója változatlan marad. A frissítőcsomag MSI legyen; az NSIS `.exe` telepítő eltávolítási kérdései miatt nem tekintendő update buildnek.

## Update telepítő

- Használandó fájl: `hazpenztar_0.1.4_x64_en-US.msi`
- A build Windows célja szándékosan csak MSI: `bundle.targets = ["msi"]`
- Stabil WiX upgrade azonosító: `f8f9fe9b-1a00-5dd2-ae41-7e21f625d15e`
- A Tauri alapikon helyett saját házpénztár ikon kerül a buildbe.
- A desktop shortcut explicit `ProductIcon` hivatkozást kap, hogy ne maradjon rajta a Tauri alapikon.

## Ellenőrzés telepítés előtt

1. Készíts JSON exportot az éles programból.
2. Futtasd az új `hazpenztar_0.1.4_x64_en-US.msi` telepítőt.
3. Indítás után ellenőrizd, hogy a korábbi adatok megmaradtak.
4. Ellenőrizd a garázsokat, a tulajdonosneveket, a pénztárösszeget és a `PDF riportok` menüpontot.
