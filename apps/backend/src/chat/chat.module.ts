import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatCryptoService } from './chat-crypto.service';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Module({
  controllers: [ChatController],
  providers: [ChatCryptoService, ChatService, ChatGateway]
})
export class ChatModule {}
