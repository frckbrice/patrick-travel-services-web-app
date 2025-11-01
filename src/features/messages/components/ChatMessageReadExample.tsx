// Example usage of chat message read status functionality
// This demonstrates how to use the new hooks in a chat component

import React from 'react';
import { useMarkMessageRead, useMarkMessagesRead } from '@/features/messages/api/mutations';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  firebaseId?: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  senderId: string;
  recipientId: string;
}

interface ChatMessageProps {
  message: Message;
  chatRoomId: string;
  currentUserId: string;
}

export function ChatMessage({ message, chatRoomId, currentUserId }: ChatMessageProps) {
  const markMessageRead = useMarkMessageRead();
  const markMessagesRead = useMarkMessagesRead();

  const handleMarkAsRead = () => {
    if (!message.isRead && message.recipientId === currentUserId) {
      markMessageRead.mutate({
        messageId: message.id,
        chatRoomId,
        firebaseId: message.firebaseId,
      });
    }
  };

  const handleMarkAllAsRead = (messageIds: string[]) => {
    markMessagesRead.mutate({
      messageIds,
      chatRoomId,
    });
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <p className="text-sm">{message.content}</p>
        <div className="flex items-center gap-2 mt-1">
          {message.isRead ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCheck className="h-4 w-4" />
              <span className="text-xs">Read</span>
              {message.readAt && (
                <span className="text-xs text-gray-500">
                  {new Date(message.readAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <Check className="h-4 w-4" />
              <span className="text-xs">Sent</span>
            </div>
          )}
        </div>
      </div>

      {!message.isRead && message.recipientId === currentUserId && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkAsRead}
          disabled={markMessageRead.isPending}
        >
          Mark as Read
        </Button>
      )}
    </div>
  );
}

// Example usage in a chat list
interface ChatListProps {
  messages: Message[];
  chatRoomId: string;
  currentUserId: string;
}

export function ChatList({ messages, chatRoomId, currentUserId }: ChatListProps) {
  const markMessagesRead = useMarkMessagesRead();

  const handleMarkAllAsRead = () => {
    const unreadMessageIds = messages
      .filter((msg) => !msg.isRead && msg.recipientId === currentUserId)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      markMessagesRead.mutate({
        messageIds: unreadMessageIds,
        chatRoomId,
      });
    }
  };

  const unreadCount = messages.filter(
    (msg) => !msg.isRead && msg.recipientId === currentUserId
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Messages</h3>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markMessagesRead.isPending}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            chatRoomId={chatRoomId}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
