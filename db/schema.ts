import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  smallint,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const approvalModeEnum = pgEnum("approval_mode", ["AUTO", "MANUAL"]);
export const serviceAvailabilityModeEnum = pgEnum("service_availability_mode", ["GLOBAL", "CUSTOM"]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "NEW",
  "CONTACTED",
  "CLOSED",
]);

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const services = pgTable("services", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  durationMinutes: integer("duration_minutes").notNull(),
  bufferMinutes: integer("buffer_minutes").notNull().default(0),
  approvalMode: approvalModeEnum("approval_mode").notNull().default("AUTO"),
  availabilityMode: serviceAvailabilityModeEnum("availability_mode").notNull().default("GLOBAL"),
  dateRangeStart: text("date_range_start"), // "YYYY-MM-DD" or null
  dateRangeEnd: text("date_range_end"), // "YYYY-MM-DD" or null
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  uniqueIndex("services_slug_idx").on(table.slug),
]);

export const availabilityRules = pgTable("availability_rules", {
  id: id(),
  // 0 = Sunday .. 6 = Saturday, matches JS Date#getDay()
  dayOfWeek: smallint("day_of_week").notNull(),
  startTime: text("start_time").notNull(), // "HH:mm"
  endTime: text("end_time").notNull(), // "HH:mm"
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [
  index("availability_rules_day_of_week_idx").on(table.dayOfWeek),
  index("availability_rules_active_idx").on(table.active),
]);

export const serviceAvailabilityRules = pgTable("service_availability_rules", {
  id: id(),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  dayOfWeek: smallint("day_of_week").notNull(),
  startTime: text("start_time").notNull(), // "HH:mm"
  endTime: text("end_time").notNull(), // "HH:mm"
  active: boolean("active").notNull().default(true),
  ...timestamps,
}, (table) => [
  index("service_availability_rules_service_id_idx").on(table.serviceId),
  index("service_availability_rules_day_of_week_idx").on(table.dayOfWeek),
  index("service_availability_rules_active_idx").on(table.active),
]);

export const blockedPeriods = pgTable("blocked_periods", {
  id: id(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: text("reason").notNull().default(""),
  ...timestamps,
}, (table) => [
  index("blocked_periods_start_at_idx").on(table.startAt),
  index("blocked_periods_end_at_idx").on(table.endAt),
]);

export const bookings = pgTable("bookings", {
  id: id(),
  bookingNumber: text("booking_number").notNull(),
  pin: text("pin"),
  manageToken: text("manage_token")
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "restrict" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  photoPublicationConsent: boolean("photo_publication_consent"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  status: bookingStatusEnum("status").notNull().default("PENDING"),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("bookings_booking_number_idx").on(table.bookingNumber),
  uniqueIndex("bookings_pin_idx").on(table.pin),
  uniqueIndex("bookings_manage_token_idx").on(table.manageToken),
  index("bookings_service_id_idx").on(table.serviceId),
  index("bookings_start_at_idx").on(table.startAt),
  index("bookings_end_at_idx").on(table.endAt),
  index("bookings_status_idx").on(table.status),
  index("bookings_customer_email_idx").on(table.customerEmail),
]);

export const adminUsers = pgTable("admin_users", {
  id: id(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("admin_users_email_idx").on(table.email),
]);

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("default"),
  timezone: text("timezone").notNull().default("Europe/Budapest"),
  adminNotificationEmail: text("admin_notification_email").notNull(),
  siteContactEmail: text("site_contact_email").notNull(),
  minimumLeadTimeHours: integer("minimum_lead_time_hours")
    .notNull()
    .default(2),
  maxAdvanceDays: integer("max_advance_days").notNull().default(90),
  ...timestamps,
});

export const institutionInquiries = pgTable("institution_inquiries", {
  id: id(),
  institutionName: text("institution_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  estimatedParticipantCount: text("estimated_participant_count"),
  preferredPeriod: text("preferred_period"),
  message: text("message"),
  status: inquiryStatusEnum("status").notNull().default("NEW"),
  ...timestamps,
}, (table) => [
  index("institution_inquiries_status_idx").on(table.status),
]);

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
export type ServiceAvailabilityRule = typeof serviceAvailabilityRules.$inferSelect;
export type NewServiceAvailabilityRule = typeof serviceAvailabilityRules.$inferInsert;
export type BlockedPeriod = typeof blockedPeriods.$inferSelect;
export type NewBlockedPeriod = typeof blockedPeriods.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InstitutionInquiry = typeof institutionInquiries.$inferSelect;
export type NewInstitutionInquiry = typeof institutionInquiries.$inferInsert;
