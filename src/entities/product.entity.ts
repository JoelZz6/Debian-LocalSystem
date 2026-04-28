import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('product_list')
export class ProductList {
  @PrimaryColumn()
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  talla: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_compra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_venta: number;
}

@Entity('available_products')
export class AvailableProduct {
  @PrimaryColumn()
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  talla: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_compra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_venta: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  fecha_hora: Date;
}

@Entity('sales_products')
export class SalesProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  talla: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_compra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_venta: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_hora: Date;
}

@Entity('fails')
export class Fail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigo: string;          

  @Column()
  descripcion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_hora: Date;
}
