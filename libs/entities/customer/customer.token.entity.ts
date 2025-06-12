    import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('customer_tokens')
class CustomerToken extends BaseEntity {
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
  @CreateDateColumn()
  created_at: Date;
}   

export { CustomerToken };