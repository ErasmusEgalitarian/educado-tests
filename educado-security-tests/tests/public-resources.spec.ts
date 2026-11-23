
import { test, expect } from '@playwright/test';
import { authenticatedGet } from '../helpers/api';

test.describe('Instituições e recursos públicos', () => {

  // AT-19.1 NAO IMPLEMENTADO: as operacoes do criador estao sempre ignoradas.
  // Adicionar fixture sintetica e comparar a colecao antes/depois.
  test('AT-19.1 - Criador não pode administrar instituições', async () => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer ambiente autorizado, instituicao sintetica e verificacao/restauracao do estado.');
  });

  test('AT-19.2 - Administrador consulta instituições', async ({ request }) => {
    test.skip(!process.env.ADMIN_TOKEN);

    const response = await authenticatedGet(
      request, '/institutions', 'admin'
    );

    expect(response.status()).toBe(200);
    // TODO: validar os dados autorizados retornados; status 200 sozinho nao
    // verifica allowlist nem ausencia de campos sensiveis.
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
    // TODO: usar codigo sintetico de formato valido e confirmar previamente
    // que ele nao existe; essa precondicao e exigida pela tabela.
    const response = await request.get(
      '/certificates/verify/codigo-inexistente-educado-test'
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

    function findSensitiveFields(value: unknown): string[] {
      if (!value || typeof value !== 'object') return [];

      if (Array.isArray(value)) {
        return value.flatMap(findSensitiveFields);
      }

      const object = value as Record<string, unknown>;

      const sensitiveKeys = Object.keys(object).filter(key =>
        [
          'correctAnswer',
          'correct_answer',
          'answerKey',
          'answer_key'
        ].includes(key)
      );

      return [
        ...sensitiveKeys,
        ...Object.values(object).flatMap(findSensitiveFields)
      ];
    }
    expect(findSensitiveFields(body)).toEqual([]);
  });

});
