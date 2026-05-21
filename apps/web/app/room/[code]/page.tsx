'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function RoomJoinPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();

  useEffect(() => {
    if (params.code) {
      try { sessionStorage.setItem('neardrop-join-code', params.code); } catch { /* ignore */ }
    }
    router.replace('/');
  }, [params.code, router]);

  return (
    <div className="flex h-dvh items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="text-sm text-stone-400">Joining room…</p>
    </div>
  );
}
