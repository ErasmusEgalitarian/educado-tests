
import { test, expect } from '@playwright/test';
import { authenticatedGet } from '../helpers/api';

test.describe('Autorização de cursos', () => {

  // Cobertura parcial: confirmar existencia/proprietario das fixtures e fazer
  // controle positivo do dono antes de aceitar 403/404 para o outro ator.
  // AT-06: somente leitura
  test('AT-06 - Criador não acessa curso de outro proprietário', async ({ request }) => {
    test.skip(
      !process.env.CREATOR_TOKEN || !process.env.OTHER_CREATOR_COURSE_ID
    );

    const response = await authenticatedGet(
      request,
      `/courses/${process.env.OTHER_CREATOR_COURSE_ID}`,
      'creator'
    );

    expect([403, 404]).toContain(response.status());
  });

  // AT-07 NAO IMPLEMENTADO: exige fixture alheia existente, snapshot e restauracao.
  test('AT-07 - Criador não pode editar ou excluir curso alheio', async () => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer staging autorizado e verificacao/restauracao do curso sintetico.');
  });

  // AT-08 NAO IMPLEMENTADO: verificar no banco que ownerId/role nao foram aceitos,
  // executar controle positivo e remover o curso sintetico.
  test('AT-08 - Criador não pode definir ownerId ou role privilegiados', async () => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer staging autorizado, verificacao persistida e limpeza da fixture.');
  });

  // AT-21: os asserts abaixo ainda precisam validar IDs/proprietario e paginacao,
  // nao apenas que a rota respondeu 200.
  test('AT-21 - Criador consulta seus próprios cursos', async ({ request }) => {
    test.skip(!process.env.CREATOR_TOKEN);

    const response = await authenticatedGet(
      request, '/me/courses', 'creator'
    );

    expect(response.status()).toBe(200);
  });

  test('AT-21.2 - Criador consulta suas próprias mídias', async ({ request }) => {
    test.skip(!process.env.CREATOR_TOKEN);

    const response = await authenticatedGet(
      request, '/me/media', 'creator'
    );

    expect(response.status()).toBe(200);
  });

});
