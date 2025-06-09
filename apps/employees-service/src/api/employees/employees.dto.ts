import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsStrongPassword, MinLength } from 'class-validator';
import { IsString } from 'class-validator';
import { Employee } from 'libs/entities/employees/employee.entity';

export class LoginReqDto {
  @ApiProperty({ default: 'test@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'Password123!' })
  @IsString()
  password: string;
}

export class DataEmployeeDto {
  @ApiProperty()
  @IsString()
  user: Employee;

  @ApiProperty()
  @IsString()
  token: string;
}

export class LoginResponseDto {
  @ApiProperty()
  @IsString()
  data: DataEmployeeDto;

  @ApiProperty()
  @IsString()
  success: boolean;
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

export class RegisterDto {
  @ApiProperty({ default: 'test@gmail.com' })
  @IsEmail()
  public readonly email: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  public readonly role_id: number;

  @ApiProperty({ default: 'User123' })
  @IsString()
  public readonly name: string;

  @ApiProperty({ default: 'Password123!' })
  @IsString()
  @MinLength(8)
  @IsStrongPassword()
  public readonly password: string;
}

export class requestResetPasswordDto {
  @ApiProperty({ default: 'test@gmail.com' })
  @IsEmail()
  public readonly email: string;
}

export class EmailResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the email was sent successfully.',
  })
  @IsString()
  public readonly success: boolean;

  @ApiProperty({
    example: 'Email sent successfully.',
    description: 'Optional message for additional context.',
  })
  @IsString()
  public readonly message: string;
}
