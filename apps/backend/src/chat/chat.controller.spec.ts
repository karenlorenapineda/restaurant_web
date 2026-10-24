import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;

  const chatServiceMock = {
    sendMessage: jest.fn(),
    getConversation: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatServiceMock },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  describe('sendMessage', () => {
    it('passes the message data to the service and returns its result', async () => {
      const dto = {
        senderId: 1,
        receiverId: 2,
        message: 'Hello',
      };
      const message = {
        id: 10,
        ...dto,
        sentAt: new Date('2026-10-16T12:00:00Z'),
      };

      chatServiceMock.sendMessage.mockResolvedValue(message);

      await expect(controller.sendMessage(dto)).resolves.toEqual(message);

      expect(chatServiceMock.sendMessage).toHaveBeenCalledTimes(1);
      expect(chatServiceMock.sendMessage).toHaveBeenCalledWith(dto);
    });

    it('propagates service errors', async () => {
      const error = new Error('Message sending failed');
      chatServiceMock.sendMessage.mockRejectedValue(error);

      await expect(
        controller.sendMessage({
          senderId: 1,
          receiverId: 2,
          message: 'Hello',
        }),
      ).rejects.toBe(error);
    });
  });

  describe('getConversation', () => {
    it('passes both user IDs and returns the conversation', async () => {
      const messages = [{ id: 10, message: 'Hello' }];
      chatServiceMock.getConversation.mockResolvedValue(messages);

      await expect(
        controller.getConversation(1, 2),
      ).resolves.toEqual(messages);

      expect(chatServiceMock.getConversation).toHaveBeenCalledTimes(1);
      expect(chatServiceMock.getConversation).toHaveBeenCalledWith(1, 2);
    });

    it('returns an empty conversation', async () => {
      chatServiceMock.getConversation.mockResolvedValue([]);

      await expect(controller.getConversation(1, 2)).resolves.toEqual([]);
    });

    it('propagates service errors', async () => {
      const error = new Error('Conversation retrieval failed');
      chatServiceMock.getConversation.mockRejectedValue(error);

      await expect(controller.getConversation(1, 2)).rejects.toBe(error);
    });
  });
});
