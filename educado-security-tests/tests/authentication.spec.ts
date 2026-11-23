
import { test, expect } from '@playwright/test';

test.describe('Autenticação - AT-01 a AT-03', () => {

  // Cobertura parcial: faltam controles positivos autenticados e verificacao
  // dos dados retornados.
  // AT-01: somente leitura
  test('AT-01.1 - Anônimo não acessa /me/profile', async ({ request }) => {
    const response = await request.get('/me/profile');
    console.log('AT-01.1:', response.status(), await response.text());
    expect(response.status()).toBe(401);
  });

  test('AT-01.2 - Anônimo não acessa /student/profile', async ({ request }) => {
    const response = await request.get('/student/profile');
    console.log('AT-01.2:', response.status(), await response.text());

    expect(response.status()).toBe(401);
  });

  // AT-02: POST pode criar dados se houver falha de autenticação.
  // NAO IMPLEMENTADO: requer fixture descartavel e snapshot do banco antes/depois.
  test('AT-02.1 - Anônimo não pode criar cursos', async ({ request }) => {
    test.skip(true,
      'NAO IMPLEMENTADO: requer staging autorizado, curso descartavel e verificacao de ausencia de efeitos.');

    const response = await request.post('/courses', {
      data: {}
    });

    expect(response.status()).toBe(401);
  });

  test('AT-02.2 - Anônimo não pode consultar usuários administrativos', async ({ request }) => {
    const response = await request.get('/admin/users');

    expect(response.status()).toBe(401);
  });

  // AT-03: faltam token expirado e controles positivos com token valido.
  test('AT-03.1 - Token malformado é recusado', async ({ request }) => {
    const response = await request.get('/student/enrollments', {
      headers: {
        Authorization: 'Bearer token-invalido'
      }
    });

    expect(response.status()).toBe(401);
  });

  test('AT-03.2 - Token ausente é recusado', async ({ request }) => {
    const response = await request.get('/student/enrollments');

    expect(response.status()).toBe(401);
  });

});
