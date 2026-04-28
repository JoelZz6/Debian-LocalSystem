import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductList, AvailableProduct, SalesProduct, Fail } from './entities/product.entity';
import * as readline from 'readline';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private mode: 'VENTAS' | 'REGISTRO' = 'VENTAS';

  constructor(
    @InjectRepository(ProductList) private listRepo: Repository<ProductList>,
    @InjectRepository(AvailableProduct) private availableRepo: Repository<AvailableProduct>,
    @InjectRepository(SalesProduct) private salesRepo: Repository<SalesProduct>,
    @InjectRepository(Fail) private failsRepo: Repository<Fail>,
  ) {}

  async onModuleInit() {
    this.startTerminalListener();
    this.setupSystemSignals();
  }

  toggleMode(): string {
    this.mode = this.mode === 'VENTAS' ? 'REGISTRO' : 'VENTAS';
    const msg = `[CAMBIO] Modo actualizado a: ${this.mode}`;
    console.log(`\n${msg}\n`);
    return msg;
  }

  private setupSystemSignals() {
    process.on('SIGUSR1', () => {
      this.toggleMode();
    });
  }

  private startTerminalListener() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    console.log(`\n================================================`);
    console.log(`SISTEMA LISTO - MODO: ${this.mode}`);
    console.log(`- Escanea un código con el lector`);
    console.log(`- Cambia modo vía HTTP: http://localhost:3006/cambiar-modo`);
    console.log(`================================================\n`);

    rl.on('line', async (input) => {
      const data = input.trim();
      if (!data) return;

      if (data.toLowerCase() === 'm') {
        this.toggleMode();
      } else {
        await this.handleBarcode(data);
      }
    });
  }

  async handleBarcode(codigo: string) {
    try {
      if (this.mode === 'REGISTRO') {
        const productInList = await this.listRepo.findOneBy({ codigo });
        
        if (productInList) {
          let available = await this.availableRepo.findOneBy({ codigo });
          if (available) {
            available.stock += 1;
            // fecha_hora se actualiza automáticamente por onUpdate
          } else {
            available = this.availableRepo.create({ 
              codigo, 
              nombre: productInList.nombre,
              talla: productInList.talla,
              color: productInList.color,
              precio_compra: productInList.precio_compra,
              precio_venta: productInList.precio_venta,
              stock: 1,
              // fecha_hora default a CURRENT_TIMESTAMP
            });
          }
          await this.availableRepo.save(available);
          console.log(`[OK - REGISTRO] ${productInList.nombre} | Nuevo Stock: ${available.stock}`);
          return { status: 'OK', message: 'Registrado' };
        } else {
          const fail = this.failsRepo.create({ 
            codigo, 
            descripcion: 'Código no existe en product_list',
            // fecha_hora default
          });
          await this.failsRepo.save(fail);
          console.error(`[ERROR] Código ${codigo} no existe en PRODUCT_LIST`);
          return { status: 'ERROR', message: 'Código no existe' };
        }

      } else { // MODO VENTAS
        const available = await this.availableRepo.findOneBy({ codigo });
        
        if (available && available.stock > 0) {
          available.stock -= 1;
          await this.availableRepo.save(available);
          
          const sale = this.salesRepo.create({ 
            codigo, 
            nombre: available.nombre,
            talla: available.talla,
            color: available.color,
	    precio_compra: available.precio_compra,
            precio_venta: available.precio_venta,
            // fecha_hora default
          });
          await this.salesRepo.save(sale);
          
          console.log(`[OK - VENTA] ${available.nombre} | Restantes: ${available.stock}`);
          return { status: 'OK', message: 'Vendido' };
        } else {
          const fail = this.failsRepo.create({ 
            codigo, 
            descripcion: available ? 'Sin stock disponible' : 'Producto no registrado en available_products',
            // fecha_hora default
          });
          await this.failsRepo.save(fail);
          console.error(`[ERROR] Sin stock o producto no registrado: ${codigo}`);
          return { status: 'ERROR', message: 'Sin stock o no registrado' };
        }
      }
    } catch (error) {
      this.logger.error('Error procesando código', error);
      return { status: 'ERROR', message: 'Error interno' };
    }
  }
}
