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
import { SenderType } from 'libs/entities';
import { Roles } from '@app/helpers/auth/decorators/auth.decorator';
import { JwtAuthGuard } from '@app/helpers/auth/user/auth.guard';
import { UserType } from '@app/helpers/auth/decorators/auth.decorator';
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

  // Send message (client or employee)
  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: {
      chatSessionId: number;
      senderType: SenderType;
      senderId?: number;
      message: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    const msg = await this.chatService.saveMessage(data);
    this.server.to(`chat_${data.chatSessionId}`).emit('new_message', msg);
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
    client.emit('joined_session', data);
  }
}
