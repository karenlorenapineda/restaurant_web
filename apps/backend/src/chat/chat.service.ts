import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ChatCryptoService } from './chat-crypto.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: ChatCryptoService,
  ) {}

  async sendMessage(dto: SendMessageDto) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver user not found');
    }

    const encryptedMessage = this.crypto.encrypt(dto.message);

    const saved = await this.prisma.chatMessage.create({
      data: {
        senderId: dto.senderId,
        receiverId: dto.receiverId,
        message: encryptedMessage,
      },
    });

    return {
		id: saved.id,
		senderId: saved.senderId,
		receiverId: saved.receiverId,
		message: dto.message,
		sentAt: saved.sentAt
    };
  }

  async getConversation(userA: number, userB: number) {
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userA, receiverId: userB },
          { senderId: userB, receiverId: userA },
        ],
      },
      orderBy: { sentAt: 'asc' },
    });

    return messages.map((msg) => ({
		id: msg.id,
		senderId: msg.senderId,
		receiverId: msg.receiverId,
		message: this.crypto.decrypt(msg.message),
		sentAt: msg.sentAt
    }));
  }
}