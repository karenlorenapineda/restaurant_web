import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { MenuService } from '../menu/menu.service';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [MenuService],
})
export class RecipesModule {}
