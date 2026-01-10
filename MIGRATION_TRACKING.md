# GTF Laravel to Next.js Migration Tracking

## Migration Status Overview

### Database Schema (Prisma)
- [x] Users model
- [x] Federation model
- [x] FederationAdmin model
- [x] Country model
- [x] Region model
- [x] City model
- [x] Address model
- [x] Club model
- [x] Trainer model
- [x] Sportsman model
- [x] Competition model
- [x] CompetitionDiscipline model
- [x] CompetitionCategory model
- [x] CompetitionRegistration model
- [x] CompetitionBracket model
- [x] CompetitionMatch model
- [x] MatchScore model
- [x] Judge model
- [x] JudgeDiscipline model
- [x] CompetitionJudge model
- [x] MatchJudge model
- [x] Team model
- [x] TeamMember model
- [x] Discipline model
- [x] AgeCategory model
- [x] WeightCategory model
- [x] BeltCategory model
- [x] Category model
- [x] Representative model
- [x] SportsmanRepresentative model
- [x] Membership model
- [x] MembershipPayment model
- [x] Attestation model
- [x] TrainerAttestation model
- [x] Rating model
- [x] RatingHistory model
- [x] RatingArchive model
- [x] ClubRating model
- [x] WeightHistory model
- [x] WeighIn model
- [x] LoginPin model
- [x] PhoneVerification model
- [x] TelegramVerification model
- [x] TelegramBotUser model
- [x] News model
- [x] Partner model
- [x] Slider model
- [x] Banner model
- [x] Story model
- [x] StaticPage model
- [x] TaekwondoPage model
- [x] ActivityLog model
- [x] NotificationLog model
- [x] Setting model
- [x] CurrencyExchangeRate model

### Authentication System
- [x] PIN generation service
- [x] PIN verification service
- [x] Telegram notification service
- [x] SMS notification service
- [x] JWT token generation
- [x] API: POST /api/v1/auth/send-pin
- [x] API: POST /api/v1/auth/verify-pin
- [x] API: POST /api/v1/auth/logout
- [x] API: GET /api/v1/auth/me

### Middleware
- [x] Federation detection middleware
- [x] Locale detection middleware

### Services (from Laravel)
- [x] PinVerificationService -> services/auth/pin.service.ts
- [x] TelegramService -> services/auth/telegram.service.ts
- [x] SmsService -> services/auth/sms.service.ts
- [x] CompetitionService -> services/competition/competition.service.ts
- [x] RegistrationService -> services/registration/registration.service.ts
- [x] BracketService -> services/bracket/bracket.service.ts
- [x] RatingService -> services/rating/rating.service.ts
- [x] TransliterationService -> lib/utils/transliterate.ts
- [x] FederationService -> services/federation/federation.service.ts
- [x] TeamService -> services/team/team.service.ts
- [x] WeighInService -> services/weighin/weighin.service.ts
- [x] CompetitionCategoryGeneratorService -> services/category/category-generator.service.ts
- [x] PaymentService -> services/payment/payment.service.ts
- [x] MembershipService -> services/membership/membership.service.ts
- [x] ExportService -> services/export/export.service.ts

### API Routes (from Laravel)

#### Public API
- [x] GET /api/v1/competitions
- [x] GET /api/v1/federations
- [x] GET /api/v1/federations/:code
- [x] GET /api/v1/clubs
- [x] GET /api/v1/geolocation/countries
- [x] GET /api/v1/geolocation/countries/:id/regions
- [x] GET /api/v1/geolocation/regions/:id/cities
- [ ] GET /api/v1/competitions/:id
- [ ] GET /api/v1/competitions/:id/categories
- [ ] GET /api/v1/competitions/:id/schedule
- [ ] GET /api/v1/public/:federation/brackets/:id

#### Protected API
- [x] GET /api/v1/sportsmen
- [x] GET /api/v1/sportsmen/:id
- [x] PUT /api/v1/sportsmen/:id
- [ ] POST /api/v1/sportsmen
- [ ] DELETE /api/v1/sportsmen/:id
- [ ] POST /api/v1/clubs
- [ ] GET /api/v1/trainers
- [ ] POST /api/v1/trainers
- [ ] GET /api/v1/judges
- [ ] POST /api/v1/registrations
- [ ] POST /api/v1/memberships

### Controllers (from Laravel)

#### SuperAdmin Controllers
- [ ] FederationController
- [ ] DisciplineController
- [ ] AgeCategoryController
- [ ] BeltCategoryController
- [ ] WeightCategoryController
- [ ] CountryController
- [ ] RegionController
- [ ] CityController
- [ ] JudgeController
- [ ] CompetitionController

