import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  health() {
    return {
      service: 'users-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  list() {
    return [
      {
        id: 'user_mock_1',
        email: 'customer@example.com',
        fullName: 'Railway Customer',
      },
    ];
  }

  profile(userId: string) {
    return {
      id: userId,
      email: 'customer@example.com',
      fullName: 'Railway Customer',
    };
  }
}
