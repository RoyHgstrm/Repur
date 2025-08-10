Repur.fi TODO




Huomioitu ohjeet: suomi-UI, zero-trust, suorituskykybudjetti, komponenttien uudelleenkäyttö, saavutettavuus (prefers-reduced-motion), kommenttien selkeys.


Tehty tänään:
- Osta-sivu: Lisätty mobiili listanäkymä (kompaktimpi, nopeammat animaatiot transform/opacity, `transform-gpu`).
- Desktop/tablet: Säilytetty ruudukkonäkymä, mobiilissa listanäkymä (`sm:hidden`/`hidden sm:grid`).
- ProductCard: Lisätty `variant="list"` ja `eager` kuvan lataus prioriteetin säätämiseksi (ensimmäiset kortit latautuvat aiemmin).
- Lomakekontrollit: Pienennetty korkeudet mobiilissa (`h-10 sm:h-12`).
- Suorituskyky: Kevennetty varjot ja siirtymäkestot mobiilissa, vältetään layout-shift.
 - Etusivu: Lyhennetty animaatiokestoja ja viiveitä, muutettu stagger-arvot, lisätty `transform-gpu`, piilotettu raskaat tausta-animaatiot mobiilissa, lisätty esittelytuotteille mobiilin listanäkymä (eager 3 kpl).
