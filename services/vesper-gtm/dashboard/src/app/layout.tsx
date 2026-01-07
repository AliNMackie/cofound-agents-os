import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vesper Dashboard',
  description: 'Antigravity - Human in the Loop',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-lexi-background text-lexi-text-primary`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-lexi-border flex flex-col sticky top-0 h-screen">
            <div className="p-6 border-b border-lexi-border">
              <span className="text-xl font-bold tracking-tighter uppercase">Lexidesk</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <a href="/" className="block px-4 py-2 text-sm font-medium hover:bg-lexi-background rounded-lg transition-colors">Dashboard</a>
              <a href="/mission/newsroom" className="block px-4 py-2 text-sm font-medium hover:bg-lexi-background rounded-lg transition-colors">Newsroom</a>
              <a href="/missions" className="block px-4 py-2 text-sm font-medium hover:bg-lexi-background rounded-lg transition-colors text-lexi-text-secondary">Market Watch</a>
            </nav>
            <div className="p-4 border-t border-lexi-border">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">AM</div>
                <div className="text-xs">
                  <p className="font-semibold text-lexi-text-primary truncate">Alastair Mackie</p>
                  <p className="text-lexi-text-secondary truncate">ali@icorigin.com</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <header className="h-16 bg-white border-b border-lexi-border flex items-center px-8 sticky top-0 z-40 justify-between">
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-lexi-text-secondary">Platform</span>
                <span className="text-lexi-border">/</span>
                <span>Vesper Dashboard</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-xs font-semibold uppercase tracking-widest text-lexi-text-secondary hover:text-black transition-colors">Help</button>
                <button className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest">Upgrade</button>
              </div>
            </header>
            <main className="p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
