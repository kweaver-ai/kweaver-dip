/**
 * 格式化数字
 * @param num 要格式化的数字
 * @param type 'en-us' | 'zh-cn'，默认为 'zh-cn'。'en-us'：3位一逗号；'zh-cn'：4位一逗号
 */
const formatNumber = (num: number | string, type: 'en-us' | 'zh-cn' | 'zh-tw' = 'zh-cn'): string => {
  if (num === null || num === undefined) return '';
  const str = num.toString();
  // 处理负号
  const isNegative = str.startsWith('-');
  const absoluteStr = isNegative ? str.slice(1) : str;

  const [integer, decimal] = absoluteStr.split('.');

  const step = type === 'zh-cn' ? 3 : 3;
  const reg = new RegExp(`\\B(?=(\\d{${step}})+(?!\\d))`, 'g');

  const formattedInteger = integer.replace(reg, ',');

  const result = decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
  return isNegative ? `-${result}` : result;
};

export default formatNumber;
