import './globals.css'
import type { Metadata } from 'next'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { TokenUsageProvider } from '@/contexts/TokenUsageContext'
import UserInitializer from '@/components/UserInitializer'
import { ClientOnly } from '@/components/ui/ClientOnly'

export const metadata: Metadata = {
  title: 'Test Case Writer Agent',
  description: 'Enterprise-grade Test Case Writer Agent for QA teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientOnly>
          <SettingsProvider>
            <TokenUsageProvider>
              <UserInitializer />
              {children}
            </TokenUsageProvider>
          </SettingsProvider>
        </ClientOnly>
      </body>
    </html>
  )
}