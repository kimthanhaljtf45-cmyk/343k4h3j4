# АТАКА - Мобільний додаток для школи бойових мистецтв

## Огляд проекту
Мобільний додаток для управління школою бойових мистецтв "АТАКА" з підтримкою різних ролей (батьки, учні, тренери, адміністратори) та програм навчання (дитяча, особлива, доросла).


## 💰 PHASE 7: WAYFORPAY INTEGRATION (v1.7.0)

### WayForPay Payment Gateway

#### Конфігурація
```env
WAYFORPAY_MERCHANT_ACCOUNT=test_merch_n1  # Тестовий акаунт
WAYFORPAY_SECRET_KEY=flk3409refn54t*FNJRET
WAYFORPAY_DOMAIN=ataka.com.ua
```

#### Backend API Endpoints
- `POST /api/wayforpay/create-payment` - Отримати дані для платіжного віджета
- `POST /api/wayforpay/payment-url` - Отримати URL для редіректу на WayForPay
- `POST /api/wayforpay/callback` - Webhook для отримання статусу оплати
- `GET /api/wayforpay/invoice/:id` - Отримати invoice з платіжними даними
- `GET /api/wayforpay/status/:orderReference` - Перевірити статус платежу
- `GET /api/wayforpay/stats` - Статистика платежів (admin)
- `POST /api/wayforpay/simulate` - Симулювати оплату (TEST MODE)

#### Flow оплати
1. Батьки натискають "Оплатити карткою"
2. Система генерує підпис та формує запит до WayForPay
3. Відкривається сторінка WayForPay для оплати
4. Після оплати WayForPay надсилає callback на /api/wayforpay/callback
5. Система оновлює статус invoice на PAID
6. Батьки та адміни отримують сповіщення

#### Тестовий режим
- Використовує тестові ключі з офіційної документації WayForPay
- Доступна кнопка "Симулювати оплату" для тестування без реальних платежів

---

## 🏢 PHASE 6+: SUPER ADMIN UI FOR TENANTS

### Tenant Management
- `/admin/tenants` - Список всіх клубів (SaaS)
- `/admin/tenants/[id]` - Деталі tenant

#### Функціонал
- Створення нових клубів (tenants)
- Зміна плану (START → PRO → AI)
- Активація/деактивація клубів
- Перегляд revenue, студентів, тренерів
- Брендинг та ліміти

---

## 🛒 PHASE 8: MARKETPLACE LIGHT

### Marketplace для батьків
- `/marketplace` - Пошук залів, тренерів, програм

#### Функціонал
- Фільтр по районах
- Пошук залів/тренерів/програм
- Кнопка "Записатись" → перенаправлення на /booking
- **ВАЖЛИВО**: Запис та оплата ТІЛЬКИ через систему АТАКА

---


## 🔒 FROZEN DOMAIN MODEL (v1.0.0)
> **УВАГА**: Доменна модель зафіксована. Не модифікувати без архітектурного рішення!

### Ролі (FROZEN)
- **PARENT** - батьки учнів ("Для дитини")
- **STUDENT** - дорослі учні ("Для себе" / Самооборона)
- **COACH** - тренери
- **ADMIN** - адміністратори

### Програми (FROZEN)
| Program | Назва | Ціна (грн) |
|---------|-------|------------|
| KIDS | Дитяча програма | 2,000 |
| SPECIAL | Особлива програма | 2,000 |
| SELF_DEFENSE | Самооборона | 3,000 |
| MENTORSHIP | Персональні | 5,000 |
| CONSULTATION | Консультація | 0 |


## 💸 PHASE 2: DISCOUNT ENGINE + REFERRAL SYSTEM (v1.2.0)

### Discount Engine

#### Сутності

##### DiscountRule (Правило знижки)
```typescript
{
  tenantId: string;       // ID клубу
  name: string;           // "Реферальна знижка"
  type: 'REFERRAL' | 'PROMO' | 'MANUAL' | 'SUBSCRIPTION' | 'FIRST_TIME' | 'FAMILY' | 'LOYALTY' | 'PERFORMANCE' | 'VOLUME';
  valueType: 'PERCENT' | 'FIXED' | 'FREE_PERIOD';
  value: number;          // 10 for 10% or 500 for 500 UAH
  priority: number;       // Lower = higher priority (1 is highest)
  isStackable: boolean;   // Can be combined with other discounts
  contextType: 'BOOKING' | 'SUBSCRIPTION' | 'ALL';
  promoCode?: string;     // For PROMO type
  group?: string;         // For mutual exclusion: 'ACQUISITION', 'RETENTION', 'STRUCTURE'
  expiresAt?: Date;
}
```

