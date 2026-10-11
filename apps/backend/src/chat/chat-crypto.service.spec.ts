import { Test, TestingModule } from '@nestjs/testing';
import { ChatCryptoService } from './chat-crypto.service';

describe('ChatCryptoService', () => {
  let service: ChatCryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatCryptoService],
    }).compile();

    service = module.get<ChatCryptoService>(ChatCryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
