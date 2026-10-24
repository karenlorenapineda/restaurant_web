import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const chatServiceMock = {
    sendMessage: jest.fn(),
  };

  const emitMock = jest.fn();
  const toMock = jest.fn();
  const joinMock = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();
    toMock.mockReturnValue({ emit: emitMock });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: chatServiceMock },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = { to: toMock } as unknown as Server;
  });

  describe('handleJoin', () => {
    it('joins the requested user room and returns confirmation', () => {
      const client = { join: joinMock } as unknown as Socket;

      expect(gateway.handleJoin(2, client)).toEqual({
        status: 'joined',
        room: 'user_2',
      });

      expect(joinMock).toHaveBeenCalledTimes(1);
      expect(joinMock).toHaveBeenCalledWith('user_2');
    });
  });

  describe('handleSendMessage', () => {
    it('saves the message, emits it to the receiver room and returns it', async () => {
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

      await expect(gateway.handleSendMessage(dto)).resolves.toEqual(
        message,
      );

      expect(chatServiceMock.sendMessage).toHaveBeenCalledTimes(1);
      expect(chatServiceMock.sendMessage).toHaveBeenCalledWith(dto);
      expect(toMock).toHaveBeenCalledTimes(1);
      expect(toMock).toHaveBeenCalledWith('user_2');
      expect(emitMock).toHaveBeenCalledTimes(1);
      expect(emitMock).toHaveBeenCalledWith('newMessage', message);
    });

    it('does not emit a message before it has been saved', async () => {
      const dto = {
        senderId: 1,
        receiverId: 2,
        message: 'Hello',
      };
      const message = { id: 10, ...dto };

      let resolveSave!: (value: typeof message) => void;
      const pendingSave = new Promise<typeof message>((resolve) => {
        resolveSave = resolve;
      });

      chatServiceMock.sendMessage.mockReturnValue(pendingSave);

      const pendingResult = gateway.handleSendMessage(dto);

      expect(toMock).not.toHaveBeenCalled();
      expect(emitMock).not.toHaveBeenCalled();

      resolveSave(message);

      await expect(pendingResult).resolves.toEqual(message);
      expect(emitMock).toHaveBeenCalledWith('newMessage', message);
    });

    it('does not emit anything when saving fails', async () => {
      const error = new Error('Message saving failed');
      chatServiceMock.sendMessage.mockRejectedValue(error);

      await expect(
        gateway.handleSendMessage({
          senderId: 1,
          receiverId: 2,
          message: 'Hello',
        }),
      ).rejects.toBe(error);

      expect(toMock).not.toHaveBeenCalled();
      expect(emitMock).not.toHaveBeenCalled();
    });
  });
});