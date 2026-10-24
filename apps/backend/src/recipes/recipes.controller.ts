import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { DeleteRecipeDto } from './dto/delete-recipes.dto';

@Controller('recipes')
export class RecipesController {
	constructor(private readonly recipeService: RecipesService) {}

	@Get()
	getRecipes(){
		return this.recipeService.getRecipes();
	}

	@Get(':dishId')
	getRecipesDish(@Param('dishId', ParseIntPipe) dishId: number){
		return this.recipeService.getRecipesDish(dishId);
	}

	@Post()
	createRecipes(@Body() newRecipeData: CreateRecipeDto){
		return this.recipeService.createRecipes(newRecipeData);
	}

	@Patch()
	updateRecipes(@Body() updateRecipeData: UpdateRecipeDto){
		return this.recipeService.updateRecipes(updateRecipeData);
	}

	@Delete()
	deleteRecipes(@Body() deleteRecipeData: DeleteRecipeDto){
		return this.recipeService.deleteRecipes(deleteRecipeData.ids);
	}

}
