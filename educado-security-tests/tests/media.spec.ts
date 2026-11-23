
import { test, expect } from '@playwright/test';
import { authenticatedGet } from '../helpers/api';

test.describe('Autorização de mídia', () => {

  // Cobertura parcial: confirmar existencia/proprietario do ID e fazer controle
  // positivo do dono antes de interpretar 403/404.
  // AT-17: somente leitura
  test('AT-17.1 - Criador não acessa metadados de mídia alheia', async ({ request }) => {
    test.skip(!process.env.CREATOR_TOKEN || !process.env.MEDIA_ID);

    const response = await authenticatedGet(
      request,
      `/media/images/${process.env.MEDIA_ID}/metadata`,
      'creator'
    );

    expect([403, 404]).toContain(response.status());
  });

  // AT-17.2 NAO IMPLEMENTADO: exige fixture alheia descartavel, snapshot e
  // comprovacao de que registro e objeto permaneceram intactos.
  test('AT-17.2 - Criador não pode excluir mídia alheia', async () => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer staging autorizado e verificacao antes/depois do registro e arquivo.');
  });

  // AT-18: somente leitura, mas pode transferir arquivos.
  test('AT-18.1 - Mídia pública deve permitir stream', async ({ request }) => {
    test.skip(!process.env.PUBLIC_MEDIA_ID);

    const response = await request.get(
      `/media/${process.env.PUBLIC_MEDIA_ID}/stream`
    );

    expect([200, 206]).toContain(response.status());
  });

  test('AT-18.2 - Mídia privada não deve permitir stream anônimo', async ({ request }) => {
    test.skip(true, 'BLOQUEADO: resposta ainda nao foi confirmada.');
    test.skip(!process.env.PRIVATE_MEDIA_ID);

    const response = await request.get(
      `/media/${process.env.PRIVATE_MEDIA_ID}/stream`
    );

    expect([401, 403, 404]).toContain(response.status());
  });

});
