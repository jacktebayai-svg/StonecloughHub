import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { supabaseAdmin } from '../supabase';

export class WebSocketService {
  private io: SocketIOServer | null = null;

  initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.APP_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (token) {
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
          if (!error && user) {
            (socket as any).user = user;
          }
        }
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next();
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join user-specific room for notifications
      const user = (socket as any).user;
      if (user) {
        socket.join(`user:${user.id}`);
        console.log(`User ${user.id} joined personal room`);
      }

      // Handle forum subscriptions
      socket.on('join-forum', (category?: string) => {
        if (category) {
          socket.join(`forum:${category}`);
        } else {
          socket.join('forum:all');
        }
        console.log(`Socket ${socket.id} joined forum: ${category || 'all'}`);
      });

      socket.on('leave-forum', (category?: string) => {
        if (category) {
          socket.leave(`forum:${category}`);
        } else {
          socket.leave('forum:all');
        }
        console.log(`Socket ${socket.id} left forum: ${category || 'all'}`);
      });

      // Handle discussion subscriptions
      socket.on('join-discussion', (discussionId: string) => {
        socket.join(`discussion:${discussionId}`);
        console.log(`Socket ${socket.id} joined discussion: ${discussionId}`);
      });

      socket.on('leave-discussion', (discussionId: string) => {
        socket.leave(`discussion:${discussionId}`);
        console.log(`Socket ${socket.id} left discussion: ${discussionId}`);
      });

      // Handle admin notifications
      socket.on('join-admin', () => {
        if (user?.role === 'admin') {
          socket.join('admin:notifications');
          console.log(`Admin ${user.id} joined admin notifications`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('WebSocket server initialized');
  }

  // Forum events
  notifyNewDiscussion(discussion: any) {
    if (!this.io) return;

    this.io.to('forum:all').emit('new-discussion', discussion);
    this.io.to(`forum:${discussion.category}`).emit('new-discussion', discussion);
    
    console.log(`New discussion notification sent: ${discussion.title}`);
  }

  notifyNewReply(reply: any, discussionId: string) {
    if (!this.io) return;

    this.io.to(`discussion:${discussionId}`).emit('new-reply', reply);
    
    console.log(`New reply notification sent for discussion: ${discussionId}`);
  }

  notifyDiscussionUpdate(discussionId: string, update: any) {
    if (!this.io) return;

    this.io.to(`discussion:${discussionId}`).emit('discussion-updated', update);
    
    console.log(`Discussion update sent: ${discussionId}`);
  }

  // User notifications
  notifyUser(userId: string, notification: {
    type: 'reply' | 'business_approved' | 'survey_invitation' | 'general';
    title: string;
    message: string;
    data?: any;
  }) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    
    console.log(`User notification sent to ${userId}: ${notification.title}`);
  }

  // Admin notifications
  notifyAdmins(notification: {
    type: 'new_business' | 'flagged_content' | 'system_alert';
    title: string;
    message: string;
    data?: any;
  }) {
    if (!this.io) return;

    this.io.to('admin:notifications').emit('admin-notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Admin notification sent: ${notification.title}`);
  }

  // Business updates
  notifyBusinessUpdate(businessId: string, update: any) {
    if (!this.io) return;

    this.io.emit('business-updated', {
      businessId,
      ...update,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Business update sent: ${businessId}`);
  }

  // Survey notifications
  notifySurveyUpdate(surveyId: string, update: any) {
    if (!this.io) return;

    this.io.emit('survey-updated', {
      surveyId,
      ...update,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Survey update sent: ${surveyId}`);
  }

  // Broadcast system announcements
  broadcastAnnouncement(announcement: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'maintenance';
  }) {
    if (!this.io) return;

    this.io.emit('system-announcement', {
      ...announcement,
      timestamp: new Date().toISOString()
    });
    
    console.log(`System announcement broadcasted: ${announcement.title}`);
  }

  // Get connection stats
  getStats() {
    if (!this.io) return { connected: 0 };

    return {
      connected: this.io.engine.clientsCount
    };
  }
}

export const webSocketService = new WebSocketService();
