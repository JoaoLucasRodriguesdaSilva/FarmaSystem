import { configureStore } from '@reduxjs/toolkit';

// Slices de domínio (auth, sessão, permissões, carrinho) serão adicionados aqui.
export const makeStore = () =>
  configureStore({
    reducer: {},
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
