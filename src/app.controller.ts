import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('cambiar-modo')
  getToggle() {
    return this.appService.toggleMode();
  }

  @Post('escanear')
  async recibirEscaneo(@Body('codigo') codigo: string) {
    return await this.appService.handleBarcode(codigo);
  }
}
