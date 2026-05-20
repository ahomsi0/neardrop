'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function RoomJoinPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  useEffect(() => {
    sessionStorage.setItem('neardrop-join-code', params.code.toUpperCase());
    router.replace('/');
  }, [params.code, router]);
  return (
    <div className="h-dvh flex items-center justify-center bg-stone-50">
      <p className="text-sm text-stone-400">Joining room {params.code}…</p>
    </div>
  );
}
