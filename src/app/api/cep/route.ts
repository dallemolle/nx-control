import { NextRequest, NextResponse } from 'next/server';
import { searchCep } from '@/lib/cep';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cep = searchParams.get('cep');

  if (!cep) {
    return NextResponse.json({ error: 'CEP required' }, { status: 400 });
  }

  const result = await searchCep(cep);
  
  if (!result) {
    return NextResponse.json({ error: 'CEP not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}