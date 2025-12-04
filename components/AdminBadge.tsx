'use client';

import { useAdmin } from '@/contexts/AdminContext';

export function AdminBadge() {
  const { isAdmin, setIsAdmin } = useAdmin();

  if (!isAdmin) return null;

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setIsAdmin(false);
  }

  return (
    <button
      onClick={logout}
      className="fixed top-2 right-2 z-50 rounded-full px-3 py-1 text-xs bg-yellow-500/80 hover:bg-yellow-500 text-black font-medium transition-colors"
    >
      Admin ON – Logout
    </button>
  );
}



