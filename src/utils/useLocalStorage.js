import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // 1. 초기값 로드: 저장된 값이 있으면 가져오고, 없으면 초기값 사용
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 2. 값 변경 감지: 값이 변할 때마다 자동으로 저장
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  }, [key, value]);

  return [value, setValue];
}