/**
 * 处理数字，超过10000显示9999+，否则正常显示
 */
export const formatNumber = (num: number) => {
  if (num > 10000) {
    return '9999+';
  }
  return num;
};
