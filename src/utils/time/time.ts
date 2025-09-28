/**
 * 时间处理工具类
 */
export class TimeUtil {
  /**
   * 获取当前时间戳（秒）
   */
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 获取当前时间戳（毫秒）
   */
  static getCurrentTimestampMs(): number {
    return Date.now();
  }

  /**
   * 获取当前 UTC 时间
   */
  static getCurrentUTC(): Date {
    return new Date();
  }

  /**
   * 获取指定时区的当前时间
   * @param timezone 时区，如 'Asia/Shanghai'
   */
  static getCurrentTimeInTimezone(timezone: string): Date {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const targetTime = new Date(utc + this.getTimezoneOffset(timezone) * 60000);
    return targetTime;
  }

  /**
   * 获取时区偏移量（分钟）
   * @param timezone 时区
   */
  static getTimezoneOffset(timezone: string): number {
    const date = new Date();
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const targetDate = new Date(utc + this.getTimezoneOffset(timezone) * 60000);
    return targetDate.getTimezoneOffset();
  }

  /**
   * UTC 时间转换为指定时区时间
   * @param utcDate UTC 时间
   * @param timezone 目标时区
   */
  static convertUTCToTimezone(utcDate: Date, timezone: string): Date {
    const utc = utcDate.getTime() + utcDate.getTimezoneOffset() * 60000;
    return new Date(utc + this.getTimezoneOffset(timezone) * 60000);
  }

  /**
   * 指定时区时间转换为 UTC 时间
   * @param localDate 本地时间
   * @param timezone 源时区
   */
  static convertTimezoneToUTC(localDate: Date, timezone: string): Date {
    const offset = this.getTimezoneOffset(timezone);
    return new Date(localDate.getTime() - offset * 60000);
  }

  /**
   * 格式化时间为字符串
   * @param date 时间对象
   * @param format 格式字符串
   * @param timezone 时区（可选）
   */
  static formatDate(
    date: Date,
    format: string = "YYYY-MM-DD HH:mm:ss",
    timezone?: string
  ): string {
    let targetDate = date;
    if (timezone) {
      targetDate = this.convertUTCToTimezone(date, timezone);
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const hours = String(targetDate.getHours()).padStart(2, "0");
    const minutes = String(targetDate.getMinutes()).padStart(2, "0");
    const seconds = String(targetDate.getSeconds()).padStart(2, "0");
    const milliseconds = String(targetDate.getMilliseconds()).padStart(3, "0");

    return format
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds)
      .replace("SSS", milliseconds);
  }

  /**
   * 解析时间字符串为 Date 对象
   * @param dateString 时间字符串
   * @param format 格式字符串
   */
  static parseDate(
    dateString: string,
    format: string = "YYYY-MM-DD HH:mm:ss"
  ): Date {
    // 预定义的格式模式
    const formatPatterns: { [key: string]: RegExp } = {
      "YYYY-MM-DD HH:mm:ss": /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
      "YYYY-MM-DD": /(\d{4})-(\d{2})-(\d{2})/,
      "MM/DD/YYYY": /(\d{2})\/(\d{2})\/(\d{4})/,
      "DD/MM/YYYY": /(\d{2})\/(\d{2})\/(\d{4})/,
      "YYYY/MM/DD": /(\d{4})\/(\d{2})\/(\d{2})/,
      YYYYMMDD: /(\d{4})(\d{2})(\d{2})/,
      "YYYY-MM-DDTHH:mm:ss": /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
      "YYYY-MM-DDTHH:mm:ss.SSS":
        /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
    };

    const pattern = formatPatterns[format];
    if (!pattern) throw new Error(`Unsupported format: ${format}`);

    const match = dateString.match(pattern);
    if (!match || Array.isArray(match))
      throw new Error(
        `Invalid date format: ${dateString}, expected format: ${format}`
      );

    // 根据格式解析日期
    const parseDate = (
      year: number,
      month: number,
      day: number,
      hours = 0,
      minutes = 0,
      seconds = 0,
      milliseconds = 0
    ) => {
      return new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        seconds,
        milliseconds
      );
    };

