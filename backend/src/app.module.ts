import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChildrenModule } from './modules/children/children.module';
import { GroupsModule } from './modules/groups/groups.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProgressModule } from './modules/progress/progress.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CoachModule } from './modules/coach/coach.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { ParentInsightsModule } from './modules/parent-insights/parent-insights.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { BillingModule } from './modules/billing/billing.module';
import { RatingModule } from './modules/rating/rating.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ConsultationModule } from './modules/consultation/consultation.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { CoachActionsModule } from './modules/coach-actions/coach-actions.module';
import { RetentionModule } from './modules/retention/retention.module';
import { PushModule } from './modules/push/push.module';
import { MetaBrainModule } from './modules/meta-brain/meta-brain.module';
import { SmsModule } from './modules/sms/sms.module';

// New Core Architecture Modules (Sprint 4)
import { AdminGroupsModule } from './modules/admin-groups/admin-groups.module';
import { CoachNewModule } from './modules/coach-new/coach-new.module';
import { CompetitionsModule } from './modules/competitions/competitions.module';

// Phase 1: Programs + Booking + Tiers
import { ProgramsModule } from './modules/programs/programs.module';
import { TiersModule } from './modules/tiers/tiers.module';
import { BookingModule } from './modules/booking/booking.module';

// Phase 2: Discounts + Referrals
import { DiscountsModule } from './modules/discounts/discounts.module';
import { ReferralsModule } from './modules/referrals/referrals.module';

// Phase 4: Growth Engine
import { GrowthEngineModule } from './modules/growth-engine/growth-engine.module';

// Phase 5: LTV + Predictive
import { LtvModule } from './modules/ltv/ltv.module';
import { PredictiveModule } from './modules/predictive/predictive.module';

// Phase 6: Multi-tenant SaaS
import { TenantsModule } from './modules/tenants/tenants.module';

// Phase 7: WayForPay Integration
import { WayForPayModule } from './modules/wayforpay/wayforpay.module';

// Phase 8: Control System (100 clubs scale)
import { ControlSystemModule } from './modules/control-system/control-system.module';

// Phase 9: Marketplace
import { MarketplaceModule } from './modules/marketplace/marketplace.module';

// Phase 10: Shop/Store
import { ShopModule } from './modules/shop/shop.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
      }),
    }),

    // Core Services
    SmsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ChildrenModule,
    GroupsModule,
    LocationsModule,
    ScheduleModule,
    AttendanceModule,
    MessagesModule,
    NotificationsModule,
    PaymentsModule,
    ProgressModule,
    DashboardModule,
    CoachModule,
    AdminModule,
    ParentInsightsModule,
    RealtimeModule,
    TournamentsModule,
    BillingModule,
    RatingModule,
    OnboardingModule,
    ConsultationModule,
    AlertsModule,
    CoachActionsModule,
    RetentionModule,
    PushModule,
    MetaBrainModule,

    // New Core Architecture Modules (Sprint 4)
    AdminGroupsModule,
    CoachNewModule,
    
    // Competitions Module
    CompetitionsModule,

    // Phase 1: Programs + Booking + Tiers
    ProgramsModule,
    TiersModule,
    BookingModule,

    // Phase 2: Discounts + Referrals
    DiscountsModule,
    ReferralsModule,

    // Phase 4: Growth Engine
    GrowthEngineModule,

    // Phase 5: LTV + Predictive
    LtvModule,
    PredictiveModule,

    // Phase 6: Multi-tenant SaaS
    TenantsModule,

    // Phase 7: WayForPay Integration
    WayForPayModule,

    // Phase 8: Control System (100 clubs scale)
    ControlSystemModule,

    // Phase 9: Marketplace
    MarketplaceModule,

    // Phase 10: Shop/Store
    ShopModule,
  ],
})
export class AppModule {}
