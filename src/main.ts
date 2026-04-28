import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Agregamos '0.0.0.0' para asegurar que Docker mapee bien el puerto
  await app.listen(3006, '0.0.0.0'); 
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();