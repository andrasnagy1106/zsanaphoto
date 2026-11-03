import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendWithRateLimitRetry } from "./resend-send";

const mocks = vi.hoisted(() => ({ sleep: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/utils/sleep", () => ({ sleep: mocks.sleep }));

const client = { emails: { send: mocks.send } } as unknown as Parameters<typeof sendWithRateLimitRetry>[0];
const payload = { from: "a@example.com", to: "b@example.com", subject: "S", text: "T" };
const rateLimited = { data: null, error: { name: "rate_limit_exceeded", statusCode: 429, message: "Too many requests" } };
const ok = { data: { id: "email-1" }, error: null };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.sleep.mockResolvedValue(undefined);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("sendWithRateLimitRetry", () => {
  it("sends once when Resend accepts the email", async () => {
    mocks.send.mockResolvedValue(ok);
    await sendWithRateLimitRetry(client, payload);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledWith(payload);
    expect(mocks.sleep).not.toHaveBeenCalled();
  });

  it("retries after a 429 and succeeds", async () => {
    mocks.send.mockResolvedValueOnce(rateLimited).mockResolvedValueOnce(ok);
    await sendWithRateLimitRetry(client, payload);
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.sleep.mock.calls).toEqual([[1000]]);
  });

  it("recognizes a 429 status code even without the error name", async () => {
    mocks.send.mockResolvedValueOnce({ data: null, error: { name: "application_error", statusCode: 429, message: "x" } })
      .mockResolvedValueOnce(ok);
    await sendWithRateLimitRetry(client, payload);
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("gives up after the configured retries with the Resend message", async () => {
    mocks.send.mockResolvedValue(rateLimited);
    await expect(sendWithRateLimitRetry(client, payload)).rejects.toThrow("Too many requests");
    expect(mocks.send).toHaveBeenCalledTimes(3);
    expect(mocks.sleep.mock.calls).toEqual([[1000], [2000]]);
  });

  it("does not retry other errors", async () => {
    mocks.send.mockResolvedValue({ data: null, error: { name: "validation_error", statusCode: 422, message: "Invalid `to` field" } });
    await expect(sendWithRateLimitRetry(client, payload)).rejects.toThrow("Invalid `to` field");
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.sleep).not.toHaveBeenCalled();
  });
});
