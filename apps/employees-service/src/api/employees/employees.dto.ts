import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { IsString } from 'class-validator';
import { Employee } from 'libs/entities';

export class LoginReqDto {
  @ApiProperty({ default: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'Password12!@' })
  @IsString()
  password: string;
}

export class LoginResponseDto {
  @ApiProperty({
    default: {
      message: 'Login success',
      token: 'token',
    },
  })
  public readonly data: {
    message: string;
    token: string;
  };
}

export class DataEmployeeDto {
  @ApiProperty()
  @IsString()
  user: Employee;

  @ApiProperty()
  @IsString()
  token: string;
}

export class TokenDto {
  @ApiProperty()
  @IsString()
  public readonly token: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  public readonly token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @IsStrongPassword()
  public readonly password: string;
}

export class RegisterOwnerDto {
  @ApiProperty({ default: 'owner@example.com' })
  @IsEmail()
  public readonly email: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  public readonly role_id: number;

  @ApiProperty({ default: 'Owner' })
  @IsString()
  public readonly name: string;

  @ApiProperty({ default: 'Password123!' })
  @IsString()
  @MinLength(8)
  @IsStrongPassword()
  public readonly password: string;
}

export class RegisterOwnerResponseDto {
  @ApiProperty()
  @IsString()
  public readonly message: string;
}

export class requestResetPasswordDto {
  @ApiProperty({ default: 'test@gmail.com' })
  @IsEmail()
  public readonly email: string;
}

export class EmailResponseDto {
  @ApiProperty({
    example: 'Email sent successfully.',
    description: 'Optional message for additional context.',
  })
  @IsString()
  public readonly message: string;
}

export class PaginationEmployeeDto {
  @ApiProperty({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  public readonly page: number;

  @ApiProperty({ default: 10 })
  @IsNumber()
  @Type(() => Number)
  public readonly limit: number;

  @ApiProperty({ default: '', required: false })
  @IsString()
  @IsOptional()
  public readonly search: string;
}

export class PaginationEmployeeByRoleDto {
  @ApiProperty({ default: 1 })
  @IsNumber()
  @Type(() => Number)
  public readonly page: number;

  @ApiProperty({ default: 10 })
  @IsNumber()
  @Type(() => Number)
  public readonly limit: number;

  @ApiProperty({ default: 2 })
  @IsNumber()
  @Type(() => Number)
  public readonly role_id: number;
}

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  public readonly name: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  public readonly role_id: number;

  @ApiProperty()
  @IsEmail()
  public readonly email: string;

  @ApiProperty()
  @IsString()
  public readonly password: string;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  public readonly salary: number;
}
export class UpdateEmployeeDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  public readonly name: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public readonly role_id: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  public readonly salary: number;
}

export class AvailableEmployeesDto extends PaginationEmployeeDto {
  @ApiProperty({
    default: new Date(
      new Date().setDate(new Date().getDate() + 1),
    ).toISOString(),
  })
  @IsString()
  public readonly start_date: string;

  @ApiProperty({
    default: new Date(
      new Date().setDate(new Date().getDate() + 2),
    ).toISOString(),
  })
  @IsString()
  public readonly end_date: string;

  @ApiProperty({ default: 3 })
  @IsNumber()
  @Type(() => Number)
  public readonly role_id: number;
}
