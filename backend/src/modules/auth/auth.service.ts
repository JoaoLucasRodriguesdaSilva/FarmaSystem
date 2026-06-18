import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PerfilUsuario } from '../../common/enums/perfil-usuario.enum';
import { UsuariosRepository } from '../usuarios/usuarios.repository';
import {
  LoginResponseDto,
  TokenPairDto,
} from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { TokensRevogadosRepository } from './tokens-revogados.repository';

interface RefreshPayload {
  sub: number;
  email: string;
  perfil: PerfilUsuario;
  tipo: 'refresh';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly tokensRevogados: TokensRevogadosRepository,
  ) {}

  async login(email: string, senha: string): Promise<LoginResponseDto> {
    const usuario = await this.usuarios.findByEmailComHash(email);
    const senhaConfere =
      usuario && (await bcrypt.compare(senha, usuario.senha_hash));

    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException({
        codigo: 'CREDENCIAIS_INVALIDAS',
        message: 'E-mail ou senha incorretos.',
      });
    }

    if (usuario.status === 'inativo') {
      throw new UnauthorizedException({
        codigo: 'USUARIO_INATIVO',
        message: 'Usuário inativo. Contate o administrador.',
      });
    }

    const tokens = this.gerarTokens({
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
    });

    return {
      ...tokens,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        status: usuario.status,
        crf: usuario.crf ?? undefined,
        criadoEm: usuario.criado_em.toISOString(),
        atualizadoEm: usuario.atualizado_em.toISOString(),
      },
    };
  }

  async refresh(refreshToken: string): Promise<TokenPairDto> {
    let payload: RefreshPayload;
    try {
      payload = this.jwt.verify<RefreshPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        codigo: 'REFRESH_INVALIDO',
        message: 'Refresh token inválido ou expirado.',
      });
    }

    if (payload.tipo !== 'refresh') {
      throw new UnauthorizedException({
        codigo: 'REFRESH_INVALIDO',
        message: 'Token informado não é um refresh token.',
      });
    }

    if (await this.tokensRevogados.estaRevogado(refreshToken)) {
      throw new UnauthorizedException({
        codigo: 'REFRESH_INVALIDO',
        message: 'Refresh token revogado.',
      });
    }

    return this.gerarTokens({
      sub: payload.sub,
      email: payload.email,
      perfil: payload.perfil,
    });
  }

  /** Revoga o(s) token(s) atuais inserindo-os na blacklist. */
  async logout(accessToken?: string, refreshToken?: string): Promise<void> {
    for (const token of [accessToken, refreshToken]) {
      if (!token) continue;
      const expiracao = this.expiracaoDe(token);
      if (expiracao) {
        await this.tokensRevogados.revogar(token, expiracao);
      }
    }
  }

  /** Mock de recuperação de senha (registra no log; e-mail não é enviado). */
  async recuperarSenha(email: string): Promise<void> {
    this.logger.log(
      `[MOCK] Solicitação de recuperação de senha para: ${email}`,
    );
  }

  private gerarTokens(payload: JwtPayload): TokenPairDto {
    const accessExpires = this.config.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );
    const refreshExpires = this.config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpires,
    } as JwtSignOptions);

    const refreshToken = this.jwt.sign(
      { ...payload, tipo: 'refresh' },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpires,
      } as JwtSignOptions,
    );

    const expiracao = this.expiracaoDe(accessToken);
    const expiresIn = expiracao
      ? Math.max(0, Math.floor((expiracao.getTime() - Date.now()) / 1000))
      : 0;

    return { accessToken, refreshToken, expiresIn };
  }

  /** Extrai a data de expiração (claim `exp`) de um JWT já assinado. */
  private expiracaoDe(token: string): Date | null {
    const decoded = this.jwt.decode<{ exp?: number }>(token);
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
  }
}
