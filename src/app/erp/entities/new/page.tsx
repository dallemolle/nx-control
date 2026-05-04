'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateDocument } from '@/lib/validations';

interface FormData {
  entityType: 'customer' | 'supplier' | 'carrier';
  personType: 'PF' | 'PJ';
  fullName: string;
  tradeName: string;
  documentNumber: string;
  stateRegistration: string;
  municipalRegistration: string;
  taxRegimeCode: number;
  street: string;
  streetNumber: string;
  complement: string;
  district: string;
  cityCode: string;
  cityName: string;
  stateUf: string;
  zipCode: string;
  email: string;
  phone: string;
  whatsapp: string;
}

export default function NewEntityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    entityType: 'customer',
    personType: 'PF',
    fullName: '',
    tradeName: '',
    documentNumber: '',
    stateRegistration: '',
    municipalRegistration: '',
    taxRegimeCode: 1,
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
  const [saving, setSaving] = useState(false);
  // Document validation states
  const [docError, setDocError] = useState<string>('');
  const [docValid, setDocValid] = useState(false);
  const [docChecking, setDocChecking] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const path = window.location.pathname;
    if (path.includes('/customers/new')) {
      setFormData((prev) => ({ ...prev, entityType: 'customer' }));
    } else if (path.includes('/suppliers/new')) {
      setFormData((prev) => ({ ...prev, entityType: 'supplier' }));
    } else if (path.includes('/carriers/new')) {
      setFormData((prev) => ({ ...prev, entityType: 'carrier' }));
    }
  }, [router]);

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

      const res = await fetch(`/api/entities/check-document?document=${doc}&tenantId=${tenantId}`, {
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

    const payload = {
      isCustomer: formData.entityType === 'customer',
      isSupplier: formData.entityType === 'supplier',
      isCarrier: formData.entityType === 'carrier',
      personType: formData.personType,
      fullName: formData.fullName,
      tradeName: formData.tradeName,
      documentNumber: formData.documentNumber,
      stateRegistration: formData.stateRegistration,
      municipalRegistration: formData.municipalRegistration,
      taxRegimeCode: formData.taxRegimeCode,
      street: formData.street,
      streetNumber: formData.streetNumber,
      complement: formData.complement,
      district: formData.district,
      cityCode: formData.cityCode,
      cityName: formData.cityName,
      stateUf: formData.stateUf,
      zipCode: formData.zipCode,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
    };

    setSaving(true);
    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (formData.entityType === 'customer') {
          router.push('/erp/customers');
        } else if (formData.entityType === 'supplier') {
          router.push('/erp/suppliers');
        } else {
          router.push('/erp/carriers');
        }
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
    { icon: '🚚', label: 'Transportadoras', href: '/erp/carriers' },
    { icon: '📦', label: 'Produtos', href: '/erp/products' },
    { icon: '🛒', label: 'Vendas', href: '/erp/orders' },
    { icon: '💰', label: 'Financeiro', href: '/erp/finance' },
    { icon: '⚙️', label: 'Configuracoes', href: '/erp/settings' },
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
            <a key={item.href} href={item.href} className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all hover:bg-white/10">
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-8">
            {formData.entityType === 'customer' ? 'Novo Cliente' : formData.entityType === 'supplier' ? 'Novo Fornecedor' : 'Nova Transportadora'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">Tipo de Entidade</h2>
              <div className="max-w-xs">
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, entityType: e.target.value as 'customer' | 'supplier' | 'carrier' }))}
                  className="input-field"
                >
                  <option value="customer">Cliente</option>
                  <option value="supplier">Fornecedor</option>
                  <option value="carrier">Transportadora</option>
                </select>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-primary mb-4">Identificacao</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa</label>
                  <select
                    value={formData.personType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, personType: e.target.value as 'PF' | 'PJ' }))}
                    className="input-field"
                  >
                    <option value="PF">Pessoa Fisica</option>
                    <option value="PJ">Pessoa Juridica</option>
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
                    {formData.personType === 'PJ' ? 'Razao Social' : 'Nome Completo'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder={formData.personType === 'PJ' ? 'Razao Social' : 'Nome completo'}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inscricao Estadual</label>
                      <input
                        type="text"
                        value={formData.stateRegistration}
                        onChange={(e) => setFormData((prev) => ({ ...prev, stateRegistration: e.target.value }))}
                        placeholder="Isenta ou numero da IE"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inscricao Municipal</label>
                      <input
                        type="text"
                        value={formData.municipalRegistration}
                        onChange={(e) => setFormData((prev) => ({ ...prev, municipalRegistration: e.target.value }))}
                        placeholder="Numero da IM"
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regime Tributario</label>
                      <select
                        value={formData.taxRegimeCode}
                        onChange={(e) => setFormData((prev) => ({ ...prev, taxRegimeCode: parseInt(e.target.value) }))}
                        className="input-field"
                      >
                        <option value={1}>Simples Nacional</option>
                        <option value={2}>Simples Nacional - Excessos</option>
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
              <h2 className="text-lg font-semibold text-primary mb-4">Endereco</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero</label>
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

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}