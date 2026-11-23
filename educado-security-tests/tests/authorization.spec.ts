
import { test, expect } from '@playwright/test';
import { authenticatedGet } from '../helpers/api';

test.describe('Autorização - AT-04, AT-05 e AT-20', () => {

  // Cobertura parcial: as consultas verificam somente status HTTP; adicionar
  // asserts sobre os dados e controles positivos para cada papel.
  test.beforeEach(() => {
    test.skip(!process.env.CREATOR_TOKEN && !process.env.ADMIN_TOKEN,
      'Configure os tokens no .env');
  });

  // AT-04: somente leitura
  test('AT-04.1 - Criador não lista usuários administrativos', async ({ request }) => {
    test.skip(!process.env.CREATOR_TOKEN);

    const response = await authenticatedGet(
      request, '/admin/users', 'creator'
    );

    expect(response.status()).toBe(403);
  });

  test('AT-04.2 - Criador não acessa instituições restritas', async ({ request }) => {
    test.skip(!process.env.CREATOR_TOKEN);

    const response = await authenticatedGet(
      request, '/institutions', 'creator'
    );

    expect(response.status()).toBe(403);
  });

  // AT-05 NAO IMPLEMENTADO: requer usuario descartavel, snapshot e restauracao.
  test('AT-05 - Criador não pode promover a própria conta', async () => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer staging autorizado e verificacao/restauracao do papel.');
  });

//   AT-20: somente leitura
  test('AT-20.1 - Administrador pode consultar usuários', async ({ request }) => {
    test.skip(!process.env.ADMIN_TOKEN);

    const response = await authenticatedGet(
      request, '/admin/users', 'admin'
    );

    expect(response.status()).toBe(200);
    // TODO: validar a allowlist dos dados; status 200 sozinho nao detecta vazamento.
  });

  // AT-20 NAO IMPLEMENTADO: falta testar transicoes de papel e efeito em tokens/sessoes.
  test('AT-20.2 - Administrador altera papel de usuário de teste', async () => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer staging autorizado, usuario descartavel e verificacao/restauracao.');
  });

});
