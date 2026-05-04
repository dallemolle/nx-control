'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { validateDocument } from '@/lib/validations';

interface Entity {
  id: string;
  fullName: string;
  tradeName: string | null;
  documentNumber: string;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  taxRegimeCode: number;
  personType: 'PF' | 'PJ';
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  district: string | null;
  cityCode: string | null;
  cityName: string | null;
  stateUf: string | null;
  zipCode: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  createdAt: string;
}

export default function CarrierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [docError, setDocError] = useState<string>('');
  const [docValid, setDocValid] = useState(false);
  const [docChecking, setDocChecking] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    tradeName: '',
    documentNumber: '',
    stateRegistration: '',
    municipalRegistration: '',
    taxRegimeCode: 1,
    personType: 'PF' as 'PF' | 'PJ',
    street: '',
    streetNumber: '',
    complement: '',
    district: '',
    cityCode: '',
    cityName: '',
    stateUf: '',
    zipCode: '',
    email: '',
    phone: '',
    whatsapp: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadEntity(token);
  }, [params.id]);

  const loadEntity = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/entities?id=${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEntity(data);
        setFormData({
          fullName: data.fullName || '',
          tradeName: data.tradeName || '',
          documentNumber: data.documentNumber || '',
          stateRegistration: data.stateRegistration || '',
          municipalRegistration: data.municipalRegistration || '',
          taxRegimeCode: data.taxRegimeCode || 1,
          personType: data.personType || 'PF',
          street: data.street || '',
          streetNumber: data.streetNumber || '',
          complement: data.complement || '',
          district: data.district || '',
          cityCode: data.cityCode || '',
          cityName: data.cityName || '',
          stateUf: data.stateUf || '',
          zipCode: data.zipCode || '',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar transportadora');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      setFormData((prev) => ({ ...prev, personType: 'PF', documentNumber: value }));
    } else {
      setFormData((prev) => ({ ...prev, personType: 'PJ', documentNumber: value }));
    }
  };

  const handleDocumentBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const doc = e.target.value.replace(/\D/g, '');
    if (doc.length < 11) return;
    setDocChecking(true);
    try {
      if (!validateDocument(doc)) {
        setDocError('CPF ou CNPJ inválido');
        setDocValid(false);
        return;
      }
      setDocError('');
      setDocValid(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      const tenantId = localStorage.getItem('tenantId');
      if (!tenantId) return;
      const res = await fetch(`/api/entities/check-document?document=${doc}&tenantId=${tenantId}&excludeId=${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.exists) {
        setDocError(`Documento já cadastrado para: ${data.entity.fullName}`);
        setDocValid(false);
      }
    } catch (error) {
      console.error('Document check failed', error);
    } finally {
      setDocChecking(false);
    }
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const response = await fetch(`/api/cep?cep=${cep}`);
      const data = await response.json();
      if (!data.error) {
        setFormData((prev) => ({
          ...prev,
          zipCode: data.cep || prev.zipCode,
          street: data.street || prev.street,
          district: data.neighborhood || prev.district,
          cityName: data.city || prev.cityName,
          stateUf: data.state || prev.stateUf,
        }));
      }
    } catch (error) {
      console.error('CEP lookup failed', error);
    } finally {
      setCepLoading(false);
    }
  };

  const loadAuditLog = async (token: string, tenantId: string) => {
    setLoadingAudit(true);
    try {
      const response = await fetch(`/api/entities/${params.id}/audit?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLog(data.auditLog || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico');
    } finally {
      setLoadingAudit(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome é obrigatório';
    }

    const cleanDoc = formData.documentNumber.replace(/\D/g, '');
    if (cleanDoc.length < 11 || cleanDoc.length > 14) {
      newErrors.documentNumber = 'CPF/CNPJ inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setSuccess('');
    try {
      const response = await fetch(`/api/entities?id=${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setEntity(data);
        setSuccess('Transportadora atualizada com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Erro ao salvar' });
      }
    } catch (error) {
      setErrors({ submit: 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/erp/dashboard' },
    { icon: '👥', label: 'Clientes', href: '/erp/customers' },
    { icon: '🏢', label: 'Fornecedores', href: '/erp/suppliers' },
    { icon: '🚚', label: 'Transportadoras', href: '/erp/carriers', active: true },
    { icon: '📦', label: 'Produtos', href: '/erp/products' },
    { icon: '🛒', label: 'Vendas', href: '/erp/orders' },
    { icon: '💰', label: 'Financeiro', href: '/erp/finance' },
    { icon: '⚙️', label: 'Configurações', href: '/erp/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Transportadora não encontrada</div>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary">Detalhes da Transportadora</h1>
              <p className="text-gray-600 mt-1">Visualize e edite as informações da transportadora</p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  entity.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {entity.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              </span>
              <button
                onClick={async () => {
                  if (!showAudit) {
                    const token = localStorage.getItem('token');
                    const tenantId = localStorage.getItem('tenantId');
                    if (token && tenantId) {
                      await loadAuditLog(token, tenantId);
                    }
                  }
                  setShowAudit(!showAudit);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-primary border rounded-lg"
              >
                {showAudit ? 'Ocultar Histórico' : 'Ver Histórico'}
              </button>
            </div>
          </div>

          {showAudit && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold text-primary mb-4">Histórico de Alterações</h2>
              {loadingAudit ? (
                <p className="text-gray-500">Carregando histórico...</p>
              ) : auditLog.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {auditLog.map((log) => (
                    <div key={log.id} className="text-sm text-gray-600 border-b pb-2">
                      <span className="font-medium">
                        {log.changeType === 'CREATE' && 'Criado'}
                        {log.changeType === 'UPDATE' && `Alterou ${log.field}`}
                        {log.changeType === 'DELETE' && 'Inativado'}
                      </span>
                      {(log.oldValue || log.newValue) && (
                        <span className="text-gray-500 ml-2">
                          {log.oldValue && <span>De: {log.oldValue}</span>}
                          {log.oldValue && log.newValue && <span> → </span>}
                          {log.newValue && <span>Para: {log.newValue}</span>}
                        </span>
                      )}
                      <span className="text-gray-400 text-xs ml-2">
                        {log.changedBy} • {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhuma alteração registrada</p>
              )}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">Identificação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa</label>
                  <select
                    value={formData.personType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, personType: e.target.value as 'PF' | 'PJ' }))}
                    className="input-field"
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.personType === 'PJ' ? 'CNPJ' : 'CPF'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      onBlur={handleDocumentBlur}
                      placeholder={formData.personType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                      className={`input-field ${docError ? 'border-red-500' : docValid ? 'border-green-500' : ''}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {docChecking && <span className="text-gray-400 text-sm">...</span>}
                      {!docChecking && docValid && !docError && (
                        <span className="text-green-500 text-sm">✓</span>
                      )}
                    </div>
                  </div>
                  {docError && <p className="text-red-500 text-sm mt-1">{docError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.personType === 'PJ' ? 'Razão Social' : 'Nome Completo'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder={formData.personType === 'PJ' ? 'Razão Social' : 'Nome completo'}
                    className="input-field"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                {formData.personType === 'PJ' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                      <input
                        type="text"
                        value={formData.tradeName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tradeName: e.target.value }))}
                        placeholder="Nome fantasia"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                      <input
                        type="text"
                        value={formData.stateRegistration}
                        onChange={(e) => setFormData((prev) => ({ ...prev, stateRegistration: e.target.value }))}
                        placeholder="Isenta ou número da IE"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Municipal</label>
                      <input
                        type="text"
                        value={formData.municipalRegistration}
                        onChange={(e) => setFormData((prev) => ({ ...prev, municipalRegistration: e.target.value }))}
                        placeholder="Número da IM"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributário</label>
                      <select
                        value={formData.taxRegimeCode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, taxRegimeCode: parseInt(e.target.value) }))}
                        className="input-field"
                      >
                        <option value={1}>Simples Nacional</option>
                        <option value={2}>Simples Nacional - Excesso</option>
                        <option value={3}>Regime Normal</option>
                        <option value={4}>Lucro Presumido</option>
                        <option value={5}>Lucro Real</option>
                        <option value={6}>Lucro Arbitrado</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                    placeholder="Rua, Avenida, etc."
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={formData.streetNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, streetNumber: e.target.value }))}
                    placeholder="S/N"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
                    placeholder="Apartamento, sala, etc."
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                    placeholder="Bairro"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      className={`input-field ${cepLoading ? 'opacity-50' : ''}`}
                      disabled={cepLoading}
                    />
                    {cepLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        ...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.cityName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cityName: e.target.value }))}
                    placeholder="Cidade"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.stateUf}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stateUf: e.target.value.toUpperCase() }))}
                    placeholder="SP"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">Contato</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 0000-0000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex items-center justify-between space-x-4">
              <button
                type="button"
                onClick={() => router.push('/erp/carriers')}
                className="px-6 py-3 text-gray-600 hover:text-gray-800"
              >
                Voltar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}