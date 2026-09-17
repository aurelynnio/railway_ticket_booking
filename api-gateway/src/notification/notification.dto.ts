import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class BroadcastMarketingRequest {
  @IsString({ message: 'Tiêu đề thông báo phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Tiêu đề thông báo không được để trống' })
  @MinLength(3, { message: 'Tiêu đề thông báo phải có ít nhất 3 ký tự' })
  subject: string;

  @IsString({ message: 'Nội dung thông báo phải là chuỗi văn bản' })
  @IsNotEmpty({ message: 'Nội dung thông báo không được để trống' })
  @MinLength(5, { message: 'Nội dung thông báo phải có ít nhất 5 ký tự' })
  body: string;

  @IsOptional()
  @IsString({ message: 'Mã voucher phải là chuỗi' })
  voucherCode?: string;

  @IsOptional()
  @IsArray({ message: 'Danh sách email phải là một mảng' })
  @IsEmail({}, { each: true, message: 'Địa chỉ email người nhận không hợp lệ' })
  recipientEmails?: string[];
}