##### AppliedDiscount (Застосована знижка)
```typescript
{
  userId: string;
  discountRuleId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  context: 'BOOKING' | 'SUBSCRIPTION' | 'INVOICE';
}
```

#### Backend API Endpoints

##### User Endpoints
- `GET /api/discounts/available` - доступні публічні знижки
- `GET /api/discounts/my` - мої застосовані знижки
- `POST /api/discounts/calculate` - розрахувати знижки для суми
- `POST /api/discounts/validate-promo` - перевірити промокод

##### Admin Endpoints
- `GET /api/admin/discounts` - всі правила знижок
- `POST /api/admin/discounts` - створити правило
- `PATCH /api/admin/discounts/:id` - оновити правило
- `DELETE /api/admin/discounts/:id` - видалити правило
- `GET /api/admin/discounts/stats` - статистика знижок
- `POST /api/admin/discounts/seed` - seed default rules

#### Алгоритм розрахунку
1. Сортування правил по пріоритету
2. Non-stackable правила зупиняють ланцюжок
3. Mutual exclusion по group
4. Максимум 50% загальної знижки (окрім FREE_PERIOD)

#### Default Discount Rules
| Назва | Тип | Значення | Priority | Stackable |
|-------|-----|----------|----------|-----------|
| Реферальна знижка | REFERRAL | 50% | 1 | ❌ |
| Перша оплата | FIRST_TIME | 10% | 3 | ❌ |
| Сімейна (2 дітей) | FAMILY | 10% | 5 | ✅ |
| Сімейна (3+ дітей) | FAMILY | 20% | 4 | ✅ |
| Лояльність 3 міс | LOYALTY | 5% | 10 | ✅ |
| Лояльність 6 міс | LOYALTY | 10% | 9 | ✅ |

### Referral System

#### Сутність Referral
```typescript
{
  inviterUserId: string;
  invitedUserId?: string;
  referralCode: string;
  status: 'PENDING' | 'REGISTERED' | 'CONFIRMED' | 'REWARDED';
  inviterRewardGiven: boolean;
  invitedRewardGiven: boolean;
  inviterRewardType?: 'FREE_MONTH' | 'PERCENT_50';
  invitedRewardType?: 'PERCENT_10';
}
```

#### Backend API Endpoints
- `GET /api/referrals/my-code` - мій реферальний код
- `GET /api/referrals/my` - мої рефералі та статистика
- `POST /api/referrals/apply` - застосувати реферальний код
- `GET /api/referrals/discount` - перевірити наявність реферальної знижки
- `GET /api/admin/referrals` - всі рефералі (admin)
- `GET /api/admin/referrals/stats` - статистика рефералів (admin)

#### Rewards Flow
1. User A отримує код (ATAKA...)
2. User B реєструється з кодом → status: REGISTERED
3. User B оплачує → status: CONFIRMED
4. Rewards:
   - 1 друг = 50% знижка для inviter
   - 2+ друзів = безкоштовний місяць для inviter
   - Invited завжди отримує 10% на першу оплату

### Frontend Components
- `/app/profile/referral.tsx` - екран "Запроси друга"
- `PromoCodeInput` - компонент вводу промокоду
- `DiscountSummary` - відображення знижок в billing


## 🏆 НОВА ФІЧА: Система Змагань (v1.1.0)

### Backend API Endpoints

#### Public Endpoints
- `GET /api/competitions` - список змагань (з фільтрацією по статусу та програмі)
- `GET /api/competitions/:id` - деталі змагання з учасниками та результатами
- `GET /api/competitions/champions` - гордість клубу (переможці)
- `GET /api/competitions/upcoming` - найближчі змагання
- `GET /api/competitions/stats` - статистика змагань
- `GET /api/competitions/my/list` - мої участі (потребує авторизації)
- `POST /api/competitions/:id/join` - реєстрація на змагання (потребує авторизації)

#### Admin Endpoints (ADMIN role required)
- `POST /api/admin/competitions` - створити змагання
- `GET /api/admin/competitions` - список усіх змагань
- `PATCH /api/admin/competitions/:id` - оновити змагання
- `POST /api/admin/competitions/:id/participant-status` - оновити статус учасника
- `POST /api/admin/competitions/participants/:id/mark-paid` - відмітити оплату
- `POST /api/admin/competitions/:id/result` - додати результат

### Сутності

#### Competition (Змагання)
```typescript
{
  title: string;          // "Кубок АТАКА 2026"
  description?: string;
  date: string;           // YYYY-MM-DD
  location: string;
  programType: ProgramType;
  registrationDeadline: string;
  hasFee: boolean;
  feeAmount?: number;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'FINISHED';
}
```

