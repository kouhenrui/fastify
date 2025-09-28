export interface Address {
  code: string; // 唯一标识
  type: "home" | "work" | "other"; // 地址类型
  name: string; // 地址名称
  address: string; // 详细地址
  isDefault?: boolean; // 是否默认地址
  contactName?: string; // 联系人姓名
  contactPhone?: string; // 联系人电话
  coordinates?: {
    latitude: number;
    longitude: number;
  }; // 坐标信息
}
