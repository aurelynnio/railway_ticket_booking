import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import {
  CreateUserRequest,
  FindByEmailRequest,
  GetUserByIdRequest,
  UpdateUserRequest,
  UserProfile,
} from '../common/dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('user_service') private readonly userClient: ClientProxy,
  ) {}

  list() {
    return this.userClient.send({ cmd: 'users.list' }, {});
  }

  profile(userId: UserProfile) {
    return this.userClient.send({ cmd: 'users.profile' }, userId);
  }

  update(data: UpdateUserRequest) {
    return this.userClient.send({ cmd: 'users.update' }, data);
  }

  create(payload: CreateUserRequest) {
    return this.userClient.send({ cmd: 'users.create' }, payload);
  }

  getUserById(userId: GetUserByIdRequest) {
    return this.userClient.send({ cmd: 'users.get_by_id' }, userId);
  }
  findByEmail(email: FindByEmailRequest) {
    return this.userClient.send({ cmd: 'users.find_by_email' }, { email });
  }
}