#### CompetitionParticipant (Учасник)
```typescript
{
  competitionId: string;
  childId: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  paid: boolean;
  category?: string;      // вік / вага / пояс
  invoiceId?: string;
}
```

#### CompetitionResult (Результат)
```typescript
{
  competitionId: string;
  childId: string;
  medal: 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTICIPATION';
  place: number;
  awardType?: string;     // MVP / Краща техніка
}
```

### Frontend Screens
- `/competitions` - список змагань з фільтрацією
- `/competitions/[id]` - деталі змагання + реєстрація
- `/competitions/my` - мої участі
- `/competitions/champions` - гордість клубу (ВАУ екран)

### Flow змагань
```
Анонс → Реєстрація → Підтвердження → Оплата → Участь → Результати → Нагороди
```

### Інтеграція з системою
- **Billing**: Автоматичне створення Invoice при реєстрації (якщо є внесок)
- **Alerts**: Сповіщення про реєстрацію, оплату, результати
- **Rating**: Бали за медалі (+20 золото, +10 срібло, +5 бронза)
- **Feed**: Публікація чемпіонів у стрічку

### Dashboard Philosophy (FROZEN)
- **Mobile** = ACTION-FIRST (щоденні дії)
- **Web Admin** = BUSINESS-FIRST (управління)
- **Alerts** = SYSTEM-FIRST (автоматика)

## Технічний стек
- **Frontend**: Expo React Native (TypeScript)
- **Backend**: NestJS (TypeScript) - **ЧИСТИЙ NestJS, БЕЗ PYTHON**
- **Database**: MongoDB
- **State Management**: Zustand
- **API Client**: Axios
- **Web Admin**: Next.js (планується)

## Архітектура бекенду
```
uvicorn (порт 8001) → проксі → NestJS (порт 3001)
```

**ВАЖЛИВО**: Python server.py - це ТІЛЬКИ тонкий проксі для запуску NestJS. 
ВСЯ бізнес-логіка знаходиться в NestJS.

## 📊 14-ДЕННИЙ ПЛАН СТАБІЛІЗАЦІЇ

### ✅ День 1 - Фікс архітектури (DONE)
- [x] Зафіксовано roles: PARENT, STUDENT, COACH, ADMIN
- [x] Зафіксовано programs: KIDS, SPECIAL, SELF_DEFENSE, MENTORSHIP, CONSULTATION
- [x] Створено FROZEN_CONFIG.md
- [x] Оновлено schemas з frozen types

### ✅ Core Architecture - Club → Group → Coach → Student (DONE)
- [x] Schemas: Club, Group, Child, CoachProfile з правильними зв'язками
- [x] Admin Groups API: CRUD + assign-coach + assign-students
- [x] Coach Dashboard API: groups, students, today trainings, at-risk students
- [x] Child API: повертає coach та group info
- [x] Child Profile Screen: coach card, "Написати тренеру" CTA, attendance grid, monthly goal

### ✅ Backend Core Pack #2 - Attendance + Messages + Dashboard (DONE)
- [x] Attendance API: POST /api/attendance/mark, GET /api/attendance/child/:id
- [x] Messages API: GET /api/messages/threads, POST /api/messages/threads/create
- [x] Dashboard builders: ParentDashboardBuilder, CoachDashboardBuilder

### ✅ Backend Core Pack #3 - Retention + Alerts + MetaBrain (DONE)
- [x] Retention API: GET /api/retention/child/:id, GET /api/retention/coach/risks
- [x] Alerts Engine: attendance, payments, leads, progress (cron every 6 hours)
- [x] MetaBrain AI: GET /api/meta/coach, GET /api/meta/admin, GET /api/meta/child/:id
- [x] Coach Actions: GET /api/coach/actions (priority-based recommendations)

### ✅ UI Components Pack #4 (DONE)
- [x] CoachHero - coach stats header
- [x] CoachActionsBlock - priority-based actions list
- [x] TodayScheduleBlock - today's trainings with attendance progress
- [x] AtRiskStudentsBlock - students at risk with reasons

### ✅ STABILIZATION - Auth Cleanup (DONE)
- [x] Removed demo login hint from login screen
- [x] Onboarding only shows PARENT/STUDENT roles
- [x] Role validation in auth service (only PARENT/STUDENT for public)
- [x] Auto-assign logic: child → group → coach (least students)
- [x] Validation rules: Child must have group, Group must have coach

### ⏳ День 2 - Auth (IN PROGRESS)
- [ ] Телефон → OTP (реальний, не mock)
- [ ] JWT tokens
- [ ] User lookup (НЕ створювати нового кожен раз)

