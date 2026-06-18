import { MainLayout } from '@/components/layout/MainLayout';

/** Layout das telas autenticadas do painel. */
export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
