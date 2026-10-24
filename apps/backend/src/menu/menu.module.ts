import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  controllers: [MenuController],
  providers: [MenuService],
  imports: [RecipesModule],
})
export class MenuModule {}