### ⏳ День 3 - Onboarding (TODO)
- [ ] Прибрати coach/admin з публічного onboarding
- [ ] Залишити: "Для дитини" / "Для себе"
- [ ] Нормальний UX funnel

### ⏳ День 4 - Cleanup Mobile (TODO)
- [ ] Прибрати demo login
- [ ] Виправити phone input
- [ ] Перевірити navigation

### ⏳ День 5-8 - Flows e2e (TODO)
- [ ] Parent flow
- [ ] Coach flow  
- [ ] Billing flow
- [ ] Subscriptions

### ⏳ День 9-13 - Web Admin (TODO)
- [ ] /admin/dashboard
- [ ] /admin/billing
- [ ] /admin/pricing
- [ ] /admin/subscriptions
- [ ] /admin/leads

### ⏳ День 14 - Підключення клубу (TODO)
- [ ] 1 реальний клуб
- [ ] Реальні дані

## Реалізовані функції

### Phase 1-2 (Від GitHub репозиторію)
- ✅ Система авторизації (OTP, Mock login)
- ✅ Управління дітьми
- ✅ Групи та розклад
- ✅ Відвідуваність
- ✅ Прогрес та пояси
- ✅ Оплати та рахунки
- ✅ Повідомлення та сповіщення
- ✅ Стрічка новин
- ✅ Parent Insights

### Phase 3 - Rating System (ГОТОВО)
- ✅ **Система рейтингів** - дисципліна + прогрес + участь у турнірах
- ✅ Рейтинг групи/клубу/індивідуальний

### Phase 3 - Program-Aware Dashboard (ГОТОВО)
- ✅ **GET /api/dashboard** - єдиний endpoint для всіх ролей
- ✅ 7 Dashboard Builders для різних ролей/програм

### Phase 4 - Consultation Pipeline (ГОТОВО) 🆕
- ✅ **Воронка продажів**: заявка → обробка → пробне → конверсія
- ✅ **Статуси**: NEW → CONTACTED → BOOKED_TRIAL → TRIAL_DONE → CONVERTED / LOST
- ✅ **Admin Board** для управління лідами
- ✅ **Конверсія**: lead → enrolled user з автоматичним створенням user/child
- ✅ **Frontend форма** для запису на консультацію

### Phase 5 - Onboarding UX Redesign (ГОТОВО) 🆕
- ✅ **Новий Welcome екран** - продаж, а не функції
- ✅ **Спрощена сегментація** - "Для дитини" / "Для себе" замість 4 ролей
- ✅ **3-кроковий funnel**: Хто → Програма → Контакт → Success
- ✅ **Релевантні програми** на основі вибору
- ✅ **Правильні tap states** з анімацією scale
- ✅ **Zustand store** для onboarding state

## Onboarding Flow (Новий)

### Структура екранів
```
/(auth)/welcome.tsx - Hero + 3 програми + CTA
/(auth)/onboarding/who.tsx - "Для кого?" (CHILD/SELF)
/(auth)/onboarding/program.tsx - Вибір програми
/(auth)/onboarding/contact.tsx - Форма контакту
/(auth)/onboarding/success.tsx - Подяка + наступні кроки
```

### Role Mapping
- "Для дитини" → PARENT + (KIDS | SPECIAL)
- "Для себе" → STUDENT + (ADULT_SELF_DEFENSE | ADULT_PRIVATE)
- COACH/ADMIN → тільки через invite/backend

## Consultation Pipeline API

### Public Endpoints
- `POST /api/consultations` - створити заявку (без авторизації)
- `POST /api/consultations/auth` - створити заявку (з авторизацією)

### Admin Endpoints (потребує ADMIN role)
- `GET /api/admin/consultations` - список заявок з фільтрацією
- `GET /api/admin/consultations/board` - Kanban board з колонками
- `GET /api/admin/consultations/stats` - статистика конверсії
- `GET /api/admin/consultations/:id` - деталі заявки
- `PATCH /api/admin/consultations/:id/assign` - призначити відповідального
- `PATCH /api/admin/consultations/:id/status` - оновити статус
- `POST /api/admin/consultations/:id/convert` - конвертувати в enrolled user

## Демо облікові дані

### Батьки
- **telegramId**: 100000004, Ім'я: Ірина (KIDS program)
- **telegramId**: 100000005, Ім'я: Віктор (KIDS program)

### Тренери
- **telegramId**: 100000002 - Олександр Петренко
- **telegramId**: 100000003 - Марія Іваненко

### Адміністратор
- **telegramId**: 100000001

