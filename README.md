# ZsaNa Photo

ZsaNa Photo teljes körű Next.js (App Router) alkalmazása: publikus fotós weboldal valódi online
időpontfoglalással, admin felülettel, PostgreSQL (Neon) adatbázissal és e-mail értesítésekkel.

A teljes specifikációt lásd: [`Zsana_Photo_MVP_v4.md`](./Zsana_Photo_MVP_v4.md).

## Tech stack

- Next.js 16 (App Router, Turbopack), TypeScript (strict), React 19
- Tailwind CSS v4
- PostgreSQL (Neon-kompatibilis, `pg` driver) + Drizzle ORM
- Zod validáció, React Hook Form
- Resend e-mail küldéshez (development fallback: `ConsoleEmailProvider`)
- Saját, függőségmentes admin session (HMAC-signed HttpOnly cookie) + bcrypt jelszó hash

## Projekt struktúra

```text
app/
  (public)/        publikus oldalak (Header/Footer layout)
  admin/
    (auth)/        /admin/login - guard nélkül
    (dashboard)/    /admin, /admin/bookings, /admin/photo-orders, ... - requireAdmin() véd
  (public)/fotorendeles/  PIN-nel megnyitható intézményi fotórendelő
  api/availability/  publikus GET route handlerek (elérhető napok/időpontok)
  actions/          "use server" Server Actionök (booking, inquiry, auth, admin mutációk)
components/
  public/, booking/, admin/, ui/
db/
  schema.ts, client.ts, migrate.ts, seed.ts, migrations/
lib/
  services/        booking-service, photo-order-service, availability-service, inquiry-service,
                    service-service,
                    availability-rule-service, blocked-period-service, settings-service
  providers/email/  EmailProvider absztrakció (Resend / Console)
  auth/             session.ts (HMAC token), password.ts (bcrypt), guard.ts (requireAdmin)
  validation/       Zod séma minden formhoz
  utils/            time.ts (Europe/Budapest <-> UTC), rate-limit.ts, errors.ts, cn.ts
```

## Helyi fejlesztés

### Előfeltételek

