import { Body, Controller, Get, Post, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('menu')
export class MenuController {
	constructor(private readonly menuService: MenuService) {}
	
	@Get()
	getMenuSections(){
		return this.menuService.getMenuSections();
	}

	@Get('featured')
	getFeaturedMenuItems(){
		return this.menuService.getFeaturedMenuItems();
	}

	@Get('management')
	getManagementMenuData(){
		return this.menuService.getManagementMenuData();
	}

	@Post()
	createMenuItem(@Body() newDishData: CreateMenuItemDto){
		return this.menuService.createMenuItem(newDishData);
	}

	@Patch(':id')
	updateMenuItem(@Param('id', ParseIntPipe) id: number, @Body() updateData: UpdateMenuItemDto){
		return this.menuService.updateMenuItem(id, updateData);
	}

	@Delete(':id')
	deleteMenuItem(@Param('id', ParseIntPipe) id: number){
		return this.menuService.deleteMenuItem(id);
	}
}
