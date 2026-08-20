import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";

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
  ],
})
export class AppModule {}
