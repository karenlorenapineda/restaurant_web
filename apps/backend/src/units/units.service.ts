import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UnitsService {
	constructor(private readonly prisma: PrismaService){}

	async getUnits() {
		return await this.prisma.unitOfMeasure.findMany();
	}
}
