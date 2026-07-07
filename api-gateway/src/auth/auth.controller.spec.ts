import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_MS,
} from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController workflow', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    register: jest.Mock;
    refreshToken: jest.Mock;
    logout: jest.Mock;
    socialLoginGoogle: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      socialLoginGoogle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('register should forward the payload to auth service', () => {
    authService.register.mockReturnValue(of({ id: 'user-1' }));

    const payload = {
      email: 'alice@example.com',
      password: 'secret123',
      username: 'alice',
    };

    const result = controller.register(payload);

    expect(authService.register).toHaveBeenCalledWith(payload);
    expect(result).toBeDefined();
  });

  it('login should set auth cookies after the auth service issues tokens', async () => {
    authService.login.mockReturnValue(
      of({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    );

    const response = buildResponse();
    const result = await controller.login(
      {
        email: 'alice@example.com',
        password: 'secret123',
      },
      response as never,
    );

    expect(authService.login).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'secret123',
    });
    expect(response.cookie).toHaveBeenNthCalledWith(
      1,
      ACCESS_TOKEN_COOKIE_NAME,
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      }),
    );
    expect(response.cookie).toHaveBeenNthCalledWith(
      2,
      REFRESH_TOKEN_COOKIE_NAME,
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      }),
    );
    expect(result).toEqual({ success: true });
  });

  it('refreshToken should read the refresh cookie and rotate both cookies', async () => {
    authService.refreshToken.mockReturnValue(
      of({
        accessToken: 'next-access-token',
        refreshToken: 'next-refresh-token',
      }),
    );

    const response = buildResponse();
    const result = await controller.refreshToken(
      {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'existing-refresh-token',
        },
      } as never,
      response as never,
    );

    expect(authService.refreshToken).toHaveBeenCalledWith({
      refreshToken: 'existing-refresh-token',
    });
    expect(response.cookie).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ success: true });
  });

  it('refreshToken should reject requests without a refresh token cookie', async () => {
    await expect(
      controller.refreshToken({ cookies: {} } as never, buildResponse() as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logout should forward the refresh token and clear auth cookies', async () => {
    authService.logout.mockReturnValue(
      of({
        success: true,
        message: 'Logout successful',
      }),
    );

    const response = buildResponse();
    const result = await controller.logout(
      {
        cookies: {
          [REFRESH_TOKEN_COOKIE_NAME]: 'refresh-token',
        },
      } as never,
      response as never,
    );

    expect(authService.logout).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
    expect(response.clearCookie).toHaveBeenNthCalledWith(
      1,
      ACCESS_TOKEN_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    );
    expect(response.clearCookie).toHaveBeenNthCalledWith(
      2,
      REFRESH_TOKEN_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    );
    expect(result).toEqual({
      success: true,
      message: 'Logout successful',
    });
  });

  it('session should expose the authenticated user payload', () => {
    expect(
      controller.session({
        user: {
          userId: 'user-1',
          email: 'alice@example.com',
          role: 1,
        },
      }),
    ).toEqual({
      userId: 'user-1',
      email: 'alice@example.com',
      role: 1,
    });
  });
});

type MockResponse = {
  cookie: jest.Mock;
  clearCookie: jest.Mock;
};

function buildResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } satisfies MockResponse;
}
