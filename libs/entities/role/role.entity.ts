import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";



@Entity()
class Role extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'text', nullable: false })
  public role_name: string;
}

export { Role };