- Node.js 20.9+ (LTS) vagy újabb, pnpm
- Egy PostgreSQL adatbázis connection string (ajánlott: [Neon](https://neon.tech) `zsanaphoto-dev` projekt).
  Neon nélkül bármilyen standard Postgres connection string működik (pl. lokális Docker konténer),
  mert az app a szabványos `pg` drivert használja.

### Beállítás

1. Másold le a `.env.example`-t `.env.local` néven, és töltsd ki:

   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   RESEND_API_KEY=
   EMAIL_FROM=
   ADMIN_NOTIFICATION_EMAIL=admin@example.com
   ADMIN_AUTH_SECRET=<hosszú, véletlenszerű string>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   `RESEND_API_KEY` és `EMAIL_FROM` nélkül az app a `ConsoleEmailProvider`-t használja: az e-mailek
   tartalma a terminálba lesz logolva, az alkalmazás Resend kulcs nélkül is teljes értékűen fut.

2. Telepítés és adatbázis előkészítés:

   ```bash
   pnpm install
   pnpm db:migrate
   pnpm db:seed
   pnpm dev
   ```

   Az app: <http://localhost:3000>

3. Development admin belépés (seed hozza létre, **csak fejlesztéshez**):

   ```text
   e-mail:  admin@zsanaphoto.dev
   jelszó:  ChangeMe123!
   ```

  Opcionális fotórendelési demó foglalás és PIN létrehozása:

  ```powershell
  $env:SEED_DEMO_PHOTO_ORDER="true"
  pnpm db:seed
  ```

  A demó PIN alapértelmezetten `DE12345`. A `SEED_DEMO_PHOTO_ORDER_PIN` változóval felülírható.
  A visszaigazolás az `ADMIN_NOTIFICATION_EMAIL` címre érkezik, vagy külön megadható a
  `SEED_DEMO_PHOTO_ORDER_EMAIL` változóval. Production adatbázisban ne engedélyezd a demó seedet.

   Productionben ezt kötelező lecserélni (lásd lentebb).

### Hasznos parancsok

```bash
pnpm dev          # fejlesztői szerver
pnpm build        # production build
pnpm start        # production szerver (build után)
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest unit tesztek (üzleti logika: slot generálás, overlap, jóváhagyási mód, stb.)
pnpm db:generate  # Drizzle migráció generálása schema.ts alapján
pnpm db:migrate   # migrációk lefuttatása a DATABASE_URL adatbázison
pnpm db:seed      # alap szolgáltatások, availability szabályok, settings, dev admin létrehozása
```

## Környezetek

A kódban nincs környezetfüggő elágazás: helyi fejlesztés és Vercel production ugyanazt a kódot futtatja,
kizárólag a `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`,
`ADMIN_AUTH_SECRET` és `NEXT_PUBLIC_SITE_URL` environment variable-ök különböznek.

Ajánlott két külön Neon adatbázis: `zsanaphoto-dev` (helyi fejlesztés) és `zsanaphoto-production`
(Vercel Production environment variable-ök között beállítva). A kettő adatai soha ne keveredjenek.

## Vercel deployment

1. Importáld a repository-t Vercelbe (Next.js automatikusan felismerésre kerül, nincs custom build lépés).
2. Állítsd be a Production Environment Variables-t: `DATABASE_URL` (production Neon), `RESEND_API_KEY`,
   `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`, `ADMIN_AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`
   (pl. `https://zsanaphoto.com`).
3. A migrációkat és a seedet **külön, explicit módon** futtasd a production adatbázison, mielőtt
   forgalmat engedsz rá (pl. lokálisan, a production `DATABASE_URL`-lel a környezetedben):

   ```bash
   DATABASE_URL=<production connection string> pnpm db:migrate
   DATABASE_URL=<production connection string> pnpm db:seed
   ```

   A seed csak akkor hoz létre admin usert/service-eket, ha még nem léteznek, így biztonságosan
   újrafuttatható. Productionben a seedelt admin jelszót azonnal cseréld le (adatbázisban, vagy egy
   saját admin-user létrehozó script segítségével).
4. A build nem függ helyi fájlrendszertől vagy mock adatbázistól - a Vercel build ugyanazt a Next.js
   alkalmazást deployolja, amit lokálisan futtatsz.

## Foglalási üzleti szabályok (összefoglaló)

- A szabad időpontokat a rendszer **mindig** az adatbázisban tárolt `availabilityRules`,
  `blockedPeriods` és aktív (`PENDING`/`CONFIRMED`) `bookings` rekordok alapján számolja ki -
  nincsenek frontendbe égetett időpontok.
- Dupla foglalás elleni védelem két rétegben: (1) a `createBooking` tranzakción belül újra
  ellenőrzi az ütközést; (2) az adatbázis egy `EXCLUDE USING gist` constraint-tel (lásd
  `db/migrations/0001_booking_overlap_protection.sql`) ténylegesen kizárja az átfedő, aktív
  foglalásokat - ez race condition esetén is garantáltan megakadályozza a dupla foglalást.
- `approvalMode = AUTO`: a foglalás azonnal `CONFIRMED`. `MANUAL`: `PENDING`, admin jóváhagyása
  szükséges (`/admin/bookings`).
- Az egyedi, két nagybetűből és öt számjegyből álló PIN kizárólag intézményi foglaláshoz készül.
  Megerősített vagy teljesített foglalás PIN-jével a fejlécből megnyitható a privát fotórendelő.
- A fotórendelő jelenleg stock képekkel működik. Képenként méret és darabszám választható, a rendelés
  e-mailes visszaigazolást küld az ügyfélnek és az adminnak, majd az `/admin/photo-orders` oldalon
  követhető és státuszolható. Egy PIN-hez egyszerre egy aktív (`NEW`/`PROCESSING`) rendelés tartozhat;
  ismételt belépéskor a tételek, darabszámok, méretek és a rendelési megjegyzés módosíthatók.
- Minden foglalási/admin mutáció szerveroldali Server Actionön keresztül történik, Zod validációval,
  és admin műveletek `requireAdmin()` guard mögött futnak.
- Rate limiting: booking submit, intézményi érdeklődés és admin login is korlátozva van (egyszerű,
  memóriában tárolt limiter - egyetlen szerver-instance-ra elegendő MVP-ben; elosztott (pl. Redis)
  limiterre cserélhető később, ha szükséges).

## Amit tudni érdemes

- Az időzóna mindenhol `Europe/Budapest` (lásd `lib/utils/time.ts`), az adatbázisban minden időpont
  UTC-ben van tárolva.
- A publikus galéria helykitöltő (gradiens) képekkel működik (`components/public/PhotoCard.tsx`) -
  cseréld valódi fotókra a `next/image` komponenssel a launch előtt.
- Az admin route-ok (`/admin/*`) nem indexelhetők (`robots: noindex`) és szerveroldali guard védi őket.
