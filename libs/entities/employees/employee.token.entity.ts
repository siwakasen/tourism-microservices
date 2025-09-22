// employee.token.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('employee_tokens')
class EmployeeToken extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public employee_id!: number;

  @ApiProperty()
  @Column({ type: 'text' })
  token: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  used: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}

export { EmployeeToken };
