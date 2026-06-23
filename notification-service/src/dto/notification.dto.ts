import { IsNotEmpty, IsString } from "class-validator";

export class CreateNotificationDto {
  @IsString("Notification message must be a string")
  @IsNotEmpty("Notification message cannot be empty")
  id: string;
}
