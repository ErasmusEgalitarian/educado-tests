
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  authenticatedGet,
  authenticatedRequest,
  canRunMutation
} from '../helpers/api';

test.describe('Autorização de atividades', () => {

  // AT-09: o criador pode editar a propria atividade, mas nao a de outro.
  // Escritas só rodam com os dois opt-ins e API_URL local.
  test('AT-09-P2 - Criador pode editar a própria atividade', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local e ambas as variaveis de mutacao iguais a true.');
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
      'SKIP: requer API local e ambas as variaveis de mutacao iguais a true.');
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

  // Conteúdo publicado pode ser público; estas fixtures devem ser não publicadas.
  test('AT-10.1 - Anônimo não acessa atividade não publicada', async ({ request }) => {
    test.skip(!process.env.ACTIVITY_ID || !process.env.ADMIN_TOKEN,
      'SKIP: configure atividade não publicada e token admin para validar a fixture.');

    const adminResponse = await authenticatedGet(
      request, `/activities/${process.env.ACTIVITY_ID}`, 'admin'
    );
    expect(adminResponse.status()).toBe(200);
    expect((await adminResponse.json()).id).toBe(process.env.ACTIVITY_ID);

    const response = await request.get(
      `/activities/${process.env.ACTIVITY_ID}`
    );
    expect([401, 403, 404]).toContain(response.status());
  });

  test('AT-10.2 - Anônimo não lista atividades de seção não publicada', async ({ request }) => {
    test.skip(!process.env.SECTION_ID || !process.env.ADMIN_TOKEN,
      'SKIP: configure seção não publicada e token admin para validar a fixture.');

    const adminResponse = await authenticatedGet(
      request, `/activities/section/${process.env.SECTION_ID}`, 'admin'
    );
    expect(adminResponse.status()).toBe(200);
    const adminActivities = await adminResponse.json();
    expect(Array.isArray(adminActivities)).toBe(true);
    expect(adminActivities.length).toBeGreaterThan(0);

    const response = await request.get(
      `/activities/section/${process.env.SECTION_ID}`
    );
    expect([401, 403, 404]).toContain(response.status());
  });

  test('AT-10.3 - Anônimo não pode criar atividade', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local e ambos os opt-ins de mutacao.');
    test.skip(!process.env.ANON_CREATE_SECTION_ID || !process.env.ADMIN_TOKEN,
      'SKIP: requer secao sintetica e token admin para verificar/limpar fixture.');

    const id = randomUUID();
    const path = `/activities/${id}`;
    expect((await authenticatedGet(request, path, 'admin')).status()).toBe(404);

    const response = await request.post('/activities', {
      data: {
        id,
        sectionId: process.env.ANON_CREATE_SECTION_ID,
        type: 'true_false',
        order: 0,
        question: 'Synthetic anonymous authorization check',
        options: ['True', 'False'],
        correctAnswer: true
      }
    });

    let after = await authenticatedGet(request, path, 'admin');
    if (after.status() === 200) {
      const cleanup = await authenticatedRequest(request, 'DELETE', path, 'admin');
      expect(cleanup.status()).toBe(204);
      after = await authenticatedGet(request, path, 'admin');
    }

    expect(response.status()).toBe(401);
    expect(after.status()).toBe(404);
  });

  test('AT-11-C1 - Administrador cria atividade em curso de outro autor', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local e ambos os opt-ins de mutacao.');
    test.skip(!process.env.ADMIN_TOKEN || !process.env.OTHER_CREATOR_SECTION_ID,
      'SKIP: configure token admin e secao descartavel de outro autor.');

    const id = randomUUID();
    const path = `/activities/${id}`;
    expect((await authenticatedGet(request, path, 'admin')).status()).toBe(404);

    const response = await authenticatedRequest(request, 'POST', '/activities', 'admin', {
      id,
      sectionId: process.env.OTHER_CREATOR_SECTION_ID,
      type: 'true_false',
      order: 0,
      question: 'Synthetic admin authorization check',
      options: ['True', 'False'],
      correctAnswer: true
    });

    try {
      expect(response.status()).toBe(201);
      const created = await authenticatedGet(request, path, 'admin');
      expect(created.status()).toBe(200);
      expect((await created.json()).sectionId).toBe(process.env.OTHER_CREATOR_SECTION_ID);
    } finally {
      const cleanup = await authenticatedRequest(request, 'DELETE', path, 'admin');
      expect([204, 404]).toContain(cleanup.status());
    }
  });

  test('AT-11-C2 - Administrador edita atividade de outro autor', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local e ambos os opt-ins de mutacao.');
    test.skip(!process.env.ADMIN_TOKEN || !process.env.OTHER_CREATOR_ACTIVITY_ID,
      'SKIP: configure token admin e atividade existente de outro autor.');

    const path = `/activities/${process.env.OTHER_CREATOR_ACTIVITY_ID}`;
    const beforeResponse = await authenticatedGet(request, path, 'admin');
    expect(beforeResponse.status()).toBe(200);
    const before = await beforeResponse.json();
    test.skip(typeof before.question !== 'string',
      'SKIP: a fixture precisa ter campo question textual para ser restaurada.');

    try {
      const update = await authenticatedRequest(
        request, 'PUT', path, 'admin', { question: `${before.question} [admin test]` }
      );
      expect(update.status()).toBe(200);
    } finally {
      const restore = await authenticatedRequest(
        request, 'PUT', path, 'admin', { question: before.question }
      );
      expect(restore.status()).toBe(200);
      expect((await (await authenticatedGet(request, path, 'admin')).json()).question)
        .toBe(before.question);
    }
  });

  test('AT-11-C3 - Administrador exclui atividade sintética de outro autor', async ({ request }) => {
    test.skip(!canRunMutation(),
      'SKIP: requer API local e ambos os opt-ins de mutacao.');
    test.skip(!process.env.ADMIN_TOKEN || !process.env.OTHER_CREATOR_SECTION_ID,
      'SKIP: configure token admin e secao descartavel de outro autor.');

    const id = randomUUID();
    const path = `/activities/${id}`;
    const create = await authenticatedRequest(request, 'POST', '/activities', 'admin', {
      id,
      sectionId: process.env.OTHER_CREATOR_SECTION_ID,
      type: 'true_false',
      order: 0,
      question: 'Synthetic activity for admin delete authorization',
      options: ['True', 'False'],
      correctAnswer: true
    });
    expect(create.status()).toBe(201);

    const deletion = await authenticatedRequest(request, 'DELETE', path, 'admin');
    expect(deletion.status()).toBe(204);
    expect((await authenticatedGet(request, path, 'admin')).status()).toBe(404);
  });

});
