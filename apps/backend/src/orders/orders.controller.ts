import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CurrentUser, UserSessionPayload } from './common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  
@Get()
  getOrders() {
    return this.ordersService.getOrders();
  }

  @Get(':id')
  getOrder(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrder(id);
  }

@Post()
  createOrder(
    @CurrentUser() user: UserSessionPayload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    // Le enviamos al servicio el restaurantId y el employeeId que vienen de la sesión simulada. Quitar cuando ya no haga faltaaaa.
    return this.ordersService.create(
      user.restaurantId,
      createOrderDto,
      user.employeeId,
    );
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateOrderStatusDto.status);
  }
}
