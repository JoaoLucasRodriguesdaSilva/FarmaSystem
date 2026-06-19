import { MainLayout } from '@/components/layout/MainLayout';

/** Layout das telas do atendente (PDV) — compartilha o painel principal. */
export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
