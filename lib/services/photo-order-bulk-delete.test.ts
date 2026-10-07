import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { emailOutbox, photoOrders } from "@/db/schema";
import { bulkDeletePhotoOrdersSchema } from "@/lib/validation/photo-order";
import { bulkDeletePhotoOrders } from "./photo-order-service";

const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/db/client", () => ({ db: { transaction: mocks.transaction } }));

const orderIds = [
  "0a239340-d203-4e68-9f16-2a0ec5a6bd10",
  "93dd15f2-c77e-49fb-b0bf-3ec413de2aad",
];
const orders = orderIds.map((id, index) => ({ id, orderNumber: `ZR-2026-0000${index + 1}` }));

function mockTransaction(foundOrders = orders, deletedOrders = foundOrders) {
  const deletedTables: unknown[] = [];
  const deleteConditions: unknown[] = [];
  const returning = vi.fn().mockResolvedValue(deletedOrders.map(({ id }) => ({ id })));
  const tx = {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({
      for: vi.fn().mockResolvedValue(foundOrders),
    })) })) })),
    delete: vi.fn((table: unknown) => ({ where: vi.fn((condition: unknown) => {
      deletedTables.push(table);
      deleteConditions.push(condition);
      return table === photoOrders ? { returning } : Promise.resolve();
    }) })),
  };
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
  return { deletedTables, deleteConditions, returning };
}

beforeEach(() => vi.resetAllMocks());

describe("bulkDeletePhotoOrders", () => {
  it("deletes queued order emails and selected orders transactionally", async () => {
    const { deletedTables, deleteConditions, returning } = mockTransaction();
    await expect(bulkDeletePhotoOrders(orderIds)).resolves.toBe(2);
    expect(deletedTables).toEqual([emailOutbox, photoOrders]);
    expect(returning).toHaveBeenCalledOnce();
    const emailCondition = new PgDialect().sqlToQuery(deleteConditions[0] as Parameters<PgDialect["sqlToQuery"]>[0]);
    expect(emailCondition.sql).toContain("status");
    expect(emailCondition.params).toContain("QUEUED");
    expect(emailCondition.params).toContain("\nRendelési azonosító: ZR-2026-00001\n");
    expect(emailCondition.params).toContain("\nRendelési azonosító: ZR-2026-00002\n");
  });

  it("rejects a stale selection when one of the selected orders does not exist", async () => {
    const { deletedTables } = mockTransaction([]);
    await expect(bulkDeletePhotoOrders(orderIds)).rejects.toThrow("egy része már nem található");
    expect(deletedTables).toEqual([]);
  });

  it("rejects a partial database delete so the transaction can roll back", async () => {
    const { deletedTables } = mockTransaction(orders, [orders[0]]);
    await expect(bulkDeletePhotoOrders(orderIds)).rejects.toThrow("Nem sikerült minden kijelölt rendelést törölni");
    expect(deletedTables).toEqual([emailOutbox, photoOrders]);
  });

  it("returns without opening a transaction for an empty selection", async () => {
    await expect(bulkDeletePhotoOrders([])).resolves.toBe(0);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("bulkDeletePhotoOrdersSchema", () => {
  it("accepts a non-empty list of unique UUIDs", () => {
    expect(bulkDeletePhotoOrdersSchema.safeParse({ orderIds }).success).toBe(true);
  });

  it("rejects an empty list, duplicate IDs, invalid IDs and more than 500 IDs", () => {
    expect(bulkDeletePhotoOrdersSchema.safeParse({ orderIds: [] }).success).toBe(false);
    expect(bulkDeletePhotoOrdersSchema.safeParse({ orderIds: [orderIds[0], orderIds[0]] }).success).toBe(false);
    expect(bulkDeletePhotoOrdersSchema.safeParse({ orderIds: ["invalid"] }).success).toBe(false);
    expect(bulkDeletePhotoOrdersSchema.safeParse({ orderIds: Array(501).fill(orderIds[0]) }).success).toBe(false);
  });
});
