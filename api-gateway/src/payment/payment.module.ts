import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VnpayModule } from 'nestjs-vnpay';
import { HashAlgorithm, ignoreLogger } from 'vnpay';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VnpayController } from './vnpay.controller';
import { VnpayPaymentService } from './vnpay.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'payment_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'payments_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    VnpayModule.register({
      tmnCode: process.env.VNPAY_TMN_CODE || 'TEST_TMN_CODE',
      secureSecret: process.env.VNPAY_SECURE_SECRET || 'TEST_SECURE_SECRET',
      vnpayHost: process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn',
      testMode: process.env.VNPAY_TEST_MODE === 'true',
      hashAlgorithm: HashAlgorithm.SHA512,
      enableLog: process.env.NODE_ENV !== 'production',
      loggerFn: ignoreLogger,
    }),
    OrderModule,
  ],
  controllers: [PaymentController, VnpayController],
  providers: [PaymentService, VnpayPaymentService],
})
export class PaymentModule {}
