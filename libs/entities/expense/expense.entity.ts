import {  Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('expense')
class Expense {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  public expense_name: string;

  @Column({ type: 'int', nullable: false })
  public expense_amount: number;

  @Column({ type: 'date', nullable: false })
  public expense_date: Date;
  
  @Column({ type: 'int', nullable: false })
  public created_by: number;

  @CreateDateColumn()
  public created_at: Date;

  @UpdateDateColumn()
  public updated_at: Date;

  @DeleteDateColumn()   
  public deleted_at: Date;
}

export { Expense };