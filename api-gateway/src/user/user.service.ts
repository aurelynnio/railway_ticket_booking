import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateUserRequest,
  DeleteUserRequest,
  FindByEmailRequest,
  GetUserByIdRequest,
  ListUsersQuery,
  UpdateUserRequest,
  UserProfile,
} from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('user_service') private readonly userClient: ClientProxy,
  ) {}

  health() {
    return this.userClient.send({ cmd: 'users.health' }, {});
  }

  list(query: ListUsersQuery) {
    return this.userClient.send({ cmd: 'users.list' }, query);
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

  remove(userId: DeleteUserRequest) {
    return this.userClient.send({ cmd: 'users.delete' }, userId);
  }

  findByEmail(email: FindByEmailRequest) {
    return this.userClient.send({ cmd: 'users.find_by_email' }, email);
  }
}
