'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/erp/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="text-center max-w-2xl bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-6xl mb-4">🚧</div>
        
        <h1 className="text-4xl font-bold text-primary mb-2">Página em Construção</h1>
        <p className="text-gray-500 text-lg mb-8">Este módulo ainda está sendo implementado.</p>

        <button
          onClick={handleGoBack}
          className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-all cursor-pointer"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}