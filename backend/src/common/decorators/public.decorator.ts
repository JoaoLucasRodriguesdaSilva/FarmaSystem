import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca uma rota como pública, dispensando o `JwtAuthGuard` global.
 * Ex.: login, refresh e recuperação de senha.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
