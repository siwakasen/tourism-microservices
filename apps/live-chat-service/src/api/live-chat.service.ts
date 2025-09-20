// live-chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
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

  onModuleInit() {
    this.handleUpdateExpiredSessions();
  }

  async createSession(data: { customerId?: number; guestName?: string }) {
    if (!data.customerId && !data.guestName) {
      throw new Error('Either customerId or guestName must be provided');
    }
    try {
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
    const isoDate = new Date();
    const gmtplus8 = new Date(isoDate.getTime() + 8 * 60 * 60 * 1000);
    const message = this.chatMessagesRepo.create({
      chat_session_id: data.chatSessionId,
      sender_type: data.senderType,
      sender_id: data.senderId ?? null,
      message: data.message,
      created_at: gmtplus8,
      updated_at: gmtplus8,
    });
    const session = await this.chatSessionsRepo.findOne({
      where: { id: data.chatSessionId },
    });
    session.updated_at = gmtplus8;
    return this.chatMessagesRepo.save(message);
  }

  async getMessages(chatSessionId: number) {
    return this.chatMessagesRepo.find({
      where: { chat_session_id: chatSessionId },
      order: { created_at: 'ASC' },
    });
  }

  async closeSession(chatSessionId: number) {
    const isoDate = new Date();
    const gmtplus8 = new Date(isoDate.getTime() + 8 * 60 * 60 * 1000);
    await this.chatSessionsRepo.update(chatSessionId, {
      status_session: SessionStatus.CLOSED,
      updated_at: gmtplus8,
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

  async getSessionById(chatSessionId: number) {
    return this.chatSessionsRepo.findOne({
      where: { id: chatSessionId },
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

  async getAllSessions() {
    return this.chatSessionsRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  @Cron('0 0 0  * * *', {
    name: 'update-expired-sessions',
    timeZone: 'Asia/Singapore',
  })
  async handleUpdateExpiredSessions() {
    try {
      const isoDate = new Date();
      const gmtplus8 = new Date(isoDate.getTime() + 8 * 60 * 60 * 1000);
      const yesterday = new Date(gmtplus8.getTime() - 24 * 60 * 60 * 1000);
      const expiredSessions = await this.chatSessionsRepo.find({
        where: {
          status_session: SessionStatus.OPEN,
          updated_at: LessThanOrEqual(yesterday),
        },
      });

      if (expiredSessions.length > 0) {
        console.log(
          `Found ${expiredSessions.length} expired sessions to close`
        );

        await this.chatSessionsRepo.update(
          expiredSessions.map((session) => session.id),
          {
            status_session: SessionStatus.CLOSED,
            updated_at: new Date(),
          }
        );

        console.log(
          `Successfully closed ${expiredSessions.length} expired sessions`
        );
      } else {
        console.log('No expired sessions found');
      }
    } catch (error) {
      console.error('Error updating expired sessions:', error);
    }
  }
}
