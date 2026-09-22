import { describe, expect, it } from "vitest";
import { createAdminUserSchema } from "./admin-user";

describe("createAdminUserSchema", () => {
  it("validates correct admin user data", () => {
    const result = createAdminUserSchema.safeParse({
      name: "Új Admin",
      email: "ujadmin@example.com",
      password: "StrongPassword123!",
    });

    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = createAdminUserSchema.safeParse({
      name: "Új Admin",
      email: "ujadmin@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createAdminUserSchema.safeParse({
      name: "Új Admin",
      email: "invalid-email",
      password: "StrongPassword123!",
    });

    expect(result.success).toBe(false);
  });
});