#### Admin Controllers
- [ ] DashboardController
- [ ] SportsmanController
- [ ] ClubController
- [ ] TrainerController
- [ ] NewsController
- [ ] SettingsController
- [ ] JudgeController (Admin)
- [ ] AttestationController
- [ ] CompetitionController (Admin)
- [ ] CompetitionDisciplineController
- [ ] CompetitionCategoryController
- [ ] CompetitionRegistrationController
- [ ] CompetitionBracketController
- [ ] TeamController
- [ ] WeighInController

### UI Components (shadcn/ui migration)
- [x] Layout components (Header, Footer, AdminLayout)
- [x] Navigation (Header nav, Admin sidebar)
- [x] Data tables (DataTable with sorting, filtering, pagination)
- [x] Forms (FormField component)
- [x] Modals (Dialog component)
- [x] Theme toggle (dark/light/system)
- [ ] Competition bracket viewer
- [ ] Multi-language input
- [ ] Phone input
- [ ] Location cascade select
- [ ] Name input with transliteration

### Pages (from Laravel Views)

#### Public Pages
- [x] Home page -> app/page.tsx
- [x] News list -> app/news/page.tsx
- [x] News detail -> app/news/[id]/page.tsx
- [x] Clubs list -> app/clubs/page.tsx
- [x] Club detail -> app/clubs/[id]/page.tsx
- [x] Ratings -> app/ratings/page.tsx
- [x] Competition list -> app/competitions/page.tsx
- [x] Competition detail -> app/competitions/[id]/page.tsx
- [x] Sportsman detail -> app/sportsmen/[id]/page.tsx
- [ ] Competition bracket view
- [ ] Competition schedule

#### Auth Pages
- [x] Login (PIN) -> app/login/page.tsx
- [x] Logout via API

#### Cabinet Pages
- [x] Main cabinet -> app/cabinet/page.tsx
- [ ] Sportsman cabinet
- [ ] Trainer cabinet
- [ ] Judge cabinet
- [ ] Representative cabinet

#### Admin Pages
- [x] Dashboard -> app/admin/page.tsx
- [x] Sportsmen management -> app/admin/sportsmen/page.tsx
- [ ] Clubs management
- [ ] Trainers management
- [ ] Judges management
- [ ] Competitions management
- [ ] Competition categories
- [ ] Registration management
- [ ] Bracket management
- [ ] News management
- [ ] Settings

#### SuperAdmin Pages
- [ ] Dashboard
- [ ] Federations management
- [ ] Global references
- [ ] International competitions
- [ ] Global judges

---

## Files Migrated

### From Laravel to Next.js

| Laravel File | Next.js File | Status |
|-------------|-------------|--------|
| app/Models/User.php | prisma/schema.prisma (User) | ✅ |
| app/Models/Federation.php | prisma/schema.prisma (Federation) | ✅ |
| app/Models/Sportsman.php | prisma/schema.prisma (Sportsman) | ✅ |
| app/Models/Competition.php | prisma/schema.prisma (Competition) | ✅ |
| ... (50+ models) | prisma/schema.prisma | ✅ |
| app/Services/Auth/PinVerificationService.php | src/services/auth/pin.service.ts | ✅ |
| app/Services/TelegramService.php | src/services/auth/telegram.service.ts | ✅ |
| app/Services/SmsService.php | src/services/auth/sms.service.ts | ✅ |
| app/Services/TransliterationService.php | src/lib/utils/transliterate.ts | ✅ |
| app/Services/FederationService.php | src/services/federation/federation.service.ts | ✅ |
| app/Services/TeamService.php | src/services/team/team.service.ts | ✅ |
| app/Services/WeighInService.php | src/services/weighin/weighin.service.ts | ✅ |
| app/Services/CompetitionCategoryGeneratorService.php | src/services/category/category-generator.service.ts | ✅ |
| app/Services/PaymentService.php | src/services/payment/payment.service.ts | ✅ |
| app/Services/MembershipService.php | src/services/membership/membership.service.ts | ✅ |
| app/Services/ExportService.php | src/services/export/export.service.ts | ✅ |
| routes/api.php (auth routes) | src/app/api/v1/auth/* | ✅ |
| app/Http/Middleware/IdentifyFederation.php | src/middleware.ts | ✅ |

---

## Technology Mapping

| Laravel | Next.js |
|---------|---------|
| Eloquent ORM | Prisma |
| MySQL | PostgreSQL |
| Inertia.js | Next.js App Router |
| React (via Inertia) | React (native) |
| Ant Design | shadcn/ui |
| Laravel Session | JWT + Cookies |
| Laravel Sanctum | Custom JWT |
| Spatie Translatable | JSON fields |
| Spatie Activity Log | Custom ActivityLog |

---

## Notes

1. **Multi-tenancy**: Using middleware to detect federation from subdomain
2. **Translations**: JSON fields in database for translatable content
3. **Authentication**: PIN-based via Telegram/SMS (no passwords)
4. **File uploads**: Will use Vercel Blob or similar
5. **Real-time**: Consider adding WebSockets for live match updates