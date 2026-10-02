import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Upper bound for a single marketing broadcast fan-out request. */
export const MAX_BROADCAST_RECIPIENTS = 1000;

export class BroadcastMarketingRequest {
  @IsString({ message: 'Tiêu đề thông báo phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Tiêu đề thông báo không được để trống' })
  @MinLength(3, { message: 'Tiêu đề thông báo phải có ít nhất 3 ký tự' })
  @MaxLength(200)
  subject: string;

  @IsString({ message: 'Nội dung thông báo phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Nội dung thông báo không được để trống' })
  @MinLength(5, { message: 'Nội dung thông báo phải có ít nhất 5 ký tự' })
  @MaxLength(20000)
  body: string;

  @IsOptional()
  @IsString({ message: 'Mã voucher phải là chuỗi' })
  @MaxLength(64)
  voucherCode?: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách email phải là một mảng' })
  @ArrayMaxSize(MAX_BROADCAST_RECIPIENTS)
  @IsEmail({}, { each: true, message: 'Địa chỉ email người nhận không hợp lệ' })
  recipientEmails?: string[];
}

