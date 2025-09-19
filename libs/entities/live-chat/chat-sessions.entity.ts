// chat-sessions.entity.ts

import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum SessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export
@Entity('chat_sessions')
class ChatSessions extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'int', nullable: true })
  public customer_id!: number | null;

  @Column({ type: 'varchar', nullable: true })
  public guest_name!: string | null;

  @Column({ type: 'varchar', nullable: false })
  public status_session!: SessionStatus;

  @Column({ type: 'varchar', nullable: true })
  public session_key!: string | null;

  @CreateDateColumn()
  public created_at!: Date;

  @UpdateDateColumn()
  public updated_at!: Date;

  @DeleteDateColumn()
  public deleted_at!: Date;
}
