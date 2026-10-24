import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { isPrismaNotFoundError } from '../common/utils/prisma-error.util';

@Injectable()
export class EmployeesService {
	constructor(private readonly prisma: PrismaService) {}

	async getEmployees(){
		const employess = await this.prisma.employee.findMany({
			include: {
				user: {
					include: {
						role: true,
					}
				},
				position: true,
			}
		});
		return employess.map((employee) => ({
			id: employee.id,
			name: `${employee.firstName} ${employee.lastName}`,
			phone: employee.phone,
			active: employee.isActive,
			email: employee.user.email,
			position: employee.position.name,
			role: employee.user.role.name,
		}));
	}

	async createEmployee(data: CreateEmployeeDto) {
		return await this.prisma.employee.create({
			data: data,
		});
	}

	async updateEmployee(id: number, data: UpdateEmployeeDto) {
		try{
			return await this.prisma.employee.update({
				where: {id: id},
				data: data,
			});
		} catch(error) {
			if (isPrismaNotFoundError(error)) {
				throw new NotFoundException(`Employee id ${id} not found`);
			}
			throw error;
		}
	}

	async activateEmployee(id: number) {
		try{
			return await this.prisma.employee.update({
				where: {id: id},
				data: {
					isActive: true,
					terminationDate: null,
				}
			});
		} catch(error) {
			if (isPrismaNotFoundError(error)){
				throw new NotFoundException(`Employee id ${id} not found`);
			}
			throw error;
		}
	}

	async deactivateEmployee(id: number) {
		try {
			return await this.prisma.employee.update({
				where: {id: id},
				data: {
					isActive: false,
					terminationDate: new Date(),
				}
			});
		} catch (error) {
			if (isPrismaNotFoundError(error)){
				throw new NotFoundException(`Employee id ${id} not found`);
			}
			throw error;
		}
	}
}
