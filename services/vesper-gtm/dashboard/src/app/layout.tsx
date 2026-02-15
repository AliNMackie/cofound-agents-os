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

import { Toaster } from 'sonner';

import { ThemeProvider } from "@/components/theme-provider";
import ClientLayout from "@/components/ClientLayout";

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
          <ClientLayout>
            {children}
          </ClientLayout>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
