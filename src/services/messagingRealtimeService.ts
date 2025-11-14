import { supabase } from '@/lib/supabaseClient';
import { API_BASE_URL } from '@/lib/apiConfig';

// Define RealtimeChannel type inline to avoid import errors
type RealtimeChannel = any;

// Types
interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  content_type: string;
  created_at: string;
  updated_at: string;
}

interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  user_name: string;
  started_at: string;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  category?: string;
  tags?: string[];
  status: string;
  is_pinned: boolean;
  created_at: string;
  published_at?: string;
}

interface MessageDeliveryStatus {
  message_id: string;
  user_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  delivered_at?: string;
}

class MessagingRealtimeService {
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private authToken: string | null = null;

  // Set authentication token
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // Helper to get auth headers
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
    };
  }

  /**
   * Subscribe to new messages in a conversation
   */
  async subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ): Promise<RealtimeChannel> {
    const channelName = `conversation:${conversationId}:messages`;
    
    // Check if already subscribed
    if (this.activeChannels.has(channelName)) {
      return this.activeChannels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          console.log('[MessagingRealtime] New message received:', payload.new);
          onMessage(payload.new as Message);
        }
      )
      .subscribe();

    this.activeChannels.set(channelName, channel);
    console.log('[MessagingRealtime] Subscribed to messages:', channelName);

    return channel;
  }

  /**
   * Subscribe to typing indicators
   */
  async subscribeToTypingIndicators(
    conversationId: string,
    onTyping: (indicator: TypingIndicator) => void,
    onStopTyping: (userId: string) => void
  ): Promise<RealtimeChannel> {
    const channelName = `conversation:${conversationId}:typing`;
    
    if (this.activeChannels.has(channelName)) {
      return this.activeChannels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          console.log('[MessagingRealtime] User started typing:', payload.new);
          onTyping(payload.new as TypingIndicator);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          console.log('[MessagingRealtime] Typing updated:', payload.new);
          onTyping(payload.new as TypingIndicator);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          console.log('[MessagingRealtime] User stopped typing:', payload.old);
          onStopTyping(payload.old.user_id);
        }
      )
      .subscribe();

    this.activeChannels.set(channelName, channel);
    console.log('[MessagingRealtime] Subscribed to typing indicators:', channelName);

    return channel;
  }

  /**
   * Subscribe to message reactions
   */
  async subscribeToReactions(
    conversationId: string,
    onReactionAdded: (reaction: MessageReaction) => void,
    onReactionRemoved: (reaction: MessageReaction) => void
  ): Promise<RealtimeChannel> {
    const channelName = `conversation:${conversationId}:reactions`;
    
    if (this.activeChannels.has(channelName)) {
      return this.activeChannels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload: any) => {
          console.log('[MessagingRealtime] Reaction added:', payload.new);
          onReactionAdded(payload.new as MessageReaction);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions'
        },
        (payload: any) => {
          console.log('[MessagingRealtime] Reaction removed:', payload.old);
          onReactionRemoved(payload.old as MessageReaction);
        }
      )
      .subscribe();

    this.activeChannels.set(channelName, channel);
    console.log('[MessagingRealtime] Subscribed to reactions:', channelName);

    return channel;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
      console.log('[MessagingRealtime] Unsubscribed from:', channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    for (const [channelName, channel] of this.activeChannels) {
      await supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
      console.log('[MessagingRealtime] Unsubscribed from:', channelName);
    }
  }

  /**
   * Update typing indicator
   */
  async updateTypingIndicator(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/typing/${conversationId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to update typing indicator');
      }

      console.log('[MessagingRealtime] Typing indicator updated');
    } catch (error) {
      console.error('[MessagingRealtime] Error updating typing indicator:', error);
      throw error;
    }
  }

  /**
   * Stop typing indicator
   */
  async stopTypingIndicator(conversationId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/typing/${conversationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to stop typing indicator');
      }

      console.log('[MessagingRealtime] Typing indicator stopped');
    } catch (error) {
      console.error('[MessagingRealtime] Error stopping typing indicator:', error);
      throw error;
    }
  }

  /**
   * Track message delivery
   */
  async trackMessageDelivery(
    messageId: string,
    status: 'sent' | 'delivered' | 'failed' = 'delivered'
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}/delivery`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to track message delivery');
      }

      console.log('[MessagingRealtime] Message delivery tracked:', { messageId, status });
    } catch (error) {
      console.error('[MessagingRealtime] Error tracking message delivery:', error);
      throw error;
    }
  }

  /**
   * Get message delivery status
   */
  async getMessageDeliveryStatus(messageId: string): Promise<MessageDeliveryStatus[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}/delivery`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get message delivery status');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[MessagingRealtime] Error getting message delivery status:', error);
      throw error;
    }
  }

  /**
   * Add message reaction
   */
  async addMessageReaction(messageId: string, emoji: string): Promise<MessageReaction> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ emoji })
      });

      if (!response.ok) {
        throw new Error('Failed to add message reaction');
      }

      const data = await response.json();
      console.log('[MessagingRealtime] Reaction added:', data.data);
      return data.data;
    } catch (error) {
      console.error('[MessagingRealtime] Error adding message reaction:', error);
      throw error;
    }
  }

  /**
   * Remove message reaction
   */
  async removeMessageReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ emoji })
      });

      if (!response.ok) {
        throw new Error('Failed to remove message reaction');
      }

      console.log('[MessagingRealtime] Reaction removed');
    } catch (error) {
      console.error('[MessagingRealtime] Error removing message reaction:', error);
      throw error;
    }
  }

  /**
   * Get message reactions
   */
  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}/reactions`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get message reactions');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[MessagingRealtime] Error getting message reactions:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}/read`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      console.log('[MessagingRealtime] Message marked as read');
    } catch (error) {
      console.error('[MessagingRealtime] Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Get message read receipts
   */
  async getMessageReadReceipts(messageId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/messages/${messageId}/receipts`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to get message read receipts');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[MessagingRealtime] Error getting message read receipts:', error);
      throw error;
    }
  }

  /**
   * Create announcement (admin only)
   */
  async createAnnouncement(data: {
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
    category?: string;
    tags?: string[];
    scheduled_at?: string;
    expires_at?: string;
    is_pinned?: boolean;
  }): Promise<Announcement> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/announcements`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create announcement');
      }

      const result = await response.json();
      console.log('[MessagingRealtime] Announcement created:', result.data);
      return result.data;
    } catch (error) {
      console.error('[MessagingRealtime] Error creating announcement:', error);
      throw error;
    }
  }

  /**
   * Get announcements
   */
  async getAnnouncements(filters?: {
    status?: string;
    priority?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Announcement[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/v1/messaging/announcements?${params.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get announcements');
      }

      const result = await response.json();
      return {
        data: result.data || [],
        pagination: result.pagination
      };
    } catch (error) {
      console.error('[MessagingRealtime] Error getting announcements:', error);
      throw error;
    }
  }

  /**
   * Update announcement (admin only)
   */
  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/announcements/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }

      const result = await response.json();
      console.log('[MessagingRealtime] Announcement updated:', result.data);
      return result.data;
    } catch (error) {
      console.error('[MessagingRealtime] Error updating announcement:', error);
      throw error;
    }
  }

  /**
   * Delete announcement (admin only)
   */
  async deleteAnnouncement(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/messaging/announcements/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      console.log('[MessagingRealtime] Announcement deleted');
    } catch (error) {
      console.error('[MessagingRealtime] Error deleting announcement:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const messagingRealtimeService = new MessagingRealtimeService();
export default messagingRealtimeService;
