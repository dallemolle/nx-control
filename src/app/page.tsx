'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './globals.css';

export default function Home() {
  const router = useRouter();

  const handleGoToDashboard = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/erp/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-gray-50 to-gray-200">
      <Link
        href="/login"
        className="fixed top-6 right-6 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-all flex items-center gap-2 shadow-lg"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h10a1 1 0 011 1v16a1 1 0 01-1 1H9M12 12h.01M9 12h6M9 8h6" />
        </svg>
        ERP
      </Link>

      <div className="text-center max-w-2xl bg-white rounded-2xl shadow-xl p-8 md:p-12 w-full max-w-lg">
        <div className="mb-8">
          <img
            src="/imagens/logo_nxcontrol.png"
            alt="NEXO CONTROL Logo"
            className="max-w-xs mx-auto rounded-xl"
          />
        </div>

        <div className="bg-primary text-white px-6 py-3 rounded-full inline-block mb-6">
          <span className="font-bold">Em Construção</span>
        </div>

        <h1 className="text-4xl font-bold text-primary mb-2">NEXO CONTROL</h1>
        <p className="text-gray-500 text-lg mb-8">Gestão Inteligente e Consultoria Estratégica</p>

        <p className="text-lg text-gray-600 mb-2">
          Estamos construindo o futuro da sua gestão empresarial.
        </p>

        <p className="text-lg text-gray-600 mb-8">
          Uma solução robusta que une a agilidade do ERP moderno à profundidade da consultoria financeira estratégica.
        </p>

        <p className="text-primary font-medium">
          Contato: contato@nexocontrol.com.br | +55 (11) 1234-5678
        </p>

        <button
          onClick={handleGoToDashboard}
          className="mt-6 inline-block bg-gray-100 text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
        >
          ← Acessar Dashboard
        </button>
      </div>
    </div>
  );
}