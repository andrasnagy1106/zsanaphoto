export const DEFAULT_MINIMUM_LEAD_TIME_HOURS = 2;
export const DEFAULT_MAX_ADVANCE_DAYS = 90;

export const FAMILY_SERVICE_SLUG = "csaladi-fotozas";
export const INSTITUTION_SERVICE_SLUG = "intezmenyi-fotozas";

export const BOOKING_NUMBER_PREFIX = "ZS";

export const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

/** Reply-to address for all outgoing customer/admin emails (Resend "from" stays the transactional sender). */
export const EMAIL_REPLY_TO_ADDRESS = "zsanafoto@gmail.com";

/** Default Resend "from" sender, used unless overridden by the EMAIL_FROM env var. */
export const EMAIL_FROM_ADDRESS = "ZsaNa Photo <noreply@zsanaphoto.hu>";
