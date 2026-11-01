import { OrderStatus, Prisma } from "@prisma/client";

/**
 * Order statuses that must NEVER count as a sale (revenue, items sold,
 * top dishes, sales by category, payments).
 *
 * `Order.status` is the Prisma enum `OrderStatus`
 * (queued | preparing | ready | completed | cancelled). Only `cancelled` is
 * excluded: the others are orders that exist and will be (or already are)
 * served. If the team later adds a status that is not a sale, add it here and
 * every metric (Prisma and raw SQL) follows.
 *
 * Only `orders-by-status` ignores this list on purpose: it is the breakdown
 * of ALL orders by status, cancelled ones included.
 */
export const NON_SALE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.cancelled,
];

/** Prisma-client filter: only orders whose status counts as a sale. */
export const SALE_ORDER_FILTER: Prisma.OrderWhereInput = {
  status: { notIn: [...NON_SALE_STATUSES] },
};

/**
 * Raw-SQL equivalent of SALE_ORDER_FILTER. The orders table MUST be aliased
 * as `o` in the query that embeds this fragment. `status` is a PostgreSQL
 * enum, so it is compared as text.
 */
export const SALE_ORDER_SQL: Prisma.Sql = Prisma.sql`o.status::text NOT IN (${Prisma.join(
  [...NON_SALE_STATUSES],
)})`;
