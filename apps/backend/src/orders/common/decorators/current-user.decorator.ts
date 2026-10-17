import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Definimos la forma que tendrán los datos de la sesión del usuario
export interface UserSessionPayload {
  userId: number;
  restaurantId: number;
  employeeId?: number;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserSessionPayload | undefined, ctx: ExecutionContext) => {
    // Obtenemos la petición HTTP que llegó al servidor
    const request = ctx.switchToHttp().getRequest();

    // 🟢 SIMULACIÓN PROVISIONAL:
    // Como aún no hay login con token JWT, inventamos este usuario con ID de restaurante real
    const mockUser: UserSessionPayload = {
      userId: 1,
      restaurantId: 1, // 👈 Asegúrate de que exista un Restaurant con id: 1 en tu base de datos
      employeeId: 1,   // Opcional, o null si no tienes empleados creados todavía
      email: 'mesero@restaurant.com',
    };

    // Si en el futuro ya existe request.user (del token real), usa ese; si no, usa el simulado
    const user: UserSessionPayload = request.user || mockUser;

    return data ? user?.[data] : user;
  },
);