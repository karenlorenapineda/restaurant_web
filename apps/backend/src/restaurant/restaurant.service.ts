import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RestaurantService {
	constructor(private readonly prisma: PrismaService) {}

	async getRestaurants() {
		return await this.prisma.restaurant.findMany();
	}
}
