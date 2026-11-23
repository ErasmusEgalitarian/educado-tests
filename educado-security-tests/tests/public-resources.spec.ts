
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  authenticatedGet,
  authenticatedRequest,
  canRunMutation
} from '../helpers/api';

function findSensitiveFields(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value)) {
    return value.flatMap(findSensitiveFields);
  }

  const object = value as Record<string, unknown>;
  const sensitiveKeys = Object.keys(object).filter(key =>
    ['correctAnswer', 'correct_answer', 'answerKey', 'answer_key'].includes(key)
  );

  return [
    ...sensitiveKeys,
    ...Object.values(object).flatMap(findSensitiveFields)
  ];
}

test.describe('Instituições e recursos públicos', () => {

  // AT-19: instituição é recurso administrativo; USER e STUDENT não têm acesso.
  test('AT-19.1 - Criador não pode consultar instituições', async ({ request }) => {
    test.skip(!process.env.CREATOR_TOKEN);

    const response = await authenticatedGet(request, '/institutions', 'creator');
    expect(response.status()).toBe(403);
  });

  test('AT-19.2 - Estudante não pode consultar instituições', async ({ request }) => {
    test.skip(!process.env.STUDENT_A_TOKEN);

    const response = await authenticatedGet(request, '/institutions', 'studentA');
    expect(response.status()).toBe(403);
  });

  test('AT-19.3 - Criador não pode escrever instituições nem alterar estado', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local e ambos os opt-ins de mutacao.');
    test.skip(!process.env.CREATOR_TOKEN || !process.env.ADMIN_TOKEN,
      'SKIP: requer tokens de criador e admin.');

    const suffix = randomUUID().replace(/-/g, '');
    const fixtureName = `Synthetic institution for denial ${suffix}`;
    const fixture = await authenticatedRequest(request, 'POST', '/institutions', 'admin', {
      name: fixtureName,
      domain: `${suffix}.invalid`
    });
    expect(fixture.status()).toBe(201);
    const institution = await fixture.json();
    const path = `/institutions/${institution.id}`;

    try {
      const create = await authenticatedRequest(request, 'POST', '/institutions', 'creator', {
        name: `Unauthorized institution ${suffix}`,
        domain: `unauthorized-${suffix}.invalid`
      });
      if (create.status() === 201) {
        const unauthorizedInstitution = await create.json();
        const cleanupUnauthorizedCreate = await authenticatedRequest(
          request, 'DELETE', `/institutions/${unauthorizedInstitution.id}`, 'admin'
        );
        expect(cleanupUnauthorizedCreate.status()).toBe(204);
      }
      expect(create.status()).toBe(403);

      const before = await authenticatedGet(request, path, 'admin');
      expect(before.status()).toBe(200);
      const original = await before.json();

      const update = await authenticatedRequest(
        request, 'PUT', path, 'creator', { name: `Changed ${suffix}` }
      );
      expect(update.status()).toBe(403);

      const deletion = await authenticatedRequest(request, 'DELETE', path, 'creator');
      expect(deletion.status()).toBe(403);

      const after = await authenticatedGet(request, path, 'admin');
      expect(after.status()).toBe(200);
      expect(await after.json()).toEqual(original);
    } finally {
      const cleanup = await authenticatedRequest(request, 'DELETE', path, 'admin');
      expect([204, 404]).toContain(cleanup.status());
    }
  });

  test('AT-19-P1 - Administrador pode consultar instituições', async ({ request }) => {
    test.skip(!process.env.ADMIN_TOKEN);

    const response = await authenticatedGet(
      request, '/institutions', 'admin'
    );

    expect(response.status()).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  test('AT-19-P2 - Administrador cria, edita e exclui instituição sintética', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local e ambos os opt-ins de mutacao.');
    test.skip(!process.env.ADMIN_TOKEN,
      'SKIP: requer token admin.');

    const suffix = randomUUID().replace(/-/g, '');
    const create = await authenticatedRequest(request, 'POST', '/institutions', 'admin', {
      name: `Synthetic institution ${suffix}`,
      domain: `${suffix}.invalid`
    });
    expect(create.status()).toBe(201);
    const institution = await create.json();
    const path = `/institutions/${institution.id}`;

    try {
      const read = await authenticatedGet(request, path, 'admin');
      expect(read.status()).toBe(200);
      expect((await read.json()).name).toBe(`Synthetic institution ${suffix}`);

      const update = await authenticatedRequest(
        request, 'PUT', path, 'admin', { name: `Updated institution ${suffix}` }
      );
      expect(update.status()).toBe(200);
      expect((await (await authenticatedGet(request, path, 'admin')).json()).name)
        .toBe(`Updated institution ${suffix}`);
    } finally {
      const deletion = await authenticatedRequest(request, 'DELETE', path, 'admin');
      expect([204, 404]).toContain(deletion.status());
    }

    expect((await authenticatedGet(request, path, 'admin')).status()).toBe(404);
  });

  // AT-22.1 BLOQUEADO por P08: nao habilitar apenas por configurar um codigo.
  test('AT-22.1 - Certificado válido deve ser verificável publicamente', async ({ request }) => {
    test.skip(true, 'BLOQUEADO: politica P08 ainda nao foi confirmada.');
    test.skip(!process.env.CERTIFICATE_CODE);

    const response = await request.get(
      `/certificates/verify/${process.env.CERTIFICATE_CODE}`
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('password');
    // TODO: apos decisao P08, validar allowlist completa, incluindo ausencia de
    // PDF e de todos os demais campos nao autorizados.
  });

  test('AT-22.2 - Código inexistente deve retornar 404', async ({ request }) => {
    const code = `AUTHZ-INVALID-${randomUUID()}`;
    const response = await request.get(
      `/certificates/verify/${code}`
    );

    expect(response.status()).toBe(404);
  });

  // AT-23: o curso publico ativo nao pode expor gabarito nem campos de resposta.
  // Esta e uma leitura anonima e nao altera o curso.
  test('AT-23 - Catálogo público não deve expor gabarito', async ({ request }) => {
    test.skip(!process.env.CREATOR_COURSE_ID,
      'SKIP: configure CREATOR_COURSE_ID com um curso ativo do catalogo.');

    const response = await request.get(
      `/catalog/courses/${process.env.CREATOR_COURSE_ID}`
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(findSensitiveFields(body)).toEqual([]);
  });

  test('AT-23-C2 - Estudante consulta catálogo sem receber gabarito', async ({ request }) => {
    test.skip(!process.env.STUDENT_A_TOKEN || !process.env.CREATOR_COURSE_ID);

    const response = await authenticatedGet(
      request,
      `/catalog/courses/${process.env.CREATOR_COURSE_ID}`,
      'studentA'
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(findSensitiveFields(body)).toEqual([]);
  });

});