## Наступні кроки
1. ✅ Program-aware dashboard (ГОТОВО)
2. ✅ Consultation pipeline (ГОТОВО)
3. ✅ **Smart Alerts Engine** - AI-подібна логіка реактивних сповіщень (ГОТОВО)
4. ✅ **Coach Action System** - черга задач для тренера (ГОТОВО)
5. ✅ **Retention Engine** - streak/goals/engagement tracking (ГОТОВО)
6. ✅ **Push Notifications System** - Expo Push + Realtime delivery (ГОТОВО)

## Push Notifications System (ГОТОВО 🆕)

### Backend Push Endpoints
- `POST /api/devices/register` - реєстрація device token
- `POST /api/devices/unregister` - відключення device token
- `GET /api/devices/tokens` - список токенів користувача
- `POST /api/devices/test-push` - тестове сповіщення

### Push Service Features
- **Expo Push Integration** - відправка через exp.host API
- **Batch Sending** - відправка до 100 повідомлень за раз
- **Device Token Management** - реєстрація/відключення токенів
- **Invalid Token Handling** - автоматичне відключення невалідних токенів
- **Multi-platform Support** - iOS, Android, Web

### Push Notification Types
- **Alerts**: attendance issues, payment reminders, belt ready
- **Messages**: new message from coach/parent
- **Actions**: coach action reminders
- **System**: app updates, maintenance

### Frontend Push Integration
- **usePushNotifications hook** - автоматична реєстрація при авторизації
- **Notification Listeners** - обробка foreground/background notifications
- **Deep Linking** - навігація до відповідного екрану при тапі
- **Android Channels** - окремі канали для messages/alerts/payments

## Smart Alerts Engine API (ГОТОВО 🆕)

### Alerts Endpoints
- `GET /api/alerts` - мої алерти
- `GET /api/alerts/summary` - підсумок алертів
- `GET /api/alerts/critical` - критичні алерти (COACH/ADMIN)
- `GET /api/alerts/child/:childId` - алерти дитини
- `POST /api/alerts/:id/resolve` - закрити алерт
- `POST /api/alerts/run` - запустити перевірку (ADMIN)

### Типи алертів
- **Відвідування**: LOW_ATTENDANCE, ABSENCE_STREAK_2, ABSENCE_STREAK_3, NO_VISIT_7_DAYS
- **Прогрес**: BELT_READY, HIGH_PROGRESS, STAGNATION
- **Оплати**: PAYMENT_OVERDUE_3, PAYMENT_OVERDUE_7, PAYMENT_MISSED
- **Ліди**: LEAD_NO_CONTACT_24H, LEAD_STUCK_3_DAYS, LEAD_LOST_RISK

## Coach Action System API (ГОТОВО 🆕)

### Coach Actions Endpoints
- `GET /api/coach/actions` - пріоритетні дії тренера
- `POST /api/coach/actions/:id/complete` - виконати дію
- `POST /api/coach/actions/:id/snooze` - відкласти дію
- `POST /api/coach/actions/sync` - синхронізувати дії

### Типи дій
- **Відвідування**: CLOSE_ATTENDANCE, CHECK_ABSENCES
- **Прогрес**: CONFIRM_BELT, REVIEW_STAGNATION, REVIEW_CHILD_RISK
- **Комунікація**: REPLY_PARENT, GIVE_FEEDBACK

## Retention Engine API (ГОТОВО 🆕)

### Retention Endpoints
- `GET /api/retention/child/:childId` - retention дитини
- `GET /api/retention/parent` - retention батька
- `GET /api/retention/student/me` - моя retention
- `GET /api/retention/coach/risks` - ризики втрати учнів
- `GET /api/retention/stats` - статистика retention
- `POST /api/retention/recalculate` - перерахувати все

### Retention Metrics
- **Streak** - серія відвідувань поспіль
- **Monthly Goal** - місячна ціль тренувань
- **Engagement Status** - good/stable/warning/critical
- **Drop-off Risk** - low/warning/critical
- **Risk Score** - 0-100 (вище = більший ризик)

## 🔥 Стабілізаційний блок (2026-04-05)

### 1. ✅ Phone Input Fix - DONE
- Авто +380 (не можна видалити)
- Формат: +380 (XX) XXX XX XX
- Тільки цифри, максимум 9 після 380
- Зелена галочка при валідному номері

### 2. ✅ Billing CRON - DONE
- `BillingCron` - автоматична генерація інвойсів о 3:00 ночі
- Overdue check о 4:00 ночі
- +3 дні = нагадування
- +7 днів = ескалація до адміна
- Hourly quick check для нових підписок

