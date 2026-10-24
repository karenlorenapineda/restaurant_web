import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  @Get('conversation/:userA/:userB')
  async getConversation(
    @Param('userA', ParseIntPipe) userA: number,
    @Param('userB', ParseIntPipe) userB: number,
  ) {
    return this.chatService.getConversation(userA, userB);
  }
}