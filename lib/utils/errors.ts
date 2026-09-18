export class BookingConflictError extends Error {
  constructor(message = "Ezt az időpontot időközben valaki más lefoglalta. Kérjük, válassz másik időpontot.") {
    super(message);
    this.name = "BookingConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "A keresett elem nem található.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends Error {
  constructor(message = "Túl sok próbálkozás történt. Kérjük, próbáld meg később.") {
    super(message);
    this.name = "RateLimitError";
  }
}
