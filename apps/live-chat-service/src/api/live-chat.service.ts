// live-chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSessions, SenderType } from 'libs/entities';
import { ChatMessages } from 'libs/entities';

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
      const session = this.chatSessionsRepo.create({
        customer_id: data.customerId ?? null,
        guest_name: data.guestName ?? null,
        status_session: 'OPEN',
        created_at: new Date(),
        updated_at: new Date(),
      });
      return this.chatSessionsRepo.save(session);
    } catch (error) {
      console.error('Error creating session: ', error);
      throw new Error('Failed to create session');
    }
  }

  async saveMessage(data: {
    chatSessionId: number;
    senderType: SenderType;
    senderId?: number;
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
      status_session: 'CLOSED',
      updated_at: new Date(),
    });
    return this.chatSessionsRepo.findOne({
      where: { id: chatSessionId },
    });
  }
}
