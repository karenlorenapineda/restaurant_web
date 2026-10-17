import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CategoriesService {
	constructor(private readonly prisma: PrismaService){}

	async getCategories(){
		return await this.prisma.menuCategory.findMany();
	}
}
