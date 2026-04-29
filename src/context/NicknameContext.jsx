import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS, getStoredString, setStoredString } from '../lib/storage';

const NicknameContext = createContext(null);

export function NicknameProvider({ children }) {
  const [nickname, setNicknameState] = useState('');

  useEffect(() => {
    try {
      const saved = getStoredString(STORAGE_KEYS.nickname);
      if (saved) setNicknameState(saved);
    } catch {}
  }, []);

  function setNickname(name) {
    setNicknameState(name);
    try { setStoredString(STORAGE_KEYS.nickname, name); } catch {}
  }

  return (
    <NicknameContext.Provider value={{ nickname, setNickname }}>
      {children}
    </NicknameContext.Provider>
  );
}

export function useNickname() {
  return useContext(NicknameContext);
}
