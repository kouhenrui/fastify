import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from "typeorm";
import * as bcrypt from "bcrypt";
import { PostgresBaseModel } from ".";

@Entity("account")
@Index(["username"], { unique: true })
@Index(["email"], { unique: true })
export class PostgresAccount extends PostgresBaseModel {
  @Column({ type: "varchar", length: 50, unique: true,comment: "用户名" })
  username: string;

  @Column({ type: "varchar", length: 100, unique: true,comment: "邮箱" })
  email: string;

  @Column({ type: "varchar", length: 255,comment: "密码" })
  password: string;

  @Column({ type: "varchar", length: 500, nullable: true,comment: "头像" })
  avatar: string;

  @Column({ type: "string", nullable: true,comment: "角色" })
  role: string;

  @Column({ type: "string", nullable: true,comment: "访问令牌" })
  accessToken: string;

  @Column({ type: "timestamp", nullable: true,comment: "最后登录时间" })
  lastLoginAt: Date;

  // 密码加密钩子
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith("$2b$")) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // 验证密码方法
  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}

@Entity("role")
@Index(["name"], { unique: true })
export class PostgresRole extends PostgresBaseModel {
  @Column({ type: "varchar", length: 50, unique: true,comment: "角色名称" })
  name: string;

  @Column({ type: "varchar", length: 500, nullable: true,comment: "角色描述" })
  description: string;
}
