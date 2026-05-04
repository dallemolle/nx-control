// src/lib/cep.ts

interface CepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

export interface CepWithIbge extends CepResponse {
  ibge_code?: string | null;
}

export async function searchCep(cep: string): Promise<CepWithIbge | null> {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (cleanCep.length !== 8) {
    throw new Error('CEP inválido');
  }

  try {
    // BrasilAPI - preferred
    const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
    
    if (!res.ok) {
      // Fallback to ViaCEP
      const fallback = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await fallback.json();
      
      if (data.erro) return null;
      
      return {
        cep: data.cep,
        state: data.uf,
        city: data.localidade,
        neighborhood: data.bairro,
        street: data.logradouro,
        service: 'viacep',
        ibge_code: null, // ViaCEP doesn't provide IBGE
      };
    }
    
    const data = await res.json();
    return {
      cep: data.cep,
      state: data.state,
      city: data.city,
      neighborhood: data.neighborhood || '',
      street: data.street || '',
      service: 'brasilapi',
      ibge_code: null, // Not in standard response
    };
  } catch (error) {
    console.error('CEP lookup failed:', error);
    return null;
  }
}