import type { Message } from '@/types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-semibold text-white shrink-0 mt-0.5">
          HS
        </div>
      )}
      <div
        className={`px-4 py-3 text-sm leading-relaxed max-w-[80%] ${
          isUser
            ? 'bg-neutral-800 text-white rounded-2xl rounded-br-sm'
            : 'bg-neutral-900 text-neutral-200 rounded-2xl rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
