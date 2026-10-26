import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ChatCryptoService } from './chat-crypto.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const cryptoMock = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const dto = {
    senderId: 1,
    receiverId: 2,
    message: 'Hello',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ChatCryptoService, useValue: cryptoMock },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('sendMessage', () => {
    it('stores encrypted text and returns the plaintext message', async () => {
      const sentAt = new Date('2026-10-16T12:00:00Z');

      prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
      cryptoMock.encrypt.mockReturnValue('encrypted-message');

      prismaMock.chatMessage.create.mockResolvedValue({
        id: 10,
        senderId: 1,
        receiverId: 2,
        message: 'encrypted-message',
        sentAt,
        isRead: false,
      });

      await expect(service.sendMessage(dto)).resolves.toEqual({
        id: 10,
        senderId: 1,
        receiverId: 2,
        message: 'Hello',
        sentAt,
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
      });
      expect(cryptoMock.encrypt).toHaveBeenCalledWith('Hello');
      expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
        data: {
          senderId: 1,
          receiverId: 2,
          message: 'encrypted-message',
        },
      });
    });

    it('rejects a missing receiver before encrypting or saving', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      expect(cryptoMock.encrypt).not.toHaveBeenCalled();
      expect(prismaMock.chatMessage.create).not.toHaveBeenCalled();
    });

    it('propagates receiver lookup errors without saving', async () => {
      const error = new Error('Receiver lookup failed');
      prismaMock.user.findUnique.mockRejectedValue(error);

      await expect(service.sendMessage(dto)).rejects.toBe(error);

      expect(cryptoMock.encrypt).not.toHaveBeenCalled();
      expect(prismaMock.chatMessage.create).not.toHaveBeenCalled();
    });

    it('does not save the message when encryption fails', async () => {
      const error = new Error('Encryption failed');

      prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
      cryptoMock.encrypt.mockImplementation(() => {
        throw error;
      });

      await expect(service.sendMessage(dto)).rejects.toBe(error);

      expect(prismaMock.chatMessage.create).not.toHaveBeenCalled();
    });

    it('propagates message creation errors', async () => {
      const error = new Error('Message creation failed');

      prismaMock.user.findUnique.mockResolvedValue({ id: 2 });
      cryptoMock.encrypt.mockReturnValue('encrypted-message');
      prismaMock.chatMessage.create.mockRejectedValue(error);

      await expect(service.sendMessage(dto)).rejects.toBe(error);
    });
  });

  describe('getConversation', () => {
    it('queries both directions in chronological order and decrypts messages', async () => {
      const firstDate = new Date('2026-10-16T12:00:00Z');
      const secondDate = new Date('2026-10-16T12:01:00Z');

      prismaMock.chatMessage.findMany.mockResolvedValue([
        {
          id: 10,
          senderId: 1,
          receiverId: 2,
          message: 'encrypted-first',
          sentAt: firstDate,
          isRead: false,
        },
        {
          id: 11,
          senderId: 2,
          receiverId: 1,
          message: 'encrypted-second',
          sentAt: secondDate,
          isRead: true,
        },
      ]);

      cryptoMock.decrypt
        .mockReturnValueOnce('Hello')
        .mockReturnValueOnce('Hi');

      await expect(service.getConversation(1, 2)).resolves.toEqual([
        {
          id: 10,
          senderId: 1,
          receiverId: 2,
          message: 'Hello',
          sentAt: firstDate,
        },
        {
          id: 11,
          senderId: 2,
          receiverId: 1,
          message: 'Hi',
          sentAt: secondDate,
        },
      ]);

      expect(prismaMock.chatMessage.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: 1, receiverId: 2 },
            { senderId: 2, receiverId: 1 },
          ],
        },
        orderBy: { sentAt: 'asc' },
      });
      expect(cryptoMock.decrypt).toHaveBeenCalledTimes(2);
      expect(cryptoMock.decrypt).toHaveBeenNthCalledWith(
        1,
        'encrypted-first',
      );
      expect(cryptoMock.decrypt).toHaveBeenNthCalledWith(
        2,
        'encrypted-second',
      );
    });

    it('returns an empty array when there are no messages', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([]);

      await expect(service.getConversation(1, 2)).resolves.toEqual([]);

      expect(cryptoMock.decrypt).not.toHaveBeenCalled();
    });

    it('propagates query errors', async () => {
      const error = new Error('Conversation query failed');
      prismaMock.chatMessage.findMany.mockRejectedValue(error);

      await expect(service.getConversation(1, 2)).rejects.toBe(error);
    });

    it('propagates decryption errors', async () => {
      const error = new Error('Decryption failed');

      prismaMock.chatMessage.findMany.mockResolvedValue([
        {
          id: 10,
          senderId: 1,
          receiverId: 2,
          message: 'invalid-payload',
          sentAt: new Date('2026-10-16T12:00:00Z'),
        },
      ]);
      cryptoMock.decrypt.mockImplementation(() => {
        throw error;
      });

      await expect(service.getConversation(1, 2)).rejects.toBe(error);
    });
  });
});