    switch (format) {
      case "YYYY-MM-DD HH:mm:ss":
        return parseDate(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3]),
          parseInt(match[4]),
          parseInt(match[5]),
          parseInt(match[6])
        );

      case "YYYY-MM-DD":
        return parseDate(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3])
        );

      case "MM/DD/YYYY":
        return parseDate(
          parseInt(match[3]),
          parseInt(match[1]),
          parseInt(match[2])
        );

      case "DD/MM/YYYY":
        return parseDate(
          parseInt(match[3]),
          parseInt(match[2]),
          parseInt(match[1])
        );

      case "YYYY/MM/DD":
        return parseDate(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3])
        );

      case "YYYYMMDD":
        return parseDate(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3])
        );

      case "YYYY-MM-DDTHH:mm:ss":
        return parseDate(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3]),
          parseInt(match[4]),
          parseInt(match[5]),
          parseInt(match[6])
        );

      case "YYYY-MM-DDTHH:mm:ss.SSS":
        return parseDate(
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3]),
          parseInt(match[4]),
          parseInt(match[5]),
          parseInt(match[6]),
          parseInt(match[7])
        );

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * 计算两个时间之间的差值
   * @param startDate 开始时间
   * @param endDate 结束时间
   * @param unit 单位：'seconds', 'minutes', 'hours', 'days'
   */
  static getTimeDifference(
    startDate: Date,
    endDate: Date,
    unit: "seconds" | "minutes" | "hours" | "days" = "seconds"
  ): number {
    const diffMs = endDate.getTime() - startDate.getTime();

    switch (unit) {
      case "seconds":
        return Math.floor(diffMs / 1000);
      case "minutes":
        return Math.floor(diffMs / (1000 * 60));
      case "hours":
        return Math.floor(diffMs / (1000 * 60 * 60));
      case "days":
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      default:
        return diffMs;
    }
  }

  /**
   * 添加时间
   * @param date 原始时间
   * @param amount 数量
   * @param unit 单位：'seconds', 'minutes', 'hours', 'days', 'months', 'years'
   */
  static addTime(
    date: Date,
    amount: number,
    unit: "seconds" | "minutes" | "hours" | "days" | "months" | "years"
  ): Date {
    const result = new Date(date);

    switch (unit) {
      case "seconds":
        result.setSeconds(result.getSeconds() + amount);
        break;
      case "minutes":
        result.setMinutes(result.getMinutes() + amount);
        break;
      case "hours":
        result.setHours(result.getHours() + amount);
        break;
      case "days":
        result.setDate(result.getDate() + amount);
        break;
      case "months":
        result.setMonth(result.getMonth() + amount);
        break;
      case "years":
        result.setFullYear(result.getFullYear() + amount);
        break;
    }

    return result;
  }

  /**
   * 减去时间
   * @param date 原始时间
   * @param amount 数量
   * @param unit 单位：'seconds', 'minutes', 'hours', 'days', 'months', 'years'
   */
  static subtractTime(
    date: Date,
    amount: number,
    unit: "seconds" | "minutes" | "hours" | "days" | "months" | "years"
  ): Date {
    return this.addTime(date, -amount, unit);
  }

  /**
   * 检查时间是否过期
   * @param date 要检查的时间
   * @param compareDate 比较时间（默认为当前时间）
   */
  static isExpired(date: Date, compareDate: Date = new Date()): boolean {
    return date.getTime() < compareDate.getTime();
  }

  /**
   * 检查时间是否在未来
   * @param date 要检查的时间
   * @param compareDate 比较时间（默认为当前时间）
   */
  static isFuture(date: Date, compareDate: Date = new Date()): boolean {
    return date.getTime() > compareDate.getTime();
  }

  /**
   * 获取时间范围
   * @param startDate 开始时间
   * @param endDate 结束时间
   * @param step 步长（毫秒）
   */
  static getTimeRange(
    startDate: Date,
    endDate: Date,
    step: number = 24 * 60 * 60 * 1000
  ): Date[] {
    const dates: Date[] = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current = new Date(current.getTime() + step);
    }

    return dates;
  }

  /**
   * 获取相对时间描述
   * @param date 时间
   * @param now 当前时间（可选）
   */
  static getRelativeTime(date: Date, now: Date = new Date()): string {
    const diffSeconds = this.getTimeDifference(date, now, "seconds");

    if (diffSeconds < 0) {
      // 未来时间
      const absDiff = Math.abs(diffSeconds);
      if (absDiff < 60) return `${absDiff}秒后`;
      if (absDiff < 3600) return `${Math.floor(absDiff / 60)}分钟后`;
      if (absDiff < 86400) return `${Math.floor(absDiff / 3600)}小时后`;
      if (absDiff < 2592000) return `${Math.floor(absDiff / 86400)}天后`;
      if (absDiff < 31536000) return `${Math.floor(absDiff / 2592000)}个月后`;
      return `${Math.floor(absDiff / 31536000)}年后`;
    } else {
      // 过去时间
      if (diffSeconds < 60) return `${diffSeconds}秒前`;
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}分钟前`;
      if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}小时前`;
      if (diffSeconds < 2592000)
        return `${Math.floor(diffSeconds / 86400)}天前`;
      if (diffSeconds < 31536000)
        return `${Math.floor(diffSeconds / 2592000)}个月前`;
      return `${Math.floor(diffSeconds / 31536000)}年前`;
    }
  }

  /**
   * 获取时间戳（秒）
   * @param date 时间对象
   */
  static getTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * 从时间戳创建 Date 对象
   * @param timestamp 时间戳（秒）
   */
  static fromTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * 获取一天的开始时间（00:00:00）
   * @param date 日期
   */
  static getStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * 获取一天的结束时间（23:59:59.999）
   * @param date 日期
   */
  static getEndOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * 获取一周的开始时间（周一 00:00:00）
   * @param date 日期
   */
  static getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * 获取一个月的开始时间（1号 00:00:00）
   * @param date 日期
   */
  static getStartOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * 获取一年的开始时间（1月1日 00:00:00）
   * @param date 日期
   */
  static getStartOfYear(date: Date): Date {
    const result = new Date(date);
    result.setMonth(0, 1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * 检查是否为同一天
   * @param date1 日期1
   * @param date2 日期2
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * 检查是否为同一周
   * @param date1 日期1
   * @param date2 日期2
   */
  static isSameWeek(date1: Date, date2: Date): boolean {
    const start1 = this.getStartOfWeek(date1);
    const start2 = this.getStartOfWeek(date2);
    return this.isSameDay(start1, start2);
  }

  /**
   * 检查是否为同一月
   * @param date1 日期1
   * @param date2 日期2
   */
  static isSameMonth(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
  }

  /**
   * 获取年龄
   * @param birthDate 出生日期
   * @param currentDate 当前日期（可选）
   */
  static getAge(birthDate: Date, currentDate: Date = new Date()): number {
    const age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }

    return age;
  }
}
