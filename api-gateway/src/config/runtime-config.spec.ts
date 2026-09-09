import { validateApiGatewayRuntimeConfig } from './runtime-config';

describe('validateApiGatewayRuntimeConfig', () => {
  const productionEnvironment = {
    NODE_ENV: 'production',
    CLIENT_ORIGIN: 'https://booking.example.com',
    RABBITMQ_URL: 'amqp://railway:strong-password@rabbitmq:5672',
    VNPAY_TMN_CODE: 'LIVE_TMN_CODE',
    VNPAY_SECURE_SECRET: 'a-live-vnpay-secret',
    VNPAY_PUBLIC_BASE_URL: 'https://api.booking.example.com',
    VNPAY_TEST_MODE: 'false',
  };

  it('accepts a complete production configuration', () => {
    expect(() => validateApiGatewayRuntimeConfig(productionEnvironment)).not.toThrow();
  });

  it('rejects an insecure public origin in production', () => {
    expect(() =>
      validateApiGatewayRuntimeConfig({
        ...productionEnvironment,
        CLIENT_ORIGIN: 'http://booking.example.com',
      }),
    ).toThrow('CLIENT_ORIGIN must be a valid HTTPS URL');
  });

  it('rejects VNPay test mode in production', () => {
    expect(() =>
      validateApiGatewayRuntimeConfig({
        ...productionEnvironment,
        VNPAY_TEST_MODE: 'true',
      }),
    ).toThrow('VNPAY_TEST_MODE must be false');
  });
});
