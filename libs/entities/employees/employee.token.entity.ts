import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('employee_tokens')
class EmployeeToken extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @Column({ type: 'text' })
  token: string;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  used: boolean;

  @ApiProperty()
  @Column({ type: 'timestamp', default: new Date() })
  createdAt: Date;
}

export { EmployeeToken };
