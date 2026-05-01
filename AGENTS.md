# Padrões de Implementação

## Rotina de Testes

Toda nova implementação DEVE incluir rotinas de teste:

1. **Adicionar dependências de teste** conforme necessidade:
   - Vitest (recomendado para Next.js/React)
   - React Testing Library
   - Jest (alternativa)

2. **Estrutura de testes**:
   - Arquivos de teste junto aos arquivos implementados: `*.test.ts` ou `*.spec.ts`
   - Seguir padrão: `{nome}.test.ts` para unit tests

3. **Procedimento**:
   - Após implementação, criar testes unitários e de integração
   - Execute os testes: `npm run test` ou equivalente
   - Garanta que todos os testes passam antes de finalizar

4. **Cobertura**: Prioritize testar lógicas de negócio, validações e componentes críticos