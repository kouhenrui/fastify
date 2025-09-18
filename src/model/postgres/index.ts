import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { PostgresAccount } from "./account";

/**
 * 基础模型
 */
export class PostgresBaseModel {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "ID" })
  id: bigint;

  @Column({ type: "boolean", default: true, comment: "是否激活" })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamp", comment: "创建时间" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", comment: "更新时间" })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true, comment: "删除时间" })
  deletedAt?: Date;

  @Column({ type: "varchar", length: 50, nullable: true, comment: "删除者" })
  deletedBy?: string;
}

/**
 * 模型
 */
export const postgresModel = {
  account: PostgresAccount
};

/**
 * 导出模型
 */
export type { PostgresAccount };
