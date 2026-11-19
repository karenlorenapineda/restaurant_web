import { Module } from "@nestjs/common";

import { OrdersService } from "../orders/orders.service";
import { SharedOrdersGateway } from "./shared-orders.gateway";
import { SharedOrdersService } from "./shared-orders.service";

/**
 * OrdersService is provided here to create the final order, so the existing
 * OrdersModule does not need to change.
 */
@Module({
  providers: [SharedOrdersService, SharedOrdersGateway, OrdersService],
})
export class SharedOrdersModule {}