### 3. ✅ MetaBrain Upgrade - DONE
- Вагова система: attendance(40), inactivity(25), payment(25), streak(10)
- Churn probability: <40 risk = 10%, <60 = 30%, <70 = 50%, >=70 = 80%
- Revenue at risk calculation
- Адаптивні ваги (machine learning при churned/retained)

### 4. ✅ Брендинг - DONE
- Логотип Team Kostenko оновлено на всіх екранах

## 🆕 Новий функціонал (2026-04-05)

### 1. ✅ Coach UX "Змагання сьогодні" - DONE
- GET /api/coach/competitions/today - endpoint для тренера
- Показує учнів, які сьогодні виступають
- Статус підтвердження та оплати
- UI блок CoachCompetitionsBlock.tsx інтегрований в Coach Dashboard

### 2. ✅ MetaBrain Competition Integration - DONE
- Медалі зменшують risk score: GOLD -20, SILVER -10, BRONZE -5
- Неявка на змагання +25 до risk score
- Рекомендації на основі результатів змагань
- "Запропонувати складнішу групу" для переможців
- "Підтримати учня після змагань" для невдачливих

### 3. ✅ Admin KPI по змаганнях - DONE
- GET /api/admin/competitions/:id/stats - детальна статистика
- Revenue: collected / potential / missed
- Participants: total / confirmed / pending / paid / unpaid
- Conversion: confirmationRate / paymentRate
- Results: gold / silver / bronze / participation
- UI екран /admin/competitions/[id].tsx з повним KPI dashboard



---

## 🚀 PHASE 3: UX INTEGRATION + FLOW (v1.3.0)

### 1. ✅ BILLING CHECKOUT з Discount Preview
- Компоненти `/src/components/billing/DiscountPreview.tsx`
- Компоненти `/src/components/billing/PromoCodeInput.tsx`
- Інтегровано в `/app/billing/invoice/[id].tsx`
- API: `POST /api/discounts/calculate` - калькулятор знижок
- UX показує: базова ціна → знижки → фінальна сума

### 2. ✅ GOOGLE LOGIN + OTP FALLBACK
- Оновлено `/app/(auth)/login.tsx`
- Google = primary метод входу
- OTP = fallback для тих, хто не використовує Google
- API: `POST /api/auth/google` - Google OAuth

### 3. ✅ REFERRAL CODE В ONBOARDING
- Додано в `/app/(auth)/onboarding/contact.tsx`
- Поле "Є реферальний код?" з валідацією
- Кнопка "Пропустити" для non-blocking UX
- Auto-apply при реєстрації

### 4. ✅ METABRAIN V2 (AI-driven Retention)
#### Backend Services
- `/modules/meta-brain/meta-brain.service.ts` - Risk calculation
- `/modules/meta-brain/meta-brain.engine.ts` - Decision engine

#### Risk Calculation
```typescript
riskScore = 0-100
  - attendance < 40%: +40
  - inactive > 14 days: +25  
  - payment overdue > 7 days: +25
  - absence streak >= 3: +10
```

#### Segments
- VIP: risk <= 10
- ACTIVE: risk < 40
- WARNING: risk 40-69
- CHURN_RISK: risk >= 70

#### API Endpoints
- `GET /api/meta/parent` - Parent insights + offers
- `GET /api/meta/coach` - Coach risk list + action queue
- `GET /api/meta/admin` - Overview + revenue at risk

### 5. ✅ METABRAIN UI PACK
#### Components Created
- `/src/components/metabrain/SegmentBadge.tsx`
- `/src/components/metabrain/AlertBanner.tsx`
- `/src/components/metabrain/ParentRetentionCard.tsx`
- `/src/components/metabrain/ParentOfferCard.tsx`
- `/src/components/metabrain/CoachRiskList.tsx`
- `/src/components/metabrain/CoachActionQueue.tsx`
- `/src/components/metabrain/AdminRiskOverview.tsx`
- `/src/components/metabrain/AdminRevenueRiskCard.tsx`

### 6. Auto-Discount Triggers
Якщо user:
- `CHURN_RISK` → автоматична знижка 30%
- `WARNING` → soft-save знижка 15%
- `VIP` → loyalty знижка 10%

---



---

## 🚀 PHASE 4: AUTO DISCOUNT + GROWTH ENGINE (v1.4.0)

### 1. ✅ AUTO DISCOUNT ENGINE
**Backend: `/modules/discounts/discounts.service.ts`**
- `createMetaDiscountSafe()` - створює знижку без дублювання
- `markRulesUsed()` - позначає знижки як використані після оплати
- `getUserMetaDiscount()` - отримує активну meta-знижку юзера
- `expireOutdatedDiscounts()` - автоматичне вимкнення прострочених знижок
- `cleanupOldDiscounts()` - очищення старих неактивних знижок

