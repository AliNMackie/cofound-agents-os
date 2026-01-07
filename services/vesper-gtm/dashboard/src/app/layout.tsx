import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  preload: false,
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'IC ORIGIN | Intelligence',
  description: 'Antigravity - Human in the Loop',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-brand-background text-brand-text-primary`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-brand-border flex flex-col sticky top-0 h-screen">
            <div className="p-6 border-b border-brand-border">
              <span className="text-xl font-bold tracking-tighter uppercase">IC ORIGIN</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <a href="/" className="block px-4 py-2 text-sm font-medium hover:bg-brand-background rounded-lg transition-colors">Dashboard</a>
              <a href="/mission/newsroom" className="block px-4 py-2 text-sm font-medium hover:bg-brand-background rounded-lg transition-colors">Newsroom</a>
              <a href="/missions" className="block px-4 py-2 text-sm font-medium hover:bg-brand-background rounded-lg transition-colors text-brand-text-secondary">Market Watch</a>
            </nav>
            <div className="p-4 border-t border-brand-border">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">AM</div>
                <div className="text-xs">
                  <p className="font-semibold text-brand-text-primary truncate">Alastair Mackie</p>
                  <p className="text-brand-text-secondary truncate">ali@icorigin.com</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <header className="h-16 bg-white border-b border-brand-border flex items-center px-8 sticky top-0 z-40 justify-between">
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="text-brand-text-secondary">Platform</span>
                <span className="text-brand-border">/</span>
                <span>IC ORIGIN Intelligence</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-xs font-semibold uppercase tracking-widest text-brand-text-secondary hover:text-black transition-colors">Help</button>
                <button className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white">Upgrade</button>
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
