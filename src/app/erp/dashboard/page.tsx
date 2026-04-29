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
    { icon: '👥', label: 'Clientes', href: '/erp/clients' },
    { icon: '🏢', label: 'Fornecedores', href: '/erp/suppliers' },
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
                <p className="text-gray-500 text-sm">Total de Clientes</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.totalClients}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </div>

          <div className="card card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Produtos</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                📦
              </div>
            </div>
          </div>

          <div className="card card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pedidos</p>
                <p className="text-3xl font-bold text-primary mt-1">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">
                🛒
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
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Alertas</h2>
            <div className="space-y-3">
              {stats.pendingPayments > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <span className="text-xl">⚠️</span>
                  <span className="text-sm text-gray-700">
                    {stats.pendingPayments} pagamentos pendentes
                  </span>
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                  <span className="text-xl">📉</span>
                  <span className="text-sm text-gray-700">
                    {stats.lowStockProducts} produtos com estoque baixo
                  </span>
                </div>
              )}
              {stats.pendingPayments === 0 && stats.lowStockProducts === 0 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-xl">✅</span>
                  <span className="text-sm text-gray-700">
                    Tudo em dia!
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-primary mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              <a href="/erp/clients/new" className="btn-primary text-center">
                + Novo Cliente
              </a>
              <a href="/erp/products/new" className="btn-primary text-center">
                + Novo Produto
              </a>
              <a href="/erp/orders/new" className="btn-primary text-center">
                + Novo Pedido
              </a>
              <a href="/erp/finance/payments" className="btn-primary text-center">
                Pagamentos
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}