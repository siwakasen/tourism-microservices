import { SetMetadata } from '@nestjs/common';

export enum UserType {
  OWNER = 'owner',
  ADMIN = 'admin',
  CUSTOMER = 'customers'
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);