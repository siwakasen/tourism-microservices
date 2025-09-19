// live-chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessions, SenderType, SessionStatus } from 'libs/entities';
import { ChatMessages } from 'libs/entities';
import * as crypto from 'crypto';

@Injectable()
export class LiveChatService {
  constructor(
    @InjectRepository(ChatSessions)
    private readonly chatSessionsRepo: Repository<ChatSessions>,

    @InjectRepository(ChatMessages)
    private readonly chatMessagesRepo: Repository<ChatMessages>
  ) {}

  async createSession(data: { customerId?: number; guestName?: string }) {
    if (!data.customerId && !data.guestName) {
      throw new Error('Either customerId or guestName must be provided');
    }
    try {
      // Generate a unique session key for rejoining
      const sessionKey = crypto.randomBytes(32).toString('hex');

      const session = this.chatSessionsRepo.create({
        customer_id: data.customerId ?? null,
        guest_name: data.guestName ?? null,
        status_session: SessionStatus.OPEN,
        session_key: sessionKey,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return await this.chatSessionsRepo.save(session);
    } catch (error) {
      console.error('Error creating session: ', error);
      throw new Error('Failed to create session');
    }
  }

  async saveMessage(data: {
    chatSessionId: number;
    senderId?: number;
    senderType: SenderType;
    message: string;
  }) {
    const message = this.chatMessagesRepo.create({
      chat_session_id: data.chatSessionId,
      sender_type: data.senderType,
      sender_id: data.senderId ?? null,
      message: data.message,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.chatMessagesRepo.save(message);
  }

  async getMessages(chatSessionId: number) {
    return this.chatMessagesRepo.find({
      where: { chat_session_id: chatSessionId },
      order: { created_at: 'ASC' },
    });
  }

  async closeSession(chatSessionId: number) {
    await this.chatSessionsRepo.update(chatSessionId, {
      status_session: SessionStatus.CLOSED,
      updated_at: new Date(),
    });
    return this.chatSessionsRepo.findOne({
      where: { id: chatSessionId },
    });
  }

  async getSessionByKey(sessionKey: string) {
    return this.chatSessionsRepo.findOne({
      where: {
        session_key: sessionKey,
        status_session: SessionStatus.OPEN,
      },
    });
  }

  async validateAndRejoinSession(sessionKey: string, chatSessionId: number) {
    const session = await this.chatSessionsRepo.findOne({
      where: {
        id: chatSessionId,
        session_key: sessionKey,
        status_session: SessionStatus.OPEN,
      },
    });

    if (!session) {
      throw new Error('Invalid session or session has been closed');
    }

    return session;
  }
}
