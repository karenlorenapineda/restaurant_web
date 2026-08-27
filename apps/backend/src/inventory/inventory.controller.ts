import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateUnitOfMeasureDto } from './dto/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from './dto/update-unit-of-measure.dto';

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
	updateInventoryItem(@Param('id') id: string, @Body() updateData: UpdateInventoryItemDto) {
		return this.inventoryService.updateInventoryItem(Number(id), updateData);
	}

	@Delete(':id')
	deleteInventoryItem(@Param('id') id: string){
		return this.inventoryService.deleteInventoryItem(Number(id));
	}

	@Get('ingredients')
	getIngredients(){
		return this.inventoryService.getIngredients();
	}

	@Post('ingredients')
	createIngredient(@Body() newIngredientData: CreateIngredientDto){
		return this.inventoryService.createIngredient(newIngredientData);
	}

	@Patch('ingredients/:id')
	updateIngredient(@Param('id') id: string, @Body() updateIngredientData: UpdateIngredientDto){
		return this.inventoryService.updateIngredient(Number(id), updateIngredientData);
	}

	@Delete('ingredients/:id')
	deleteIngredient(@Param('id') id: string){
		return this.inventoryService.deleteIngredient(Number(id));
	}

	@Get('units')
	getUnits(){
		return this.inventoryService.getUnits();
	}

	@Post('units')
	createUnit(@Body() newUnitData: CreateUnitOfMeasureDto){
		return this.inventoryService.createUnit(newUnitData);
	}

	@Patch('units/:id')
	updateUnit(@Param('id') id: string, @Body() updateUnitData: UpdateUnitOfMeasureDto){
		return this.inventoryService.updateUnit(Number(id), updateUnitData);
	}

	@Delete('units/:id')
	deleteUnit(@Param('id') id: string){
		return this.inventoryService.deleteUnit(Number(id));
	}
}
