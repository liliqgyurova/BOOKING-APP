// src/auth.ts
export type AuthResult = {
  user: { id: number; email: string; name?: string | null; picture?: string | null };
  tokens: { access_token: string; refresh_token: string; token_type: 'bearer' };
};

const BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (window as any).__API_BASE__ ||
  'http://127.0.0.1:8000';

// прочети стойност на cookie по име
function getCookie(name: string) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function openOAuthPopup(provider: 'google'): Promise<AuthResult> {
  const w = 500, h = 650;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;

  const popup = window.open(
    `${BASE}/auth/login/${provider}?redirect=1`,
    'oauth',
    `width=${w},height=${h},left=${left},top=${top}`
  );
  if (!popup) throw new Error('Popup blocked');

  return new Promise<AuthResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', onMsg);
      try { if (popup) popup.close(); } catch {}
      reject(new Error('OAuth timed out'));
    }, 120_000);

    const tick = setInterval(() => {
      if (popup.closed) {
        clearInterval(tick);
        clearTimeout(timeout);
        window.removeEventListener('message', onMsg);
        reject(new Error('Popup closed'));
      }
    }, 500);

    function onMsg(ev: MessageEvent) {
      const ok = ev?.data?.user?.email;
      if (!ok) return;
      clearInterval(tick);
      clearTimeout(timeout);
      window.removeEventListener('message', onMsg);
      try { if (popup) popup.close(); } catch {}
      resolve(ev.data as AuthResult);
    }

    window.addEventListener('message', onMsg);
  });
}

export async function fetchMe() {
  const res = await fetch(`${BASE}/auth/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Invalid session');
  return res.json();
}

export async function refreshSession() {
  const xsrf = getCookie('XSRF-TOKEN');
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: xsrf ? { 'X-XSRF-TOKEN': xsrf } : {},
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function logout() {
  const xsrf = getCookie('XSRF-TOKEN');
  const res = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: xsrf ? { 'X-XSRF-TOKEN': xsrf } : {},
  });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}
