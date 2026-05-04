'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuppliersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/erp/cadastro/geral/lista?type=supplier');
  }, [router]);
  return null;
}