import { useState, useEffect, useCallback } from 'react';
import { scopedStorage } from '@lark-apaas/client-toolkit-lite';

const TOKEN_KEY = '__agnes_demo_token';

function readToken(): string {
  try {
    return scopedStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeToken(token: string): void {
  scopedStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  scopedStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string {
  return readToken();
}

export function hasToken(): boolean {
  return readToken().trim().length > 0;
}

export function useAgnesToken() {
  const [token, setTokenState] = useState(readToken);

  const setToken = useCallback((value: string) => {
    writeToken(value);
    setTokenState(value);
    window.dispatchEvent(new Event('agnes-token-changed'));
  }, []);

  const clearToken = useCallback(() => {
    removeToken();
    setTokenState('');
    window.dispatchEvent(new Event('agnes-token-changed'));
  }, []);

  useEffect(() => {
    const handler = () => setTokenState(readToken());
    window.addEventListener('agnes-token-changed', handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener('agnes-token-changed', handler);
      window.removeEventListener('focus', handler);
    };
  }, []);

  return {
    token,
    hasToken: token.trim().length > 0,
    setToken,
    clearToken,
  };
}