**Schema Updates: `/schemas/discount-rule.schema.ts`**
```typescript
+ userId?: string;      // Персональна знижка для юзера
+ source?: DiscountSource; // METABRAIN | REFERRAL | PROMO | MANUAL
+ reason?: string;      // Причина знижки для UI
+ offerId?: string;     // Зв'язок з A/B тестом
```

### 2. ✅ GROWTH ENGINE (A/B Testing)
**Backend: `/modules/growth-engine/`**
- `GrowthEngineService` - epsilon-greedy algorithm для вибору оферів
- `OfferVariant` schema - різні варіанти знижок з трекінгом конверсії
- API endpoints:
  - `GET /api/growth/offers` - список оферів зі статистикою
  - `POST /api/growth/offers` - створити новий офер
  - `POST /api/growth/offers/:id/conversion` - трекінг конверсії
  - `POST /api/growth/optimize` - авто-оптимізація

**Epsilon-Greedy Algorithm:**
- 80% exploitation (найкращий CR)
- 20% exploration (random)

**Default Offers:**
```typescript
CHURN_RISK: [20%, 30%, 40%]
WARNING: [10%, 15%]
VIP: [10%]
```

### 3. ✅ METABRAIN → AUTO ACTION
**Backend: `/modules/meta-brain/meta-brain.service.ts`**
- `evaluateUser()` - головний decision engine
- `runForAllUsers()` - batch processing для CRON
- Інтеграція з GrowthEngine для A/B тестування

**Flow:**
```
User → analyzeRisk → getSegment → pickOffer(A/B) → createDiscount → trackView
```

### 4. ✅ Discount Rule Guards
- ✅ 1 активна meta-знижка на user
- ✅ TTL (48–72 год)
- ✅ usageLimit = 1
- ✅ non-stackable
- ✅ priority = 99

### 5. Результат
Тепер система:
- ✅ Сама визначає проблему (risk analysis)
- ✅ Сама вибирає офер (A/B testing)
- ✅ Сама створює знижку (no duplicates)
- ✅ Сама показує в UI
- ✅ Сама вимикає (TTL/expiry)
- ✅ Сама застосовує в billing

---

## 🔮 NEXT: Phase 5 & 6

### Phase 5: Advanced Growth
- A/B testing dashboard
- Conversion analytics
- Dynamic pricing
- Personalized offers

### Phase 6: Multi-Club SaaS
- Multi-tenant architecture
- White-label support
- Club analytics dashboard
- Revenue sharing model

## Технічний стек (оновлено)
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: Expo + React Native + TypeScript
- **Auth**: OTP SMS + Google OAuth
- **AI/ML**: MetaBrain risk prediction engine
- **Retention**: Automated discount triggers



## 📊 PHASE 5: DASHBOARD INTEGRATION + ADVANCED GROWTH ANALYTICS (v1.5.0)

### Dashboard Integration

#### Parent Dashboard (порядок блоків)
1. Hero
2. Critical Alerts
3. ParentRetentionCard (якщо segment = CHURN_RISK або WARNING)
4. ParentOfferCard (якщо є offer і не прострочений)
5. ChildrenOverview
6. NextTraining
7. PaymentStatus
8. MessagesPreview
9. QuickActions
10. FeedPreview

#### Coach Dashboard (порядок блоків)
1. CoachHero
2. CoachActionQueue (actionable layer з кнопками)
3. CoachRiskList
4. TodayScheduleBlock
5. AtRiskStudentsBlock
6. CompetitionsTodayBlock

#### Admin Dashboard (порядок блоків)
1. AdminHero
2. AdminRiskOverview
3. AdminRevenueRiskCard
4. BusinessMetricsBlock
5. RevenueBlock
6. RetentionBlock
7. GroupPerformanceBlock
8. LeadPipelinePreview
9. Competitions KPI

### Coach Actions UI

#### Компонент CoachActionQueueEnhanced
- Кнопка "Написати" → відкриває чат з prefill шаблоном
- Кнопка "Подзвонити" → tel: link або disabled якщо немає номера
- Кнопка "Виконано" → позначає дію як виконану

#### Action Templates (по типу дії)
| ActionType | Prefill Message |
|------------|-----------------|
| LOW_ATTENDANCE | "Доброго дня! Підкажіть, будь ласка, чи зможе дитина відновити відвідування цього тижня?" |
| PAYMENT_OVERDUE | "Доброго дня! Нагадуємо про оплату занять. Якщо є питання — підкажу." |
| COMPETITION_CONFIRMATION | "Доброго дня! Потрібно підтвердити участь у змаганнях. Чекаю на вашу відповідь." |
| ABSENCE_STREAK | "Доброго дня! Помітив, що дитина пропустила кілька тренувань. Чи все гаразд?" |
| PROGRESS_STAGNATION | "Доброго дня! Хочу обговорити прогрес дитини та як ми можемо покращити результати." |
| BELT_READY | "Доброго дня! Радий повідомити, що дитина готова до атестації на новий пояс!" |

