import { forwardRef, Inject, Logger } from '@nestjs/common';
import {
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { Message } from '../../libs/enums/common.enum';
import { AuthMemberPayload } from '../../libs/types/auth';
import { MessageService } from '../message/message.service';

type SocketRoomPayload = {
	room: string;
};

type ConnectionReadyPayload = {
	socketId: string;
	memberId: string;
	totalClients: number;
};

type ConnectionInfoPayload = {
	totalClients: number;
};

type PongPayload = {
	memberId: string;
	timestamp: string;
};

type RoomStatusPayload = {
	room: string;
	memberId: string;
};

type ThreadSocketPayload = {
	threadId: string;
};

type ThreadJoinStatusPayload = {
	threadId: string;
	memberId: string;
	unreadCount: number;
};

@WebSocketGateway({
	cors: {
		origin: true,
		credentials: true,
	},
	transports: ['websocket'],
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	private readonly logger = new Logger(SocketGateway.name);
	private readonly memberSockets = new Map<string, Set<string>>();

	@WebSocketServer()
	server!: Server;

	constructor(
		private readonly authService: AuthService,
		@Inject(forwardRef(() => MessageService)) private readonly messageService: MessageService,
	) {}

	public afterInit(): void {
		this.logger.verbose(`Socket server initialized. Total clients [${this.getTotalClients()}]`);
	}

	public async handleConnection(client: Socket): Promise<void> {
		try {
			const authMember = await this.authenticateClient(client);
			this.setClientAuthMember(client, authMember);

			this.trackConnection(authMember._id, client.id);
			await client.join(this.getUserRoom(authMember._id));

			const payload: ConnectionReadyPayload = {
				socketId: client.id,
				memberId: authMember._id,
				totalClients: this.getTotalClients(),
			};

			this.logger.verbose(`Socket connected [${client.id}] member [${authMember._id}]`);
			client.emit('connection:ready', payload);
			this.server.emit('connection:count', { totalClients: this.getTotalClients() } satisfies ConnectionInfoPayload);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : Message.NOT_AUTHENTICATED;
			this.logger.warn(`Socket connection rejected [${client.id}] ${message}`);
			client.emit('connection:error', { message });
			client.disconnect(true);
		}
	}

	public handleDisconnect(client: Socket): void {
		const authMember = this.getStoredAuthMember(client);
		if (authMember?._id) {
			this.untrackConnection(authMember._id, client.id);
		}

		this.logger.verbose(`Socket disconnected [${client.id}] total [${this.getTotalClients()}]`);
		this.server.emit('connection:count', { totalClients: this.getTotalClients() } satisfies ConnectionInfoPayload);
	}

	@SubscribeMessage('ping')
	public handlePing(client: Socket): void {
		const authMember = this.getClientAuthMember(client);
		const payload: PongPayload = {
			memberId: authMember._id,
			timestamp: new Date().toISOString(),
		};

		client.emit('pong', payload);
	}

	@SubscribeMessage('room:join')
	public async handleJoinRoom(client: Socket, @MessageBody() payload: SocketRoomPayload): Promise<void> {
		const authMember = this.getClientAuthMember(client);
		if (!payload?.room?.trim()) return;

		await client.join(payload.room);
		client.emit('room:joined', {
			room: payload.room,
			memberId: authMember._id,
		} satisfies RoomStatusPayload);
	}

	@SubscribeMessage('room:leave')
	public async handleLeaveRoom(client: Socket, @MessageBody() payload: SocketRoomPayload): Promise<void> {
		const authMember = this.getClientAuthMember(client);
		if (!payload?.room?.trim()) return;

		await client.leave(payload.room);
		client.emit('room:left', {
			room: payload.room,
			memberId: authMember._id,
		} satisfies RoomStatusPayload);
	}

	@SubscribeMessage('thread:join')
	public async handleJoinThread(client: Socket, @MessageBody() payload: ThreadSocketPayload): Promise<void> {
		const authMember = this.getClientAuthMember(client);
		if (!payload?.threadId?.trim()) return;

		try {
			const threadId = payload.threadId.trim();
			await client.join(this.getThreadRoom(threadId));
			const readReceipt = await this.messageService.markThreadAsRead(authMember._id, threadId);

			client.emit('thread:joined', {
				threadId,
				memberId: authMember._id,
				unreadCount: readReceipt.unreadCount,
			} satisfies ThreadJoinStatusPayload);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : Message.SOMETHING_WENT_WRONG;
			client.emit('thread:error', { message });
		}
	}

	@SubscribeMessage('thread:leave')
	public async handleLeaveThread(client: Socket, @MessageBody() payload: ThreadSocketPayload): Promise<void> {
		const authMember = this.getClientAuthMember(client);
		if (!payload?.threadId?.trim()) return;

		const threadId = payload.threadId.trim();
		await client.leave(this.getThreadRoom(threadId));
		client.emit('thread:left', {
			threadId,
			memberId: authMember._id,
			unreadCount: 0,
		} satisfies ThreadJoinStatusPayload);
	}

	public emitToUser(memberId: string, event: string, payload: unknown): void {
		this.server.to(this.getUserRoom(memberId)).emit(event, payload);
	}

	public emitToRoom(room: string, event: string, payload: unknown): void {
		this.server.to(room).emit(event, payload);
	}

	private async authenticateClient(client: Socket): Promise<AuthMemberPayload> {
		const token = this.extractAccessToken(client);
		const payload = await this.authService.verifyAccessToken(token);

		return {
			_id: payload.sub,
			memberType: payload.memberType,
			memberStatus: payload.memberStatus,
			memberAuthType: payload.memberAuthType,
		};
	}

	private extractAccessToken(client: Socket): string {
		const authToken = this.getHandshakeToken(client);
		if (typeof authToken === 'string' && authToken.trim()) {
			return this.normalizeToken(authToken);
		}

		const authorizationHeader = client.handshake.headers.authorization;
		if (typeof authorizationHeader === 'string' && authorizationHeader.trim()) {
			return this.normalizeToken(authorizationHeader);
		}

		throw new Error(Message.TOKEN_NOT_EXIST);
	}

	private normalizeToken(value: string): string {
		const trimmed = value.trim();
		if (!trimmed) {
			throw new Error(Message.TOKEN_NOT_EXIST);
		}

		if (!trimmed.startsWith('Bearer ')) {
			return trimmed;
		}

		const [, token] = trimmed.split(/\s+/);
		if (!token) {
			throw new Error(Message.TOKEN_NOT_EXIST);
		}

		return token;
	}

	private getUserRoom(memberId: string): string {
		return `user:${memberId}`;
	}

	private getThreadRoom(threadId: string): string {
		return `thread:${threadId}`;
	}

	private getClientAuthMember(client: Socket): AuthMemberPayload {
		const authMember = this.getStoredAuthMember(client);
		if (!authMember?._id) {
			throw new Error(Message.NOT_AUTHENTICATED);
		}

		return authMember;
	}

	private trackConnection(memberId: string, socketId: string): void {
		const existingSocketIds = this.memberSockets.get(memberId) ?? new Set<string>();
		existingSocketIds.add(socketId);
		this.memberSockets.set(memberId, existingSocketIds);
	}

	private untrackConnection(memberId: string, socketId: string): void {
		const existingSocketIds = this.memberSockets.get(memberId);
		if (!existingSocketIds) return;

		existingSocketIds.delete(socketId);
		if (existingSocketIds.size === 0) {
			this.memberSockets.delete(memberId);
			return;
		}

		this.memberSockets.set(memberId, existingSocketIds);
	}

	private getTotalClients(): number {
		return this.server?.engine?.clientsCount ?? 0;
	}

	private setClientAuthMember(client: Socket, authMember: AuthMemberPayload): void {
		const socketData = client.data as { authMember?: AuthMemberPayload };
		socketData.authMember = authMember;
	}

	private getStoredAuthMember(client: Socket): AuthMemberPayload | undefined {
		const socketData = client.data as { authMember?: AuthMemberPayload };
		return socketData.authMember;
	}

	private getHandshakeToken(client: Socket): string | undefined {
		const authPayload = client.handshake.auth as { token?: unknown } | undefined;
		return typeof authPayload?.token === 'string' ? authPayload.token : undefined;
	}
}
