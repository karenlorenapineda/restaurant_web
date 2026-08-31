import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { RecipesService } from '../recipes/recipes.service';

@Module({
  controllers: [MenuController],
  providers: [MenuService],
  imports: [RecipesService],
})
export class MenuModule {}
