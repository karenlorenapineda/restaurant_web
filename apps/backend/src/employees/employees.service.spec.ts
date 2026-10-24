import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  let service: EmployeesService;

  const prismaMock = {
    employee: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const createData = {
    userId: 1,
    firstName: 'Alex',
    lastName: 'Smith',
    restaurantId: 1,
    positionId: 2,
  };

  const makePrismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('Database operation failed', {
      code,
      clientVersion: 'test',
    });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getEmployees', () => {
    it('formats employees with their position and user role', async () => {
      prismaMock.employee.findMany.mockResolvedValue([
        {
          id: 1,
          firstName: 'Alex',
          lastName: 'Smith',
          phone: '+34123456789',
          isActive: true,
          user: {
            email: 'alex@example.com',
            passwordHash: 'private-hash',
            role: { name: 'Manager' },
          },
          position: { name: 'Chef' },
        },
        {
          id: 2,
          firstName: 'Sam',
          lastName: 'Jones',
          phone: null,
          isActive: false,
          user: {
            email: 'sam@example.com',
            role: { name: 'Employee' },
          },
          position: { name: 'Waiter' },
        },
      ]);

      await expect(service.getEmployees()).resolves.toEqual([
        {
          id: 1,
          name: 'Alex Smith',
          phone: '+34123456789',
          active: true,
          email: 'alex@example.com',
          position: 'Chef',
          role: 'Manager',
        },
        {
          id: 2,
          name: 'Sam Jones',
          phone: null,
          active: false,
          email: 'sam@example.com',
          position: 'Waiter',
          role: 'Employee',
        },
      ]);

      expect(prismaMock.employee.findMany).toHaveBeenCalledWith({
        include: {
          user: { include: { role: true } },
          position: true,
        },
      });
    });

    it('returns an empty array when no employees exist', async () => {
      prismaMock.employee.findMany.mockResolvedValue([]);

      await expect(service.getEmployees()).resolves.toEqual([]);
    });

    it('propagates query errors', async () => {
      const error = new Error('Employee query failed');
      prismaMock.employee.findMany.mockRejectedValue(error);

      await expect(service.getEmployees()).rejects.toBe(error);
    });
  });

  describe('createEmployee', () => {
    it('creates an employee with optional fields', async () => {
      const data = {
        ...createData,
        phone: '+34123456789',
        birthDate: '1998-05-10T00:00:00.000Z',
      };
      const employee = { id: 7, ...data };

      prismaMock.employee.create.mockResolvedValue(employee);

      await expect(service.createEmployee(data)).resolves.toEqual(
        employee,
      );

      expect(prismaMock.employee.create).toHaveBeenCalledWith({
        data,
      });
    });

    it('allows optional fields to be omitted', async () => {
      const employee = { id: 7, ...createData };
      prismaMock.employee.create.mockResolvedValue(employee);

      await expect(service.createEmployee(createData)).resolves.toEqual(
        employee,
      );

      expect(prismaMock.employee.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it('propagates duplicate user errors', async () => {
      const error = makePrismaError('P2002');
      prismaMock.employee.create.mockRejectedValue(error);

      await expect(service.createEmployee(createData)).rejects.toBe(error);
    });

    it('propagates foreign key errors', async () => {
      const error = makePrismaError('P2003');
      prismaMock.employee.create.mockRejectedValue(error);

      await expect(service.createEmployee(createData)).rejects.toBe(error);
    });
  });

  describe('updateEmployee', () => {
    it('updates only the supplied fields', async () => {
      const data = { firstName: 'Taylor', positionId: 3 };
      const employee = { id: 7, ...data };

      prismaMock.employee.update.mockResolvedValue(employee);

      await expect(service.updateEmployee(7, data)).resolves.toEqual(
        employee,
      );

      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data,
      });
    });

    it('converts a Prisma P2025 error into NotFoundException', async () => {
      prismaMock.employee.update.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(
        service.updateEmployee(99, { firstName: 'Taylor' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates other Prisma errors', async () => {
      const error = makePrismaError('P2003');
      prismaMock.employee.update.mockRejectedValue(error);

      await expect(
        service.updateEmployee(7, { positionId: 99 }),
      ).rejects.toBe(error);
    });

    it('propagates unexpected errors', async () => {
      const error = new Error('Employee update failed');
      prismaMock.employee.update.mockRejectedValue(error);

      await expect(
        service.updateEmployee(7, { firstName: 'Taylor' }),
      ).rejects.toBe(error);
    });
  });

  describe('activateEmployee', () => {
    it('activates the employee and clears the termination date', async () => {
      const employee = {
        id: 7,
        isActive: true,
        terminationDate: null,
      };

      prismaMock.employee.update.mockResolvedValue(employee);

      await expect(service.activateEmployee(7)).resolves.toEqual(employee);

      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          isActive: true,
          terminationDate: null,
        },
      });
    });

    it('converts a Prisma P2025 error into NotFoundException', async () => {
      prismaMock.employee.update.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(
        service.activateEmployee(99),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates other Prisma errors', async () => {
      const error = makePrismaError('P2003');
      prismaMock.employee.update.mockRejectedValue(error);

      await expect(service.activateEmployee(7)).rejects.toBe(error);
    });

    it('propagates unexpected errors', async () => {
      const error = new Error('Employee activation failed');
      prismaMock.employee.update.mockRejectedValue(error);

      await expect(service.activateEmployee(7)).rejects.toBe(error);
    });
  });

  describe('deactivateEmployee', () => {
    it('deactivates the employee and records the current termination date', async () => {
      const now = new Date('2026-10-16T16:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const employee = {
        id: 7,
        isActive: false,
        terminationDate: now,
      };

      prismaMock.employee.update.mockResolvedValue(employee);

      await expect(service.deactivateEmployee(7)).resolves.toEqual(
        employee,
      );

      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          isActive: false,
          terminationDate: now,
        },
      });
    });

    it('converts a Prisma P2025 error into NotFoundException', async () => {
      prismaMock.employee.update.mockRejectedValue(
        makePrismaError('P2025'),
      );

      await expect(
        service.deactivateEmployee(99),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates other Prisma errors', async () => {
      const error = makePrismaError('P2003');
      prismaMock.employee.update.mockRejectedValue(error);

      await expect(service.deactivateEmployee(7)).rejects.toBe(error);
    });

    it('propagates unexpected errors', async () => {
      const error = new Error('Employee deactivation failed');
      prismaMock.employee.update.mockRejectedValue(error);

      await expect(service.deactivateEmployee(7)).rejects.toBe(error);
    });
  });
});
