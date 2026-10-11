import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class SendMessageDto {

  @IsInt({message: "Sender ID must be a number."})
  @Min(1)
  senderId: number; // Campo temporal hasta integrar JWT, Tambien quitar cuando lo tengamossss


  @IsInt({message: "Receiver ID must be a number."})
  @Min(1)
  receiverId: number;

  @IsString({message: "Message must be a string."})
  @IsNotEmpty()
  message: string;
}