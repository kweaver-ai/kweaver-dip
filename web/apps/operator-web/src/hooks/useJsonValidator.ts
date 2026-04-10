import { useState, useEffect } from 'react';
import { validateJson } from '@/utils/validators';

/**
 * 校验 JSON 字符串合法性的 Hook
 * @param {string} value - 需要校验的 JSON 字符串
 * @returns {boolean} - 是否合法
 */
function useJsonValidator(value: any) {
  const [isValid, setIsValid] = useState(false);

  // 当 value 变化时自动校验
  useEffect(() => {
    setIsValid(validateJson(value));
  }, [value, validateJson]);

  return isValid;
}

export default useJsonValidator;
