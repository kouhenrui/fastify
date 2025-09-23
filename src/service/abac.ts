import ormManager from "../config/casbin/ormManager";

class AbacService {
  private ormManager = ormManager;
  constructor() {
    this.ormManager = ormManager;
  }

  /**
   * 检查权限
   * @param resource 资源
   * @param action 动作
   * @param account 账户
   * @param env 环境
   * @returns 是否允许
   */
  async checkPermission(
    resource: string,
    action: string,
    account: string,
    env?: string
  ) {
    const permission = await this.ormManager.checkPermission({
      sub: account,
      obj: resource,
      act: action,
      env: env || ""
    });
    return permission ? true : false;
  }
  /**
   * 获取权限
   * @param resource 资源
   * @param action 动作
   * @param account 账户
   * @param env 环境
   * @returns 权限
   */
  async getPermission(
    resource: string,
    action: string,
    account: string,
    env?: string,
    eft?: string
  ) {
    const permission = await this.ormManager.checkPermission({
      sub: account,
      obj: resource,
      act: action,
      ...(env ? { env } : {}),
      ...(eft ? { eft } : {})
    });
    return permission;
  }

  /**
   * 添加权限
   * @param resource 资源
   * @param action 动作
   * @param account 账户
   * @param env 环境
   * @returns 是否添加成功
   */
  async addPolicy(
    resource: string,
    action: string,
    account: string,
    env?: string,
    eft?: string
  ): Promise<boolean> {
    return await this.ormManager.addPolicy([
      resource,
      action,
      account,
      ...(env ? [env] : []),
      ...(eft ? [eft] : [])
    ]);
  }

  /**
   * 删除权限
   * @param resource 资源
   * @param action 动作
   * @param account 账户
   * @param env 环境
   * @returns 是否删除成功
   */
  async deletePolicy(
    resource: string,
    action: string,
    account: string,
    env?: string,
    eft?: string
  ): Promise<boolean> {
    return await this.ormManager.removePolicy([
      resource,
      action,
      account,
      ...(env ? [env] : []),
      ...(eft ? [eft] : [])
    ]);
  }
}

export default new AbacService();
