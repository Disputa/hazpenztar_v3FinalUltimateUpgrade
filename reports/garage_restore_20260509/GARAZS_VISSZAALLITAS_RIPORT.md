# Garázs visszaállítás riport

Készült: 2026-05-08T22:21:23.026Z

## Források
- Friss adatmentés: D:\Saját meghajtó\Deme_Gabor_Archivum\Programozas\CODEING\CODEING\Házpénztár Óvoda utca 6a\MacBackupForUpdate\hazpenztar_backup_2026-05_08.json
- Régi, garázsokat tartalmazó mentés: C:\Users\Deme\Desktop\CODEX_PROJECTS\03_Ovoda6a_Hazpenztar\reports\mac_backup_extract_20260509_002021\ovoda6a_mac_mentes_2026-05-08_16-00-50\HaĚzpeĚnztaĚr OĚvoda 6a\V3FinalUltimateUpgrade\backup_json\hazpenztar_backup_2026-03_22_TISZTITOTT.json

## Megállapítás
- A friss mentés apartments listája 5 elemet tartalmazott.
- A régi mentés apartments listája 7 elemet tartalmazott.
- Hiányzó garázs törzsadat: 2 db.
  - id=6, name=Garázs 1, monthlyFee=12000
  - id=7, name=Garázs 2, monthlyFee=12000
- A friss mentésben garázs nevű tranzakció: 6 db.
- Javítás után hiányzó apartmentId hivatkozás: 0 db.

## Elkészült javított fájl
- C:\Users\Deme\Desktop\CODEX_PROJECTS\03_Ovoda6a_Hazpenztar\reports\garage_restore_20260509\hazpenztar_backup_2026-05_08_GARAZS_VISSZAALLITVA.json

## Mit módosítottam a javított JSON-ban
- Nem írtam felül az eredeti 2026-05-08 mentést.
- A friss mentés adatai és 544 tranzakciója megmaradt.
- Az apartments törzslistába visszakerült a régi mentésből a Garázs 1 és Garázs 2.
