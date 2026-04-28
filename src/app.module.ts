import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { AppController } from './app.controller'; // <--- IMPORTANTE: Importar el controlador
import { ProductList, AvailableProduct, SalesProduct, Fail } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'db',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'LectorPB',
      entities: [ProductList, AvailableProduct, SalesProduct, Fail],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([ProductList, AvailableProduct, SalesProduct, Fail]),
  ],
  controllers: [AppController], // <--- IMPORTANTE: Agregar el controlador aquí
  providers: [AppService],
})
export class AppModule {}
