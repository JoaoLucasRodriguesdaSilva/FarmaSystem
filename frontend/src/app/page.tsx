import { redirect } from 'next/navigation';

export default function Home() {
  // O middleware garante o token; usuários autenticados vão direto ao painel.
  redirect('/dashboard');
}
