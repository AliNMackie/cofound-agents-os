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

import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/Sidebar";
import { BackendPrewarm } from "@/components/BackendPrewarm";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-brand-background text-brand-text-primary dark:bg-[#0a0a0a] transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Pre-warm the Sentinel backend on app load */}
          <BackendPrewarm />

          <div className="flex min-h-screen">
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-16 bg-white/80 backdrop-blur-md border-b border-brand-border flex items-center px-8 sticky top-0 z-40 justify-between dark:bg-black/80 dark:border-neutral-800">
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
                  <span className="text-brand-text-secondary dark:text-neutral-500">Platform</span>
                  <span className="text-brand-border dark:text-neutral-800">/</span>
                  <span className="dark:text-white">IC ORIGIN Intelligence</span>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-secondary hover:text-black transition-colors dark:text-neutral-500 dark:hover:text-white">UK Localisation (Active)</button>
                  <button className="bg-black text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest dark:bg-white dark:text-black hover:opacity-90 transition-opacity">Upgrade</button>
                </div>
              </header>
              <main className="p-8">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
