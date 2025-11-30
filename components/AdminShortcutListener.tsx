'use client';

import { useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

export function AdminShortcutListener() {
  const { setIsAdmin } = useAdmin();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      const isCmdShiftA = e.shiftKey && key === 'a' && e.metaKey; // Cmd+Shift+A (Mac)
      const isCtrlShiftA = e.shiftKey && key === 'a' && e.ctrlKey; // Ctrl+Shift+A (Win/Linux)

      if (!isCmdShiftA && !isCtrlShiftA) return;

      // Always prompt for password (no check for isAdmin)
      const password = window.prompt('Enter admin password');
      if (!password) return;

      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Admin login failed');
            return;
          }
          setIsAdmin(true);
          alert('Admin mode enabled');
        })
        .catch(() => {
          alert('Network error during admin login');
        });
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setIsAdmin]);

  return null;
}

