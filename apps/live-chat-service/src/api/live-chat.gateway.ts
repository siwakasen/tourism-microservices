// live-chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveChatService } from './live-chat.service';
import { Employee, SenderType } from 'libs/entities';
import { Roles } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { UserType } from '@app/helpers/auth/decorators/auth.decorator';
import { GetEmployee } from '@app/helpers/auth/decorators/get-user.decorator';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class LiveChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: LiveChatService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    client.emit('disconnected', {
      message: 'Disconnected from the server',
      clientId: client.id,
    });
  }

  // Client (guest/customer) starts chat
  @SubscribeMessage('start_session')
  async startSession(
    @MessageBody()
    data: {
      customerId?: number;
      guestName?: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    if (!data.customerId && !data.guestName) {
      client.emit('session_error', {
        message: 'Customer ID or guest name is required',
      });
      return;
    }
    const session = await this.chatService.createSession(data);
    client.join(`chat_${session.id}`);
    client.emit('session_started', session);
  }

  @SubscribeMessage('rejoin_session')
  async rejoinSession(
    @MessageBody() data: { chatSessionId: number; sessionKey: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const session = await this.chatService.validateAndRejoinSession(
        data.sessionKey,
        data.chatSessionId
      );

      client.join(`chat_${session.id}`);
      client.emit('session_rejoined', {
        sessionId: session.id,
        customerId: session.customer_id,
        guestName: session.guest_name,
      });

      // Send chat history
      const messages = await this.chatService.getMessages(session.id);
      client.emit('messages', messages);
    } catch (error) {
      client.emit('session_error', {
        message: error.message || 'Failed to rejoin session',
      });
    }
  }

  // Send message (customer)
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: {
      chatSessionId: number;
      senderId?: number;
      message: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    const newData = {
      ...data,
      senderType: SenderType.CUS,
    };
    if (!client.rooms.has(`chat_${data.chatSessionId}`)) {
      client.emit('session_error', {
        message: 'You are not in this session',
      });
      return;
    }
    const msg = await this.chatService.saveMessage(newData);
    this.server.to(`chat_${data.chatSessionId}`).emit('new_message', msg);
  }

  @SubscribeMessage('end_session')
  async endSession(
    @MessageBody() data: { chatSessionId: number },
    @ConnectedSocket() client: Socket
  ) {
    if (!client.rooms.has(`chat_${data.chatSessionId}`)) {
      client.emit('session_error', {
        message: 'You are not in this session',
      });
      return;
    }
    client.leave(`chat_${data.chatSessionId}`);
    await this.chatService.closeSession(data.chatSessionId);
    client.emit('session_ended', {
      message: 'Session ended',
    });
  }

  // Employee joins a session
  @SubscribeMessage('join_session')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async joinSession(
    @MessageBody() data: { chatSessionId: number },
    @ConnectedSocket() client: Socket
  ) {
    client.join(`chat_${data.chatSessionId}`);
    const messages = await this.chatService.getMessages(data.chatSessionId);
    client.emit('messages', messages);
  }

  @SubscribeMessage('reply_message')
  @UseGuards(JwtAuthGuard)
  @Roles(UserType.ADMIN)
  async replyMessage(
    @MessageBody()
    data: { chatSessionId: number; message: string },
    @ConnectedSocket() client: Socket,
    @GetEmployee() employee: Employee
  ) {
    // Ensure admin has joined the session first
    if (!client.rooms.has(`chat_${data.chatSessionId}`)) {
      client.emit('session_error', {
        message: 'Please join the session first',
      });
      return;
    }

    const newData = {
      ...data,
      senderType: SenderType.EMP,
      senderId: employee.id, // Track which admin sent the message
    };
    const msg = await this.chatService.saveMessage(newData);
    this.server.to(`chat_${data.chatSessionId}`).emit('new_message', msg);
  }
}
