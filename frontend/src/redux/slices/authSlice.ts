import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services/auth.service';
import type { PerfilUsuario, Usuario } from '@/types';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  usuario: Usuario | null;
  status: AuthStatus;
  erro: string | null;
}

const initialState: AuthState = {
  usuario: null,
  status: 'idle',
  erro: null,
};

/** Autentica o usuário e persiste os tokens. */
export const login = createAsyncThunk(
  'auth/login',
  async (
    credenciais: { email: string; senha: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await authService.login(
        credenciais.email,
        credenciais.senha,
      );
      return data.usuario;
    } catch (err) {
      const mensagem =
        (err as { response?: { data?: { mensagem?: string } } }).response?.data
          ?.mensagem ?? 'Não foi possível entrar. Verifique suas credenciais.';
      return rejectWithValue(mensagem);
    }
  },
);

/** Recarrega o usuário autenticado a partir do token (ex.: refresh da página). */
export const carregarUsuarioAtual = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.me();
    } catch {
      return rejectWithValue(null);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    limparErro(state) {
      state.erro = null;
    },
    setUsuario(state, action: PayloadAction<Usuario>) {
      state.usuario = action.payload;
      state.status = 'authenticated';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.erro = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.usuario = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'error';
        state.erro = (action.payload as string) ?? 'Erro ao autenticar.';
      })
      .addCase(carregarUsuarioAtual.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.usuario = action.payload;
      })
      .addCase(carregarUsuarioAtual.rejected, (state) => {
        state.status = 'idle';
        state.usuario = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.usuario = null;
        state.erro = null;
      });
  },
});

export const { limparErro, setUsuario } = authSlice.actions;
export default authSlice.reducer;

/** Perfil do usuário autenticado (ou null). */
export const selectUserRole = (state: {
  auth: AuthState;
}): PerfilUsuario | null => state.auth.usuario?.perfil ?? null;
