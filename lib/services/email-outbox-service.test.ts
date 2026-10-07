import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushQueuedEmails } from "./email-outbox-service";

const mocks = vi.hoisted(() => ({ select: vi.fn(), transaction: vi.fn() }));
vi.mock("@/db/client", () => ({ db: mocks }));

beforeEach(() => vi.resetAllMocks());

describe("flushQueuedEmails", () => {
  it.each([false, true])("rechecks queued email under a row lock (still exists: %s)", async (exists) => {
    const email = { id: "email-1", toAddress: "test@example.com", subject: "Booking", body: "Details" };
    mocks.select.mockReturnValueOnce({ from: () => ({ where: async () => [{ count: 0 }] }) })
      .mockReturnValueOnce({ from: () => ({ where: () => ({ orderBy: async () => [email] }) }) })
      .mockReturnValueOnce({ from: () => ({ where: async () => [{ count: 0 }] }) });
    const lock = vi.fn().mockResolvedValue(exists ? [email] : []);
    const update = vi.fn().mockReturnValue({ set: () => ({ where: async () => undefined }) });
    mocks.transaction.mockImplementation(async (callback) => callback({
      select: () => ({ from: () => ({ where: () => ({ for: lock }) }) }), update,
    }));
    const deliver = vi.fn().mockResolvedValue(undefined);
    const result = await flushQueuedEmails(deliver);
    expect(lock).toHaveBeenCalledWith("update");
    expect(deliver).toHaveBeenCalledTimes(exists ? 1 : 0);
    expect(update).toHaveBeenCalledTimes(exists ? 1 : 0);
    expect(result).toEqual({ sent: exists ? 1 : 0, remaining: 0 });
  });
});