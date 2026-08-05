import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module";
import { MenuController } from "./menu.controller";
import { MenuService } from "./menu.service";

@Module({
  controllers: [MenuController],
  imports: [DatabaseModule],
  providers: [MenuService],
})
export class MenuModule {}
