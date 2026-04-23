import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/api';

export default function ChatModal({ rideId, currentUserId, onClose }) {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat
  useEffect(() => {
    async function loadChat() {
      try {
        setLoading(true);
        const chatData = await apiRequest(`/chats/ride/${rideId}`);
        setChat(chatData);
        setMessages(chatData.messages || []);
      } catch (error) {
        console.error('Failed to load chat:', error);
      } finally {
        setLoading(false);
      }
    }

    if (rideId) {
      loadChat();
    }
  }, [rideId]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!chat?._id) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const updatedMessages = await apiRequest(`/chats/${chat._id}/messages`);
        setMessages(updatedMessages);
      } catch (error) {
        console.error('Failed to poll messages:', error);
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [chat?._id]);

  async function handleSendMessage(e) {
    e.preventDefault();
    
    if (!newMessage.trim() || !chat?._id || !currentUserId) return;

    setSending(true);
    try {
      const message = await apiRequest(`/chats/${chat._id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          senderId: currentUserId,
          content: newMessage.trim(),
          type: 'text'
        })
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h3>Loading chat...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        height: '80vh',
        maxHeight: '700px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Chat Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              💬
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Live Chat</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                {chat?.participants?.length || 0} participants
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.sender?._id === currentUserId || msg.sender === currentUserId;
              const isSystemMessage = msg.type === 'system';

              if (isSystemMessage) {
                return (
                  <div key={index} style={{
                    textAlign: 'center',
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {msg.content}
                  </div>
                );
              }

              return (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '0.5rem'
                }}>
                  {!isOwnMessage && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {msg.sender?.name?.[0] || '?'}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
                  }}>
                    {!isOwnMessage && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.25rem',
                        paddingLeft: '0.75rem'
                      }}>
                        {msg.sender?.name || 'Unknown'}
                      </span>
                    )}
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isOwnMessage 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'white',
                      color: isOwnMessage ? 'white' : 'var(--text)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      wordBreak: 'break-word'
                    }}>
                      {msg.content}
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.25rem',
                      paddingLeft: isOwnMessage ? 0 : '0.75rem',
                      paddingRight: isOwnMessage ? '0.75rem' : 0
                    }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {isOwnMessage && (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {msg.sender?.name?.[0] || 'Y'}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          background: 'white',
          borderRadius: '0 0 16px 16px'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              style={{
                padding: '0.75rem 1.5rem',
                background: newMessage.trim() && !sending 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : '#e5e7eb',
                color: newMessage.trim() && !sending ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '24px',
                cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                fontSize: '0.95rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              {sending ? 'Sending...' : '📤 Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
