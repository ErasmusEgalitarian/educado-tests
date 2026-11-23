
import { test, expect } from '@playwright/test';
import { authenticatedGet, authenticatedRequest, canRunMutation } from '../helpers/api';

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

  test('AT-05 - Criador não pode promover a própria conta', async ({ request }) => {
    test.skip(!process.env.CREATOR_TOKEN || !process.env.CREATOR_USER_ID ||
      !process.env.ADMIN_TOKEN,
    'SKIP: requer ID de criador sintetico e tokens admin/criador para verificar o papel.');

    const path = `/admin/users/${process.env.CREATOR_USER_ID}`;
    const before = await authenticatedGet(request, path, 'admin');
    expect(before.status()).toBe(200);
    const beforeUser = await before.json();
    expect(beforeUser.role).toBe('USER');

    const attempt = await request.patch(`${path}/role`, {
      headers: {
        Authorization: `Bearer ${process.env.CREATOR_TOKEN}`
      }
    });
    expect(attempt.status()).toBe(403);

    const after = await authenticatedGet(request, path, 'admin');
    expect(after.status()).toBe(200);
    expect((await after.json()).role).toBe(beforeUser.role);
  });

  // AT-20: controles positivos de administração.
  test('AT-20.1 - Administrador pode consultar usuários', async ({ request }) => {
    test.skip(!process.env.ADMIN_TOKEN);

    const response = await authenticatedGet(
      request, '/admin/users', 'admin'
    );

    expect(response.status()).toBe(200);
    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.every((user: Record<string, unknown>) =>
      typeof user.id === 'string' &&
      ['ADMIN', 'USER', 'STUDENT'].includes(String(user.role))
    )).toBe(true);
  });

  test('AT-20.2 - Administrador altera e restaura papel de usuário de teste', async ({ request }) => {
    test.skip(!canRunMutation() || !process.env.ROLE_TEST_USER_ID ||
      !process.env.ADMIN_TOKEN,
    'SKIP: requer usuário sintético USER, token admin e opt-ins para mutação local.');

    const path = `/admin/users/${process.env.ROLE_TEST_USER_ID}`;
    const beforeResponse = await authenticatedGet(request, path, 'admin');
    expect(beforeResponse.status()).toBe(200);
    const before = await beforeResponse.json();
    expect(before.role).toBe('USER');

    try {
      const change = await authenticatedRequest(
        request, 'PATCH', `${path}/role`, 'admin'
      );
      expect(change.status()).toBe(200);
      expect((await change.json()).role).toBe('ADMIN');

      const changed = await authenticatedGet(request, path, 'admin');
      expect((await changed.json()).role).toBe('ADMIN');
    } finally {
      const current = await authenticatedGet(request, path, 'admin');
      expect(current.status()).toBe(200);
      if ((await current.json()).role === 'ADMIN') {
        const restore = await authenticatedRequest(
          request, 'PATCH', `${path}/role`, 'admin'
        );
        expect(restore.status()).toBe(200);
      }
      const restored = await authenticatedGet(request, path, 'admin');
      expect((await restored.json()).role).toBe('USER');
    }
  });

});
