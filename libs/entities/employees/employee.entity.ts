import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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
  @Column({ type: 'text', nullable: false, default: '' })
  public email!: string;

  @ApiProperty()
  @Exclude()
  @Column({ type: 'text', nullable: false })
  public password: string;

  @ApiProperty()
  @Column({ type: 'int', nullable: false, default: 0 })
  public salary: number;


  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  public lastUpdatePassword: Date;
  
  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false, default: new Date() })
  public createdAt: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false, default: new Date() })
  public updatedAt: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false, default: new Date() })
  public deletedAt: Date;


}

export { Employee };