### Advanced Growth Analytics API

#### Endpoints
| Endpoint | Метод | Опис |
|----------|-------|------|
| /api/growth/offers | GET | Офери зі статистикою |
| /api/growth/retention-funnel | GET | Воронка утримання |
| /api/growth/discount-efficiency | GET | Ефективність знижок |
| /api/growth/referrals | GET | Реферальна аналітика |
| /api/growth/programs | GET | Аналітика по програмах |
| /api/growth/coaches | GET | Перформанс тренерів |
| /api/growth/competitions | GET | Аналітика змагань |
| /api/growth/overview | GET | Агрегована аналітика |

#### Meta Hooks (Frontend)
```typescript
useParentMeta() → /api/meta/parent
useCoachMeta() → /api/meta/coach
useAdminMeta() → /api/meta/admin
```

### Файли реалізації

#### Frontend
- `/app/(tabs)/index.tsx` - оновлений Home з Meta інтеграцією
- `/src/components/metabrain/CoachActionQueueEnhanced.tsx` - компонент з кнопками дій
- `/src/hooks/useMetaHooks.ts` - hooks для Meta даних

#### Backend
- `/modules/growth-engine/growth-engine.controller.ts` - розширені endpoints
- `/modules/growth-engine/growth-engine.service.ts` - аналітичні методи


## 🧠 PHASE 6: LTV ENGINE + PREDICTIVE ENGINE (v1.6.0)

### LTV Engine Integration

**Що робить LTV Engine:**
- Обчислює ARPU (Average Revenue Per User)
- Рахує churnProbability через attendanceRate
- Визначає expectedMonths
- Обчислює LTV = ARPU × expectedMonths
- Сегментує: HIGH (>20000 грн), MID (8000-20000), LOW (<8000)

**Правила динамічного ціноутворення:**
| LTV Segment | Discount |
|-------------|----------|
| HIGH | 10% |
| MID | 20% |
| LOW | 35% |

**Жорстке правило економії ресурсів:**
```
if (ltv < 2000 && riskScore > 80) return 'NOT_WORTH_SAVING'
```

**Upsell логіка:**
```
if (segment === 'HIGH' && riskScore < 30) return 'UPSELL_VIP'
```

### Predictive Engine

**Next Best Actions:**
| Action | Умова |
|--------|-------|
| PAYMENT_REMINDER | paymentRisk > 0.7 |
| RETENTION_DISCOUNT | churn7d > 0.7 |
| UPSELL_VIP | upsellProbability > 0.75 |
| COACH_CALL | returnProbability < 0.35 |
| COACH_MESSAGE | churn7d > 0.5 |
| SEND_PUSH | churn7d > 0.3 |
| NO_ACTION | default |

**Features для прогнозу:**
- attendanceRate
- missedInRow
- noVisitDays
- paymentOverdueDays
- competitionsCount
- medalsCount
- bookingPersonalCount
- monthsActive

### API Endpoints

| Endpoint | Метод | Опис |
|----------|-------|------|
| /api/predictive/admin | GET | Агрегована статистика прогнозів |
| /api/predictive/user/:userId | GET | Прогноз для конкретного user |

### Інтеграція в MetaBrain

MetaBrain тепер використовує LTV та Predictive для прийняття рішень:

1. **Перевірка чи варто рятувати:** LTV + RiskScore
2. **Перевірка на upsell:** HIGH LTV + LOW risk
3. **Predictive дії:** створення CoachActions по nextBestAction
4. **Dynamic pricing:** знижка базується на LTV segment

### Файли

#### Backend
- `/modules/ltv/ltv.service.ts` - LTV Engine
- `/modules/ltv/ltv.module.ts`
- `/modules/predictive/predictive.service.ts` - Predictive Engine
- `/modules/predictive/predictive.controller.ts`
- `/modules/predictive/predictive.module.ts`
- `/modules/meta-brain/meta-brain.service.ts` - оновлено з LTV + Predictive

### Результат

Після цієї фази система:
- ✅ Автоматично приймає рішення про знижки
- ✅ Не витрачає ресурси на "дешевих" клієнтів
- ✅ Апселить VIP для найцінніших
- ✅ Створює дії для тренерів на основі прогнозів
- ✅ Використовує weighted scoring замість hardcoded rules
