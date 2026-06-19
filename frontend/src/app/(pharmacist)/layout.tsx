import { MainLayout } from '@/components/layout/MainLayout';

/** Layout das telas do farmacêutico/catálogo (compartilha o painel principal). */
export default function PharmacistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
