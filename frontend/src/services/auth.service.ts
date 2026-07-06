import { api, tokenStorage } from './api';
import type { LoginResponse, Usuario } from '@/types';

const ACCESS_COOKIE = 'farmasystem.accessToken';

/**
 * O middleware do Next.js (server-side) só enxerga cookies, enquanto o Axios
 * usa o localStorage. Mantemos o accessToken espelhado em um cookie para que a
 * proteção de rotas funcione já na primeira navegação.
 */
function setAccessCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_COOKIE}=${token}; path=/; SameSite=Lax; max-age=604800`;
}

function clearAccessCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
}

export const authService = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email,
      senha,
    });
    tokenStorage.set(data.accessToken, data.refreshToken);
    setAccessCookie(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh();
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      tokenStorage.clear();
      clearAccessCookie();
      // Encerra a sessão do PDV: o histórico de vendas não deve vazar entre logins.
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('farmasystem.pdv.vendas');
      }
    }
  },

  async me(): Promise<Usuario> {
    const { data } = await api.get<Usuario>('/usuarios/me');
    return data;
  },

  async recuperarSenha(email: string): Promise<void> {
    await api.post('/auth/recuperar-senha', { email });
  },
};
