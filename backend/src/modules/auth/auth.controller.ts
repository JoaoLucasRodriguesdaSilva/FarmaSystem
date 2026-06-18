import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  LoginResponseDto,
  TokenPairDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RecuperarSenhaDto } from './dto/recuperar-senha.dto';
import { RefreshDto } from './dto/refresh.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticar usuário e emitir tokens.' })
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto.email, dto.senha);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar o par de tokens a partir do refreshToken.' })
  @ApiOkResponse({ type: TokenPairDto })
  async refresh(@Body() dto: RefreshDto): Promise<TokenPairDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerrar sessão (revoga os tokens atuais).' })
  async logout(
    @Headers('authorization') authorization?: string,
    @Body() body?: { refreshToken?: string },
  ): Promise<void> {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '');
    await this.authService.logout(accessToken, body?.refreshToken);
  }

  @Public()
  @Post('recuperar-senha')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar recuperação de senha (mock).' })
  async recuperarSenha(@Body() dto: RecuperarSenhaDto): Promise<void> {
    await this.authService.recuperarSenha(dto.email);
  }
}
