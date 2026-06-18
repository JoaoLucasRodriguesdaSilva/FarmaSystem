import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ReduxProvider } from '@/redux/provider';

export const metadata: Metadata = {
  title: 'FarmaSystem',
  description: 'Sistema de Vendas para Farmácia',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
