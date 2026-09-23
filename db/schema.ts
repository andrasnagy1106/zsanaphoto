import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  smallint,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { PhotoPrintSize } from "@/lib/photo-order-catalog";

export const approvalModeEnum = pgEnum("approval_mode", ["AUTO", "MANUAL"]);
export const serviceAvailabilityModeEnum = pgEnum("service_availability_mode", ["GLOBAL", "CUSTOM"]);
export const customerPhotoViewModeEnum = pgEnum("customer_photo_view_mode", ["ORDER_ONLY", "GALLERY_ONLY"]);

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

export const photoOrderStatusEnum = pgEnum("photo_order_status", [
  "NEW",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
]);

export const emailOutboxStatusEnum = pgEnum("email_outbox_status", ["SENT", "QUEUED"]);

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
  requiresChildName: boolean("requires_child_name").notNull().default(false),
  generatesPin: boolean("generates_pin").notNull().default(false),
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
  childName: text("child_name"),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  photoPublicationConsent: boolean("photo_publication_consent"),
  customPhotoPrices: jsonb("custom_photo_prices").$type<Partial<Record<PhotoPrintSize, number>> | null>(),
  customerPhotoViewMode: customerPhotoViewModeEnum("customer_photo_view_mode").notNull().default("ORDER_ONLY"),
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

export const photoOrders = pgTable("photo_orders", {
  id: id(),
  orderNumber: text("order_number").notNull(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "restrict" }),
  totalAmount: integer("total_amount").notNull().default(0),
  includesDigital: boolean("includes_digital").notNull().default(false),
  status: photoOrderStatusEnum("status").notNull().default("NEW"),
  notes: text("notes"),
  ...timestamps,
}, (table) => [
  uniqueIndex("photo_orders_order_number_idx").on(table.orderNumber),
  uniqueIndex("photo_orders_one_active_per_booking_idx")
    .on(table.bookingId)
    .where(sql`${table.status} IN ('NEW', 'PROCESSING')`),
  index("photo_orders_booking_id_idx").on(table.bookingId),
  index("photo_orders_status_idx").on(table.status),
  index("photo_orders_created_at_idx").on(table.createdAt),
]);

export const photoOrderItems = pgTable("photo_order_items", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => photoOrders.id, { onDelete: "cascade" }),
  photoId: text("photo_id").notNull(),
  photoTitle: text("photo_title").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull().default(0),
  totalPrice: integer("total_price").notNull().default(0),
  ...timestamps,
}, (table) => [
  index("photo_order_items_order_id_idx").on(table.orderId),
]);

export const eventPhotos = pgTable("event_photos", {
  id: id(),
  bookingId: text("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  pin: text("pin").notNull(),
  publicId: text("public_id").notNull(),
  secureUrl: text("secure_url").notNull(),
  watermarkedUrl: text("watermarked_url").notNull(),
  originalFilename: text("original_filename"),
  title: text("title").notNull(),
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"),
  format: text("format"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  uniqueIndex("event_photos_public_id_idx").on(table.publicId),
  index("event_photos_booking_id_idx").on(table.bookingId),
  index("event_photos_pin_idx").on(table.pin),
  index("event_photos_sort_order_idx").on(table.sortOrder),
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
  defaultPhotoPrices: jsonb("default_photo_prices").$type<Partial<Record<PhotoPrintSize, number>> | null>(),
  aboutPhotoPublicId: text("about_photo_public_id"),
  aboutPhotoUrl: text("about_photo_url"),
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

export const emailOutbox = pgTable("email_outbox", {
  id: id(),
  toAddress: text("to_address").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: emailOutboxStatusEnum("status").notNull().default("QUEUED"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("email_outbox_status_idx").on(table.status),
  index("email_outbox_sent_at_idx").on(table.sentAt),
]);

export const galleryPhotos = pgTable("gallery_photos", {
  id: id(),
  category: text("category").notNull(),
  publicId: text("public_id").notNull(),
  secureUrl: text("secure_url").notNull(),
  caption: text("caption").notNull(),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  uniqueIndex("gallery_photos_public_id_idx").on(table.publicId),
  index("gallery_photos_category_idx").on(table.category),
  index("gallery_photos_sort_order_idx").on(table.sortOrder),
]);

export const sitePhotos = pgTable("site_photos", {
  key: text("key").primaryKey(),
  publicId: text("public_id").notNull(),
  secureUrl: text("secure_url").notNull(),
  ...timestamps,
});

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
export type PhotoOrder = typeof photoOrders.$inferSelect;
export type NewPhotoOrder = typeof photoOrders.$inferInsert;
export type PhotoOrderItem = typeof photoOrderItems.$inferSelect;
export type NewPhotoOrderItem = typeof photoOrderItems.$inferInsert;
export type EventPhoto = typeof eventPhotos.$inferSelect;
export type NewEventPhoto = typeof eventPhotos.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InstitutionInquiry = typeof institutionInquiries.$inferSelect;
export type NewInstitutionInquiry = typeof institutionInquiries.$inferInsert;
export type EmailOutbox = typeof emailOutbox.$inferSelect;
export type NewEmailOutbox = typeof emailOutbox.$inferInsert;
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type NewGalleryPhoto = typeof galleryPhotos.$inferInsert;
export type SitePhoto = typeof sitePhotos.$inferSelect;
export type NewSitePhoto = typeof sitePhotos.$inferInsert;
