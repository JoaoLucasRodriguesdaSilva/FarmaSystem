import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

// Slices de domínio (sessão, permissões, carrinho) serão adicionados aqui.
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
