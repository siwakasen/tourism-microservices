import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


class Expense extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  public expense_name: string;

  @Column({ type: 'int', nullable: false })
  public expense_amount: number;
  
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