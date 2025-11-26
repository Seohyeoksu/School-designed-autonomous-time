import { ChatInterface } from '@/components/chat-interface';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 py-8">
      <div className="container mx-auto px-4">
        <ChatInterface />
      </div>
    </main>
  );
}
