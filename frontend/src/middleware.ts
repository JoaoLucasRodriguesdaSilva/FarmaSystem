import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proteção de rotas no nível do Next.js. Complementa o bloqueio primário da API
 * (RolesGuard). A presença do token é verificada via cookie; rotas públicas
 * (login, recuperação de senha) são liberadas.
 *
 * Observação: o controle fino por perfil (administrador/farmacêutico/atendente)
 * é aplicado nas páginas/componentes a partir do perfil do usuário autenticado.
 */
const PUBLIC_ROUTES = ['/login', '/recuperar-senha'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('farmasystem.accessToken')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica a todas as rotas, exceto assets estáticos e a própria API do Next.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
