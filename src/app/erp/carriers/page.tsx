'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CarriersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/erp/cadastro/geral/lista?type=carrier');
  }, [router]);
  return null;
}