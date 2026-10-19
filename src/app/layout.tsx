import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/query-provider';
import { SWRegister } from '@/components/sw-register';
import './globals.css';

const vazirmatn = localFont({
  src: '../fonts/Vazirmatn-Variable.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-vazir',
});

export const metadata: Metadata = {
  title: 'هوش‌یار | همه هوش مصنوعی‌ها در یک جا',
  description:
    'هوش‌یار؛ دستیار هوشمند فارسی برای گفتگو با هوش مصنوعی‌های ایرانی و بین‌المللی، ساخت تصویر و شنیدن پاسخ‌ها. ساده، شاد و سریع.',
  applicationName: 'هوش‌یار',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'هوش‌یار',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
        <SWRegister />
      </body>
    </html>
  );
}
