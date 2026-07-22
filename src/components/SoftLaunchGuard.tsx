// src/components/SoftLaunchGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '#/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SoftLaunchGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isApproved } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setChecked(true);
    }
  }, [isLoading]);

  if (!checked || isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // If user is logged in but not approved - show restricted page
  if (user && !isApproved) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Restricted</h1>
          <p className="text-gray-400 mb-6">
            Your account is not authorized to use this application.
          </p>
          <button
            onClick={() => router.push('/auth/signout')}
            className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Allow access to all (even non-logged in users can view content)
  return <>{children}</>;
}