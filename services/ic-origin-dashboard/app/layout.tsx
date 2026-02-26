import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    metadataBase: new URL('https://icorigin.netlify.app'),
    title: 'IC Origin | The AI Infrastructure for Market Defensibility',
    description: 'Defend, expand, and originate with precision. Institutional-grade market understanding processed at machine speed.',
    openGraph: {
        title: 'IC Origin',
        description: 'AI Infrastructure for Market Defensibility and Growth.',
        type: 'website',
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
