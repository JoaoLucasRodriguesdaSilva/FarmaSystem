import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensRevogadosRepository } from './tokens-revogados.repository';

@Module({
  imports: [
    PassportModule,
    // Segredos/expiração são passados explicitamente por token (access x refresh)
    // no AuthService, então registramos o JwtModule sem opções globais.
    JwtModule.register({}),
    UsuariosModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokensRevogadosRepository],
  exports: [AuthService],
})
export class AuthModule {}
