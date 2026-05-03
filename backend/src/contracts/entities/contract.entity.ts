import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ContractStatus } from '../../common/enums/contract-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ name: 'contract_number', unique: true })
  contractNumber: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ name: 'client_cin', type: 'varchar', nullable: true })
  clientCin?: string | null;

  @Column({ name: 'client_first_name', type: 'varchar', nullable: true })
  clientFirstName?: string | null;

  @Column({ name: 'client_last_name', type: 'varchar', nullable: true })
  clientLastName?: string | null;

  @Column({ name: 'client_email', type: 'varchar', nullable: true })
  clientEmail?: string | null;

  @Column({ name: 'client_phone', nullable: true })
  clientPhone?: string;

  @Column({ name: 'client_address', type: 'text', nullable: true })
  clientAddress?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.UNSIGNED,
  })
  status: ContractStatus;

  @Column({ name: 'signature_token', type: 'varchar', unique: true, nullable: true })
  signatureToken?: string | null;

  @Column({ name: 'signature_requested_at', type: 'timestamp', nullable: true })
  signatureRequestedAt?: Date | null;

  @Column({ name: 'signed_at', type: 'timestamp', nullable: true })
  signedAt?: Date | null;

  @Column({ name: 'signer_name', type: 'varchar', nullable: true })
  signerName?: string | null;

  @Column({ name: 'signature_data_url', type: 'text', nullable: true })
  signatureDataUrl?: string | null;

  @ManyToOne(() => User, { eager: true })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
