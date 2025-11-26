'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, MessageCircle, FileText } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const linkClass = (path: string) => {
    const base = 'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors';
    return pathname === path ? base + ' bg-white/20 font-semibold' : base + ' hover:bg-white/10';
  };

  return (
    <nav className="bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <BookOpen className="h-6 w-6" />
            학교자율시간 올인원
          </Link>

          <div className="flex items-center gap-1">
            <Link href="/" className={linkClass('/')}>
              <FileText className="h-4 w-4" />
              계획서 만들기
            </Link>
            <Link href="/chat" className={linkClass('/chat')}>
              <MessageCircle className="h-4 w-4" />
              질문하기
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
