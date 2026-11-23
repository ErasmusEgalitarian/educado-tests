
import { test, expect } from '@playwright/test';
import {
  authenticatedGet,
  authenticatedRequest,
  canRunMutation
} from '../helpers/api';

test.describe('Autorização de atividades', () => {

  // AT-09: o criador pode editar a propria atividade, mas nao a de outro.
  // Escritas so rodam com os dois opt-ins e API_URL local/staging.
  test('AT-09-P2 - Criador pode editar a própria atividade', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local/staging e ambas as variaveis de mutacao iguais a true.');
    test.skip(!process.env.CREATOR_TOKEN || !process.env.ACTIVITY_ID,
      'SKIP: configure uma atividade existente e pertencente ao criador.');

    const path = `/activities/${process.env.ACTIVITY_ID}`;
    const beforeResponse = await authenticatedGet(request, path, 'creator');
    expect(beforeResponse.status()).toBe(200);

    const before = await beforeResponse.json();
    test.skip(typeof before.question !== 'string',
      'SKIP: a fixture precisa ter campo question textual para ser alterada e restaurada.');

    const originalQuestion = before.question;
    const updatedQuestion = `${originalQuestion} [authz AT-09 ${Date.now()}]`;

    try {
      const updateResponse = await authenticatedRequest(
        request, 'PUT', path, 'creator', { question: updatedQuestion }
      );
      expect(updateResponse.status()).toBe(200);
      expect((await updateResponse.json()).question).toBe(updatedQuestion);

      const updatedRead = await authenticatedGet(request, path, 'creator');
      expect(updatedRead.status()).toBe(200);
      expect((await updatedRead.json()).question).toBe(updatedQuestion);
    } finally {
      const restoreResponse = await authenticatedRequest(
        request, 'PUT', path, 'creator', { question: originalQuestion }
      );
      expect(restoreResponse.status()).toBe(200);

      const afterResponse = await authenticatedGet(request, path, 'creator');
      expect(afterResponse.status()).toBe(200);
      expect((await afterResponse.json()).question).toBe(originalQuestion);
    }
  });

  test('AT-09-N2 - Criador não pode editar atividade de outro (403)', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local/staging e ambas as variaveis de mutacao iguais a true.');
    test.skip(
      !process.env.CREATOR_TOKEN ||
      !process.env.OTHER_CREATOR_TOKEN ||
      !process.env.OTHER_CREATOR_ACTIVITY_ID,
      'SKIP: configure tokens distintos e uma atividade existente do outro criador.'
    );

    const path = `/activities/${process.env.OTHER_CREATOR_ACTIVITY_ID}`;
    const beforeResponse = await authenticatedGet(request, path, 'otherCreator');
    expect(beforeResponse.status()).toBe(200);
    const before = await beforeResponse.json();
    test.skip(typeof before.question !== 'string',
      'SKIP: a atividade do outro criador precisa ter campo question textual.');

    const updateResponse = await authenticatedRequest(
      request,
      'PUT',
      path,
      'creator',
      { question: `${before.question} [unauthorized AT-09 ${Date.now()}]` }
    );

    const afterResponse = await authenticatedGet(request, path, 'otherCreator');
    expect(afterResponse.status()).toBe(200);
    const after = await afterResponse.json();
    const unchanged = JSON.stringify(after) === JSON.stringify(before);

    if (!unchanged) {
      const restoreResponse = await authenticatedRequest(
        request, 'PUT', path, 'otherCreator', { question: before.question }
      );
      expect(restoreResponse.status()).toBe(200);
      expect((await (await authenticatedGet(request, path, 'otherCreator')).json()).question)
        .toBe(before.question);
    }

    expect(updateResponse.status()).toBe(403);
    expect(unchanged).toBe(true);
  });

  // AT-10.1/10.2: leitura negativa apenas. O resultado 404 ainda nao prova
  // isolamento por si; o ID deve existir para que o caso seja conclusivo.
  test('AT-10.1 - Anônimo não acessa atividade privada', async ({ request }) => {
    test.skip(!process.env.ACTIVITY_ID,
      'SKIP: configure ACTIVITY_ID com uma atividade privada conhecida.');

    const response = await request.get(
      `/activities/${process.env.ACTIVITY_ID}`
    );
    expect([401, 403, 404]).toContain(response.status());
    // TODO: confirmar P06 e o recurso existente; sem isso, 404 nao comprova
    // isolacao e o resultado deve ser registrado como bloqueado pela politica.
  });

  test('AT-10.2 - Anônimo não lista atividades de seção privada', async ({ request }) => {
    test.skip(!process.env.SECTION_ID,
      'SKIP: configure SECTION_ID com uma secao privada conhecida.');

    const response = await request.get(
      `/activities/section/${process.env.SECTION_ID}`
    );
    expect([401, 403, 404]).toContain(response.status());
    // TODO: confirmar P06 e a secao existente; 404 isolado nao prova negacao.
  });

  // AT-10.3 NAO IMPLEMENTADO: requer ambiente autorizado e verificacao de
  // ausencia de efeitos no banco apos a tentativa anonima.
  test('AT-10.3 - Anônimo não pode criar atividade', async () => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer staging autorizado e comprovacao de ausencia de efeitos.');
  });

// AT-11 NAO IMPLEMENTADO: leitura administrativa e operacoes positivas estao
// comentadas; confirmar P06 antes de implementar/executar.
//   test('AT-11.1 - Administrador acessa atividade de outro criador', async ({ request }) => {
//     test.skip(!process.env.ADMIN_TOKEN || !process.env.ACTIVITY_ID);

//     const response = await authenticatedGet(
//       request,
//       `/activities/${process.env.ACTIVITY_ID}`,
//       'admin'
//     );

//     expect(response.status()).toBe(200);
//   });

//   // AT-11.2: criacao/edicao/exclusao administrativa; exige fixture descartavel,
//   // verificacao persistida e restauracao.
//   test('AT-11.2 - Administrador gerencia atividade de teste', async () => {
//     test.skip(true,
//       'AVISO: operações administrativas alteram o banco. Requer staging e atividade descartável.');
//   });

});
