import { Controller, Get } from '@nestjs/common';
import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
	constructor(private readonly unitService: UnitsService){}
	@Get()
	getUnits(){
		return this.unitService.getUnits();
	}
}
