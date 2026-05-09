# Adat- és kódaudit riport

Készült: 2026-05-09

## Vizsgált adatfájl

- `reports/garage_restore_20260509/hazpenztar_backup_2026-05_08_GARAZS_VISSZAALLITVA.json`

## Adatállapot

- Törzsadatok: 7 db: Lakás 1, Lakás 2, Lakás 3, Lakás 4, Lakás 5, Garázs 1, Garázs 2.
- Tranzakciók: 544 db.
- Aktív tranzakciók: 543 db.
- Archivált tranzakciók: 1 db.
- Aktív befizetések összege: 4 464 223 Ft.
- Aktív kiadások összege: 4 150 759 Ft.
- Számított pénztár: 313 464 Ft.

## Ellenőrzések

- Duplikált tranzakció ID: 0 db.
- Hiányzó lakás/garázs hivatkozás: 0 db.
- Érvénytelen vagy nem pozitív összeg: 0 db.
- Lakáshoz/garázshoz nem köthető, kézi ellenőrzést igénylő befizetés: 8 db.
- Tört forintos importált összeg: 3 db.

## Kézi ellenőrzést igénylő befizetések

- 2015. 06. 04. 12:00:00 | 1 Ft | befizetes | kamatjóváírás | id=`bdd70c5f-d315-4cbf-af51-f50e6f335fc6`
- 2015. 07. 05. 12:00:00 | 2 390 Ft | befizetes | E.O.N. | id=`a819ec8e-d1e5-4aa0-8486-a4c63df90870`
- 2015. 07. 05. 12:00:00 | 3 Ft | befizetes | kamatjóváírás | id=`e1b41ab6-b6d3-4b0a-9179-b89061dc2d59`
- 2018. 10. 10. 12:00:00 | 198 068 Ft | befizetes | Végrehajtás Nagy László | id=`9523d40d-0029-4498-986f-4b9f8775105e`
- 2018. 12. 10. 12:00:00 | 114 790 Ft | befizetes | Végrehajtás Nagy László | id=`c3352ff1-c585-49b0-a6d0-94a513c20899`
- 2019. 02. 11. 12:00:00 | 182 460 Ft | befizetes | Nagy László végrehajtás | id=`c6d288bf-8246-424f-a8e5-064abfb856e0`
- 2022. 03. 18. 12:00:00 | 197 430 Ft | befizetes | Generali biztosító, ajtó ára visszatérítés | id=`b56d834f-4065-4523-b125-778ca6ff91b1`
- 2022. 04. 27. 12:00:00 | 50 000 Ft | befizetes | Biztosító ajtó beszerelés visszatérítés | id=`8bb38e15-be74-4e1a-883c-3fca43a31f2d`

## Tört forintos tételek

- 2013. 07. 05. 12:00:00 | Lakás 5 | 18 886.666666666668 Ft | id=`28c37ee9-3cb4-4bdd-a92d-5d82ce28b28e`
- 2013. 07. 05. 12:00:00 | Lakás 3 | 18 886.666666666668 Ft | id=`2f17b569-f948-4101-9b5e-9d126cf0c947`
- 2013. 07. 05. 12:00:00 | Lakás 2 | 18 886.666666666668 Ft | id=`3163f3bc-5043-4921-b6d7-f5a6a742b1e9`

## Kódjavítás

- Az állapotbetöltés és a JSON import többé nem dobja el a garázsokat az 5 elemre korlátozott lakáslista miatt.
- A pénzösszegek központi normalizálást kaptak.
- A történeti importált tört összegek számítási pontossága megmarad; a kód csak a lebegőpontos, majdnem egész kerekítési zajt simítja.
- A JSON import a felülírás előtt automatikus helyi backupot készít.
- Automatizált pénzügyi audit teszt készült a javított mentésre.

## Nem automatikusan tisztított adatok

- A lakáshoz/garázshoz nem köthető befizetéseket nem soroltam át automatikusan, mert tartalmi pénzügyi döntést igényelnek.
- A tört forintos tételeket nem kerekítettem, mert az három tételnél 1 Ft eltérést okozhatna a részösszegekben.
