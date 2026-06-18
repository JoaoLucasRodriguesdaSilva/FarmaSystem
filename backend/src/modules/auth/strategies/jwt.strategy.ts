import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioAutenticado } from '../../../common/decorators/current-user.decorator';
import { PerfilUsuario } from '../../../common/enums/perfil-usuario.enum';
import { TokensRevogadosRepository } from '../tokens-revogados.repository';

/** Conteúdo do JWT de acesso. */
export interface JwtPayload {
  sub: number;
  email: string;
  perfil: PerfilUsuario;
}

/**
 * Valida o JWT do header Authorization e popula `req.user`. Além da assinatura,
 * rejeita tokens que tenham sido revogados (logout) consultando a blacklist.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly tokensRevogados: TokensRevogadosRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<UsuarioAutenticado> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && (await this.tokensRevogados.estaRevogado(token))) {
      throw new UnauthorizedException({
        codigo: 'TOKEN_REVOGADO',
        message: 'Sessão encerrada. Faça login novamente.',
      });
    }
    return { id: payload.sub, email: payload.email, perfil: payload.perfil };
  }
}
