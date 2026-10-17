import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { CreateIngredientDto } from '../supplies/dto/create-ingredient.dto';
import { UpdateIngredientDto } from '../supplies/dto/update-ingredient.dto';

@Controller('supplies')
export class SuppliesController {
	constructor(private readonly suppliesService: SuppliesService){}
	@Get()
	getIngredients(){
		return this.suppliesService.getIngredients();
	}
	
	@Post()
	createIngredient(@Body() newIngredientData: CreateIngredientDto){
		return this.suppliesService.createIngredient(newIngredientData);
	}
	
	@Patch(':id')
	updateIngredient(@Param('id', ParseIntPipe) id: number, @Body() updateIngredientData: UpdateIngredientDto){
		return this.suppliesService.updateIngredient(id, updateIngredientData);
	}
	
	@Delete(':id')
	deleteIngredient(@Param('id', ParseIntPipe) id: number){
		return this.suppliesService.deleteIngredient(id);
	}
	
}
