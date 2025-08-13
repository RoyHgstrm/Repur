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
 - Favikoni: Päivitetty `src/app/icon.svg` vastaamaan `src/components/ui/Logo.tsx` -komponentin visuaalia (violetti→meripihka gradientti, pyöristetty neliö, valkoinen "R").
 - Etusivu (hero): Parannettu listausdatan välimuistia — clientillä SWR-tyyppinen revalidointi (focus/reconnect/60s interval), palvelimella lyhyempi TTL (featured 2min, active 5min) ja kattavampi invalidointi (myös `listings:featured`).

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

Uudet muutokset (2025-08-13):
- [x] Dev-ympäristö: poistettu Turbopack käytöstä (`package.json` → `dev: next dev`) lucide-react HMR -virheen välttämiseksi.
- [x] Fix: `src/server/api/routers/listings.ts` — poistettu väärät `_perfTier/_gpuTier/_cpuTier` destrukturoinnit (TS-virhe).
- [x] Clerk v6 middleware: vaihdettu `publicRoutes`-asetuksesta `createRouteMatcher`-pohjaiseen suojaan (`auth.protect()`), poistettu virheellinen `ignoredRoutes`-optio.
- [x] Ajetut komennot: `npm run typecheck`, `npm run lint`, `npm run build` — kaikki vihreänä.

Huom: Luettu ja noudatettu `rules.mdc` (pääkohdat: suomi-UI, Zero-Trust, suorituskykybudjetti, saavutettavuus, kommenttien selkeys).