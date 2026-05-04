'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  totalClients: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingPayments: number;
  lowStockProducts: number;
  customerOnly: number;
  supplierOnly: number;
  carrierOnly: number;
  both: number;
  activeCustomers: number;
  activeSuppliers: number;
  incompleteTaxPercentage: string;
  total: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    lowStockProducts: 0,
    customerOnly: 0,
    supplierOnly: 0,
    carrierOnly: 0,
    both: 0,
    activeCustomers: 0,
    activeSuppliers: 0,
    incompleteTaxPercentage: '0',
    total: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadStats(token);
  }, [router]);

  const loadStats = async (token: string) => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/erp/dashboard', active: true },
    { icon: '👥', label: 'Cadastro Geral', href: '/erp/cadastro/geral/lista' },
    { icon: '📦', label: 'Produtos', href: '/erp/products' },
    { icon: '🛒', label: 'Vendas', href: '/erp/orders' },
    { icon: '💰', label: 'Financeiro', href: '/erp/finance' },
    { icon: '📋', label: 'Relatórios', href: '/erp/reports' },
    { icon: '⚙️', label: 'Configurações', href: '/erp/settings' },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 gradient-bg text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <img
            src="/imagens/logo_nxcontrol.png"
            alt="NEXO CONTROL"
            className="h-10 mx-auto"
          />
          <p className="text-center text-sm mt-2 text-white/80">ERP</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-white/60">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <span>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo, {user?.name}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Clientes Ativos</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.activeCustomers}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </div>

          <div className="card card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Fornecedores Ativos</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.activeSuppliers}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                🏢
              </div>
            </div>
          </div>

          <div className="card card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Produtos</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                📦
              </div>
            </div>
          </div>

          <div className="card card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Receita Total</p>
                <p className="text-3xl font-bold text-primary mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Distribuição de Entidades</h2>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  {stats.total > 0 && (
                    <>
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray={`${(stats.customerOnly / stats.total) * 100}, 100`}
                        strokeDashoffset="25"
                        transform="rotate(-90 18 18)"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeDasharray={`${(stats.supplierOnly / stats.total) * 100}, 100`}
                        strokeDashoffset={25 - ((stats.customerOnly / stats.total) * 100)}
                        transform="rotate(-90 18 18)"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeDasharray={`${(stats.both / stats.total) * 100}, 100`}
                        strokeDashoffset={25 - ((stats.customerOnly + stats.supplierOnly) / stats.total) * 100}
                        transform="rotate(-90 18 18)"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{stats.total}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1"></div>
                <p className="text-xs text-gray-500">Clientes</p>
                <p className="font-semibold">{stats.customerOnly}</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-1"></div>
                <p className="text-xs text-gray-500">Fornecedores</p>
                <p className="font-semibold">{stats.supplierOnly}</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto mb-1"></div>
                <p className="text-xs text-gray-500">Ambos</p>
                <p className="font-semibold">{stats.both}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Qualidade dos Dados</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Dados Fiscais Completos</span>
                  <span className="text-sm font-semibold text-primary">
                    {100 - parseFloat(stats.incompleteTaxPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${100 - parseFloat(stats.incompleteTaxPercentage)}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-medium text-gray-800">Cadastros Incompletos</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {stats.incompleteTaxPercentage}% dos cadastros possuem dados fiscais incompletos.
                      Revise os cadastros para evitar problemas fiscais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}