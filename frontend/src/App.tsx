import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Chat } from '@/components/Chat';
import { ActionSidebar } from '@/components/ActionSidebar';
import { SessionSidebar } from '@/components/SessionSidebar';

export default function App() {
  const { sessionId, messages, events, isLoading, error, sendMessage, stop, newSession, loadSession, refreshKey } = useChat();
  const [input, setInput] = useState('');

  const hasMessages = messages.length > 0 || isLoading;

  function handleSend() {
    const text = input.trim();
    if (!text || !sessionId || isLoading) return;
    sendMessage(text);
    setInput('');
  }

  function handleSelectSession(id: string) {
    setInput('');
    loadSession(id);
  }

  function handleNewSession() {
    setInput('');
    newSession();
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <SessionSidebar
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        refreshKey={refreshKey}
      />
      <Chat
        input={input}
        onInputChange={setInput}
        messages={messages}
        isLoading={isLoading}
        sessionId={sessionId}
        error={error}
        onSend={handleSend}
        onStop={stop}
      />
      {hasMessages && <ActionSidebar events={events} />}
    </div>
  );
}
