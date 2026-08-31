import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { MenuModule } from './menu/menu.module';
import { InventoryModule } from './inventory/inventory.module';
import { SuppliesModule } from './supplies/supplies.module';
import { UnitsModule } from './units/units.module';
import { RecipesModule } from './recipes/recipes.module';
import { CategoriesModule } from './categories/categories.module';

function validateEnvironment(config: Record<string, unknown>) {
  const databaseUrl = config.DATABASE_URL;

  if (typeof databaseUrl !== "string" || databaseUrl.length === 0) {
    throw new Error("DATABASE_URL is required");
  }

  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    MenuModule,
    InventoryModule,
    SuppliesModule,
    UnitsModule,
    RecipesModule,
    CategoriesModule,
  ],
})
export class AppModule {}
