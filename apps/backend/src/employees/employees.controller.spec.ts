import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

describe('EmployeesController', () => {
  let controller: EmployeesController;

  const employeesServiceMock = {
    getEmployees: jest.fn(),
    createEmployee: jest.fn(),
    updateEmployee: jest.fn(),
    activateEmployee: jest.fn(),
    deactivateEmployee: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: employeesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
  });

  describe('getEmployees', () => {
    it('returns employees from the service', async () => {
      const employees = [{ id: 7, name: 'Alex Smith' }];
      employeesServiceMock.getEmployees.mockResolvedValue(employees);

      await expect(controller.getEmployees()).resolves.toEqual(employees);

      expect(employeesServiceMock.getEmployees).toHaveBeenCalledTimes(1);
      expect(employeesServiceMock.getEmployees).toHaveBeenCalledWith();
    });

    it('returns an empty array when no employees exist', async () => {
      employeesServiceMock.getEmployees.mockResolvedValue([]);

      await expect(controller.getEmployees()).resolves.toEqual([]);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to fetch employees');
      employeesServiceMock.getEmployees.mockRejectedValue(error);

      await expect(controller.getEmployees()).rejects.toBe(error);
    });
  });

  describe('createEmployee', () => {
    const data = {
      userId: 1,
      firstName: 'Alex',
      lastName: 'Smith',
      restaurantId: 1,
      positionId: 2,
    };

    it('passes creation data to the service and returns its result', async () => {
      const employee = { id: 7, ...data };
      employeesServiceMock.createEmployee.mockResolvedValue(employee);

      await expect(controller.createEmployee(data)).resolves.toEqual(
        employee,
      );

      expect(employeesServiceMock.createEmployee).toHaveBeenCalledTimes(1);
      expect(employeesServiceMock.createEmployee).toHaveBeenCalledWith(
        data,
      );
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to create employee');
      employeesServiceMock.createEmployee.mockRejectedValue(error);

      await expect(controller.createEmployee(data)).rejects.toBe(error);
    });
  });

  describe('updateEmployee', () => {
    it('passes the employee ID and update data to the service', async () => {
      const data = { firstName: 'Taylor' };
      const employee = { id: 7, ...data };

      employeesServiceMock.updateEmployee.mockResolvedValue(employee);

      await expect(controller.updateEmployee(7, data)).resolves.toEqual(
        employee,
      );

      expect(employeesServiceMock.updateEmployee).toHaveBeenCalledTimes(1);
      expect(employeesServiceMock.updateEmployee).toHaveBeenCalledWith(
        7,
        data,
      );
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to update employee');
      employeesServiceMock.updateEmployee.mockRejectedValue(error);

      await expect(
        controller.updateEmployee(7, { firstName: 'Taylor' }),
      ).rejects.toBe(error);
    });
  });

  describe('activateEmployee', () => {
    it('passes the employee ID and returns the activated employee', async () => {
      const employee = {
        id: 7,
        isActive: true,
        terminationDate: null,
      };

      employeesServiceMock.activateEmployee.mockResolvedValue(employee);

      await expect(controller.activateEmployee(7)).resolves.toEqual(
        employee,
      );

      expect(
        employeesServiceMock.activateEmployee,
      ).toHaveBeenCalledTimes(1);
      expect(employeesServiceMock.activateEmployee).toHaveBeenCalledWith(7);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to activate employee');
      employeesServiceMock.activateEmployee.mockRejectedValue(error);

      await expect(controller.activateEmployee(7)).rejects.toBe(error);
    });
  });

  describe('deactivateEmployee', () => {
    it('passes the employee ID and returns the deactivated employee', async () => {
      const employee = {
        id: 7,
        isActive: false,
        terminationDate: new Date('2026-10-16T16:00:00.000Z'),
      };

      employeesServiceMock.deactivateEmployee.mockResolvedValue(employee);

      await expect(controller.deactivateEmployee(7)).resolves.toEqual(
        employee,
      );

      expect(
        employeesServiceMock.deactivateEmployee,
      ).toHaveBeenCalledTimes(1);
      expect(
        employeesServiceMock.deactivateEmployee,
      ).toHaveBeenCalledWith(7);
    });

    it('propagates service errors', async () => {
      const error = new Error('Failed to deactivate employee');
      employeesServiceMock.deactivateEmployee.mockRejectedValue(error);

      await expect(controller.deactivateEmployee(7)).rejects.toBe(error);
    });
  });
});

