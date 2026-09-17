import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateNotificationDto {
  @IsString({ message: 'Notification message must be a string' })
  @IsNotEmpty({ message: 'Notification message cannot be empty' })
  id: string;
}

export class BroadcastMarketingDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  body: string;

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipientEmails?: string[];

  @IsOptional()
  @IsArray()
  recipients?: Array<{ email: string; userId?: string }>;
}
