import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";



@Entity('roles')
class Roles extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'text', nullable: false })
  public role_name: string;
}

export { Roles };