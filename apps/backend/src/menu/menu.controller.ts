import { Body, Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('menu')
export class MenuController {
	constructor(private readonly menuService: MenuService) {}
	
	@Get()
	getMenu(){
		return this.menuService.getMenuData();
	}

	@Get('management')
	getManagement(){
		return this.menuService.getManagementMenuData();
	}

	@Post()
	createMenuItem(@Body() newDishData: CreateMenuItemDto){
		return this.menuService.createMenuItem(newDishData);
	}

	@Patch(':id')
	updateMenuItem(@Param('id') id: string, @Body() updateData: UpdateMenuItemDto){
		return this.menuService.updateMenuItem(Number(id), updateData);
	}

	@Delete(':id')
	deleteMenuItem(@Param('id') id: string){
		return this.menuService.deleteMenuItem(Number(id));
	}

	@Get('category')
	getCategories(){
		return this.menuService.getCategories();
	}

	@Post('category')
	createCategory(@Body() newCategoryData: CreateCategoryDto){
		return this.menuService.createCategory(newCategoryData);
	}

	@Patch('category/:id')
	updateCategory(@Param('id') id: string, @Body() updateData: UpdateCategoryDto){
		return this.menuService.updateCategory(Number(id), updateData);
	}

	@Delete('category/:id')
	deleteCategory(@Param('id') id: string){
		return this.menuService.deleteCategory(Number(id));
	}
}
