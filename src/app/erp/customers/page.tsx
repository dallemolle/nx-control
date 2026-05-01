'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Entity {
  id: string;
  fullName: string;
  tradeName: string | null;
  documentNumber: string;
  email: string | null;
  phone: string | null;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  status: string;
  personType: string;
  createdAt: string;
}

function formatDocument(doc: string): string {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

export default function CustomersPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadEntities(token);
  }, [page]);

  const loadEntities = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/entities?type=customer&page=${page}&limit=20&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const token = localStorage.getItem('token');
    if (token) loadEntities(token);
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/erp/dashboard' },
    { icon: '👥', label: 'Clientes', href: '/erp/customers', active: true },
    { icon: '🏢', label: 'Fornecedores', href: '/erp/suppliers' },
    { icon: '🚚', label: 'Transportadoras', href: '/erp/carriers' },
    { icon: '📦', label: 'Produtos', href: '/erp/products' },
    { icon: '🛒', label: 'Vendas', href: '/erp/orders' },
    { icon: '💰', label: 'Financeiro', href: '/erp/finance' },
    { icon: '⚙️', label: 'Configurações', href: '/erp/settings' },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 gradient-bg text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <img src="/imagens/logo_nxcontrol.png" alt="NEXO CONTROL" className="h-10 mx-auto" />
          <p className="text-center text-sm mt-2 text-white/80">ERP</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                item.active ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Clientes</h1>
            <p className="text-gray-600 mt-1">Gerencie seus clientes</p>
          </div>
          <a href="/erp/customers/new" className="btn-primary">
            + Novo Cliente
          </a>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Buscar por nome, documento ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 input-field"
            />
            <button onClick={handleSearch} className="btn-primary">
              Buscar
            </button>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : entities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum cliente encontrado</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Documento</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Telefone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map((entity) => (
                    <tr key={entity.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-primary">{entity.fullName}</div>
                        {entity.tradeName && (
                          <div className="text-sm text-gray-500">{entity.tradeName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{formatDocument(entity.documentNumber)}</span>
                        <span className="text-xs text-gray-400 ml-2">({entity.personType})</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{entity.email || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{entity.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entity.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {entity.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a href={`/erp/customers/${entity.id}`} className="text-primary hover:underline text-sm">
                          Ver
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-primary disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-primary disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}