
import {ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Cada cliente se suscribe a su propio canal usando su ID
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody('userId') userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user_${userId}`);
    return { status: 'joined', room: `user_${userId}` };
  }

  // Escucha cuando alguien envía un mensaje
  @SubscribeMessage('sendMessage')
  async handleSendMessage(@MessageBody() dto: SendMessageDto) {
    // 1. Guardar cifrado en la base de datos a través del servicio
    const message = await this.chatService.sendMessage(dto);

    // 2. Emitir el mensaje descifrado en vivo exclusivamente al receptor
    this.server.to(`user_${dto.receiverId}`).emit('newMessage', message);

    // 3. Devolver confirmación inmediata al emisor
    return message;
  }
}