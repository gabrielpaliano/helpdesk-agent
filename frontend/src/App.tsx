import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatLayout } from '@/components/ChatLayout';
import { ActionSidebar } from '@/components/ActionSidebar';

export default function App() {
  const { sessionId, messages, events, isLoading, error, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleSend() {
    const text = input.trim();
    if (!text || !sessionId || isLoading) return;
    sendMessage(text);
    setInput('');
  }

  return (
    <>
      <ChatLayout
        input={input}
        onInputChange={setInput}
        messages={messages}
        isLoading={isLoading}
        sessionId={sessionId}
        error={error}
        eventCount={events.length}
        onSend={handleSend}
        onOpenSidebar={() => setSidebarOpen(true)}
      />
      <ActionSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        events={events}
      />
    </>
  );
}
