'use client';

import { Suspense } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  isCustomer: boolean;
  isSupplier: boolean;
  isCarrier: boolean;
  createdAt: string;
}

function getEntityType(entity: Entity): string {
  if (entity.isCustomer) return 'customer';
  if (entity.isSupplier) return 'supplier';
  if (entity.isCarrier) return 'carrier';
  return 'customer';
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

function getEntityTypeLabel(type: string): string {
  switch (type) {
    case 'customer': return 'Cliente';
    case 'supplier': return 'Fornecedor';
    case 'carrier': return 'Transportadora';
    default: return type;
  }
}

function getEntityTypeColor(type: string): string {
  switch (type) {
    case 'customer': return 'bg-blue-100 text-blue-700';
    case 'supplier': return 'bg-purple-100 text-purple-700';
    case 'carrier': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function CadastroGeralContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier' | 'carrier'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const initialType = useMemo(() => {
    const t = searchParams.get('type');
    if (t === 'customer' || t === 'supplier' || t === 'carrier') return t;
    return 'all';
  }, [searchParams]);

  useEffect(() => {
    setTypeFilter(initialType);
  }, [initialType]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadEntities(token);
  }, [page, typeFilter]);

  const loadEntities = async (token: string) => {
    setLoading(true);
    try {
      const typeParam = typeFilter === 'all' ? '' : `type=${typeFilter}&`;
      const response = await fetch(`/api/entities?${typeParam}page=${page}&limit=20&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar entidades');
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
    { icon: '👥', label: 'Cadastro Geral', href: '/erp/cadastro/geral/lista', active: true },
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
            <h1 className="text-3xl font-bold text-primary">Cadastro Geral</h1>
            <p className="text-gray-600 mt-1">Gerencie clientes, fornecedores e transportadoras</p>
          </div>
          <a href="/erp/entities/new" className="btn-primary">
            + Novo Cadastro
          </a>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="input-field w-48"
            >
              <option value="all">Todos os tipos</option>
              <option value="customer">Clientes</option>
              <option value="supplier">Fornecedores</option>
              <option value="carrier">Transportadoras</option>
            </select>
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
            <div className="text-center py-8 text-gray-500">Nenhum cadastro encontrado</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tipo</th>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(getEntityType(entity))}`}>
                          {getEntityTypeLabel(getEntityType(entity))}
                        </span>
                      </td>
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
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {entity.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`/erp/${getEntityType(entity) === 'customer' ? 'customers' : getEntityType(entity) === 'supplier' ? 'suppliers' : 'carriers'}/${entity.id}`}
                          className="text-primary hover:underline text-sm"
                        >
                          Ver
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CadastroGeralPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <CadastroGeralContent />
    </Suspense>
  );
}