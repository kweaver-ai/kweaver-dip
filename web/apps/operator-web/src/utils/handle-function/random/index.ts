/**
 * 生成指定长度的随机字符串
 * @param length 字符串长度，默认10位
 * @returns 指定长度的随机字符串
 */
export const generateRandomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charsLength = chars.length;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  return result;
};

/**
 * 生成指定长度的随机数字
 * @param length 数字长度，默认4位
 * @returns 指定长度的随机数字（第一位不为0）
 */
export const generateRandomNumber = (length: number = 4): number => {
  if (length <= 0) return 0;

  // 第一位从1-9中随机选择
  const firstChars = '123456789';
  let result = firstChars.charAt(Math.floor(Math.random() * firstChars.length));

  // 后续位从0-9中随机选择
  if (length > 1) {
    const chars = '0123456789';
    const charsLength = chars.length;
    for (let i = 1; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
  }

  return Number(result);
};

// 生成随机boolean
export const generateRandomBoolean = (): boolean => {
  return Math.random() < 0.5;
};
