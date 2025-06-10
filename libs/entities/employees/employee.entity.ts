import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../role/role.entity';
@Entity('employees')
class Employee extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;
 
  @ApiProperty()
  @Column({ type: 'text', nullable: false, default: '' })
  public name!: string;


  @ApiProperty()
  @ManyToOne(() => Role, (role) => role.id,{
    cascade: true,
    nullable: false,
  })
  @JoinColumn({ name: 'role_id' })
  public role: Role;
  
  @ApiProperty()
  @Column({ type: 'text', nullable: false, unique: true })
  public email: string;

  @ApiProperty()
  @Exclude()
  @Column({ type: 'text', nullable: false })
  public password: string;

  @ApiProperty()
  @Column({ type: 'int', nullable: false, default: 0 })
  public salary: number;


  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  public last_update_password: Date;

  @ApiProperty({
    description: 'The timestamp when the employee was created',
    example: '2024-11-18T12:00:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'The timestamp when the employee was last updated',
    example: '2024-11-19T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({
    description: 'The timestamp when the employee was soft-deleted',
    example: '2024-11-20T12:00:00.000Z',
    nullable: true,
  })
  @DeleteDateColumn()
  deleted_at: Date; 

}

export { Employee };
