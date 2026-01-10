# GTF Laravel to Next.js Migration Tracking

## Migration Status Overview

**Last Updated:** 2026-01-10
**Build Status:** Success
**Total Routes:** 42 API endpoints, 18 pages

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
- [x] GET /api/v1/competitions/:id
- [x] GET /api/v1/competitions/:id/categories
- [x] GET /api/v1/competitions/:id/schedule
- [x] GET /api/v1/brackets/:categoryId
- [x] GET /api/v1/news
- [x] GET /api/v1/news/:id

#### Protected API
- [x] GET /api/v1/sportsmen
- [x] GET /api/v1/sportsmen/:id
- [x] PUT /api/v1/sportsmen/:id
- [x] POST /api/v1/sportsmen
- [x] DELETE /api/v1/sportsmen/:id
- [x] GET /api/v1/trainers
- [x] POST /api/v1/trainers
- [x] GET /api/v1/judges
- [x] POST /api/v1/judges
- [x] GET /api/v1/registrations
- [x] POST /api/v1/registrations
- [x] GET /api/v1/memberships
- [x] POST /api/v1/memberships
- [x] PUT /api/v1/news/:id
- [x] DELETE /api/v1/news/:id

### UI Components (shadcn/ui migration)
- [x] Layout components (Header, Footer, AdminLayout)
- [x] Navigation (Header nav, Admin sidebar)
- [x] Data tables (DataTable with sorting, filtering, pagination)
- [x] Forms (FormField component)
- [x] Modals (Dialog component)
- [x] Theme toggle (dark/light/system)
- [x] Competition bracket viewer -> components/brackets/BracketViewer.tsx
- [x] Multi-language input -> components/forms/MultiLanguageInput.tsx
- [x] Phone input -> components/forms/PhoneInput.tsx
- [x] Location cascade select -> components/forms/LocationSelect.tsx
- [x] Textarea component -> components/ui/textarea.tsx
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
- [x] Clubs management -> app/admin/clubs/page.tsx
- [x] Trainers management -> app/admin/trainers/page.tsx
- [x] Judges management -> app/admin/judges/page.tsx
- [x] Competitions management -> app/admin/competitions/page.tsx
- [x] News management -> app/admin/news/page.tsx
- [ ] Competition categories
- [ ] Registration management
- [ ] Bracket management
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
| app/Models/User.php | prisma/schema.prisma (User) | Done |
| app/Models/Federation.php | prisma/schema.prisma (Federation) | Done |
| app/Models/Sportsman.php | prisma/schema.prisma (Sportsman) | Done |
| app/Models/Competition.php | prisma/schema.prisma (Competition) | Done |
| ... (50+ models) | prisma/schema.prisma | Done |
| app/Services/Auth/PinVerificationService.php | src/services/auth/pin.service.ts | Done |
| app/Services/TelegramService.php | src/services/auth/telegram.service.ts | Done |
| app/Services/SmsService.php | src/services/auth/sms.service.ts | Done |
| app/Services/TransliterationService.php | src/lib/utils/transliterate.ts | Done |
| app/Services/FederationService.php | src/services/federation/federation.service.ts | Done |
| app/Services/TeamService.php | src/services/team/team.service.ts | Done |
| app/Services/WeighInService.php | src/services/weighin/weighin.service.ts | Done |
| app/Services/CompetitionCategoryGeneratorService.php | src/services/category/category-generator.service.ts | Done |
| app/Services/PaymentService.php | src/services/payment/payment.service.ts | Done |
| app/Services/MembershipService.php | src/services/membership/membership.service.ts | Done |
| app/Services/ExportService.php | src/services/export/export.service.ts | Done |
| routes/api.php (auth routes) | src/app/api/v1/auth/* | Done |
| app/Http/Middleware/IdentifyFederation.php | src/middleware.ts | Done |

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

## Recent Changes (2026-01-10)

### Fixed Issues
1. Fixed `prisma.config.ts` - removed unsupported `directUrl` property
2. Fixed `scripts/migrate-data.ts` - corrected type mappings for TrainerRank, UserType, CompetitionStatus
3. Fixed `src/app/api/migrate/route.ts` - updated to use shared Prisma client
4. Fixed `src/app/ratings/page.tsx` - corrected gender filter (sex field: 0=male, 1=female)
5. Fixed `src/app/api/v1/brackets/[categoryId]/route.ts` - updated to match Prisma schema (participant1/participant2, roundNumber, score1/score2)
6. Fixed `src/app/api/v1/memberships/route.ts` - updated to use `sportsmen` relation and correct field names
7. Fixed `src/app/api/v1/registrations/route.ts` - updated to use correct field names and enum values

### Added API Endpoints
1. `GET /api/v1/competitions/:id` - Competition details with categories
2. `PUT /api/v1/competitions/:id` - Update competition
3. `DELETE /api/v1/competitions/:id` - Soft delete competition
4. `GET /api/v1/competitions/:id/categories` - Competition categories
5. `GET /api/v1/competitions/:id/schedule` - Competition schedule
6. `GET /api/v1/trainers` - List trainers
7. `POST /api/v1/trainers` - Create trainer
8. `GET /api/v1/judges` - List judges
9. `POST /api/v1/judges` - Create judge
10. `GET /api/v1/registrations` - List registrations
11. `POST /api/v1/registrations` - Create registration
12. `GET /api/v1/memberships` - List memberships
13. `POST /api/v1/memberships` - Create membership
14. `GET /api/v1/brackets/:categoryId` - Get bracket for category
15. `GET /api/v1/news` - List news
16. `POST /api/v1/news` - Create news
17. `GET /api/v1/news/:id` - Get news
18. `PUT /api/v1/news/:id` - Update news
19. `DELETE /api/v1/news/:id` - Delete news

### Added Admin Pages
1. `app/admin/clubs/page.tsx` - Clubs management
2. `app/admin/trainers/page.tsx` - Trainers management
3. `app/admin/judges/page.tsx` - Judges management
4. `app/admin/competitions/page.tsx` - Competitions management
5. `app/admin/news/page.tsx` - News management

### Added UI Components
1. `components/brackets/BracketViewer.tsx` - Competition bracket viewer
2. `components/forms/PhoneInput.tsx` - Phone input with country code
3. `components/forms/LocationSelect.tsx` - Cascading country/region/city select
4. `components/forms/MultiLanguageInput.tsx` - Multi-language text input
5. `components/ui/textarea.tsx` - Textarea component

---

## Notes

1. **Multi-tenancy**: Using middleware to detect federation from subdomain
2. **Translations**: JSON fields in database for translatable content
3. **Authentication**: PIN-based via Telegram/SMS (no passwords)
4. **File uploads**: Will use Vercel Blob or similar
5. **Real-time**: Consider adding WebSockets for live match updates

---

## Remaining Tasks

### High Priority
- [ ] Name input with transliteration component
- [ ] Competition bracket view page
- [ ] Competition schedule page
- [ ] Cabinet pages (sportsman, trainer, judge, representative)

### Medium Priority
- [ ] Registration management admin page
- [ ] Bracket management admin page
- [ ] Settings admin page

### Low Priority
- [ ] PDF export (passports, certificates)
- [ ] WebSocket for live updates
- [ ] SuperAdmin panel
