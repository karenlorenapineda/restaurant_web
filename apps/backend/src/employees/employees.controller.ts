import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Controller('employees')
export class EmployeesController {
	constructor(private readonly employeService: EmployeesService){}

	@Get()
	getEmployees(){
		return this.employeService.getEmployees();
	}

	@Post()
	createEmployee(@Body() createEmployeeData: CreateEmployeeDto){
		return this.employeService.createEmployee(createEmployeeData);
	}

	@Patch(':id')
	updateEmployee(@Param('id', ParseIntPipe) id: number, @Body() updateEmployeData: UpdateEmployeeDto){
		return this.employeService.updateEmployee(id, updateEmployeData);
	}

	@Patch(':id/activate')
	activateEmployee(@Param('id', ParseIntPipe) id: number){
		return this.employeService.activateEmployee(id);
	}

	@Patch(':id/deactivate')
	deactivateEmployee(@Param('id', ParseIntPipe) id: number){
		return this.employeService.deactivateEmployee(id);
	}
}
