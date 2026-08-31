import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Controller('inventory')
export class InventoryController {
	constructor(private readonly inventoryService: InventoryService) {}

	@Get()
	getInventoryItems(){
		return this.inventoryService.getInventoryItems();
	}

	@Post()
	createInventoryItem(@Body() newItemData: CreateInventoryItemDto){
		return this.inventoryService.createInventoryItem(newItemData);
	}

	@Patch(':id')
	updateInventoryItem(@Param('id', ParseIntPipe) id: number, @Body() updateData: UpdateInventoryItemDto) {
		return this.inventoryService.updateInventoryItem(id, updateData);
	}

	@Delete(':id')
	deleteInventoryItem(@Param('id', ParseIntPipe) id: number){
		return this.inventoryService.deleteInventoryItem(id);
	}

}
