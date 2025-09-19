// chat-messages.entity.ts
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SenderType {
  CUS = 'CUS',
  EMP = 'EMP',
}

export
@Entity('chat_messages')
class ChatMessages extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'int', nullable: false })
  public chat_session_id!: number;

  @Column({ type: 'enum', enum: SenderType })
  sender_type: SenderType;

  @Column({ type: 'int', nullable: true })
  public sender_id!: number;

  @Column({ type: 'varchar', nullable: false })
  public message!: string;

  @CreateDateColumn()
  public created_at!: Date;

  @UpdateDateColumn()
  public updated_at!: Date;

  @DeleteDateColumn()
  public deleted_at?: Date;
}
