Repur.fi TODO




Huomioitu ohjeet: suomi-UI, zero-trust, suorituskykybudjetti, komponenttien uudelleenkäyttö, saavutettavuus (prefers-reduced-motion), kommenttien selkeys.


Tehty tänään:
- Osta-sivu: Lisätty mobiili listanäkymä (kompaktimpi, nopeammat animaatiot transform/opacity, `transform-gpu`).
- Desktop/tablet: Säilytetty ruudukkonäkymä, mobiilissa listanäkymä (`sm:hidden`/`hidden sm:grid`).
- ProductCard: Lisätty `variant="list"` ja `eager` kuvan lataus prioriteetin säätämiseksi (ensimmäiset kortit latautuvat aiemmin).
- Lomakekontrollit: Pienennetty korkeudet mobiilissa (`h-10 sm:h-12`).
- Suorituskyky: Kevennetty varjot ja siirtymäkestot mobiilissa, vältetään layout-shift.
 - Etusivu: Lyhennetty animaatiokestoja ja viiveitä, muutettu stagger-arvot, lisätty `transform-gpu`, piilotettu raskaat tausta-animaatiot mobiilissa, lisätty esittelytuotteille mobiilin listanäkymä (eager 3 kpl).
 - Etusivu (hero): Muutettu "Ilmainen Toimitus" → "Nopea Toimitus" ja vaihdettu ikonin väriin `text-[var(--color-primary)]` ohjeiden mukaisesti (suomi-UI, selkeä viestintä).

Stripe-maksut (uusi):
- [x] tRPC `payments.createCheckoutSession` (server) — Stripe Checkout Session EUR, alennusikkuna huomioitu
- [x] Webhook `POST /api/stripe/webhook` — varmistus allekirjoituksella, merkitsee listauksen `SOLD` ja luo `purchase`
- [x] Client: `getStripe()` ja Checkout-redirect `ProductCard` + `osta/[id]`
- [x] Ympäristömuuttujat lisätty validointiin `src/env.js`

Seuraavat askeleet:
- [ ] Aseta ympäristömuuttujat: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Lisää webhook Stripeen: `https://<domain>/api/stripe/webhook`
- [ ] Testaa Checkout testikorteilla (4242 4242 4242 4242)
- [ ] Näytä onnistumis-/peruutusviesti URL-parametrien perusteella `osta/[id]`
- [ ] Lisää tilausnäkymä asiakkaalle (ostohistoria) ja henkilöstölle (tilaukset)