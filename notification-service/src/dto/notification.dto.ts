import { IsNotEmpty, IsString } from "class-validator";

export class CreateNotificationDto {
  @IsString({message: "Notification message must be a string"})
  @IsNotEmpty({message: "Notification message cannot be empty"})
  id: string;
}
