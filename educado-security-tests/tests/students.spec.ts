
import { test, expect } from '@playwright/test';
import { authenticatedGet } from '../helpers/api';

test.describe('Isolamento de estudantes', () => {

  // Cobertura parcial: confirmar existencia das fixtures A/B e validar os IDs
  // retornados, nao somente o status HTTP.

  // AT-12 NAO IMPLEMENTADO: verificar campos persistidos antes/depois e restaurar A.
//   test('AT-12 - Estudante não altera perfil de outro usuário', async () => {
//     test.skip(true,
//       'AVISO: PUT/PATCH de perfil modifica dados pessoais. Requer staging e contas descartáveis.');
//   });

  // AT-13: somente leitura
  test('AT-13 - Estudante A consulta suas matrículas', async ({ request }) => {
    test.skip(!process.env.STUDENT_A_TOKEN);

    const response = await authenticatedGet(
      request, '/student/enrollments', 'studentA'
    );

    expect(response.status()).toBe(200);
    // TODO: provar que a resposta contem somente matriculas do estudante A.
  });

  // AT-14: somente leitura
  test('AT-14 - Estudante A não acessa progresso exclusivo de B', async ({ request }) => {
    test.skip(
      !process.env.STUDENT_A_TOKEN ||
      !process.env.STUDENT_B_COURSE_ID
    );

    const response = await authenticatedGet(
      request,
      `/student/progress/courses/${process.env.STUDENT_B_COURSE_ID}`,
      'studentA'
    );

    expect([403, 404]).toContain(response.status());
    // TODO: fazer o controle positivo como B e confirmar que o curso B existia;
    // caso contrario, 404 pode indicar apenas fixture ausente.
  });

  // AT-15: somente leitura
  test('AT-15 - Estudante A não acessa certificado de B', async ({ request }) => {
    test.skip(
      !process.env.STUDENT_A_TOKEN ||
      !process.env.STUDENT_B_CERTIFICATE_ID
    );

    const response = await authenticatedGet(
      request,
      `/student/certificates/${process.env.STUDENT_B_CERTIFICATE_ID}/pdf`,
      'studentA'
    );

    expect([403, 404]).toContain(response.status());
    // TODO: confirmar que o certificado e o PDF de B existem antes da tentativa;
    // um 404 por objeto ausente nao comprova isolamento.
  });

  // AT-16: somente leitura
  test('AT-16 - Estudante B consulta seus certificados', async ({ request }) => {
    test.skip(!process.env.STUDENT_B_TOKEN);

    const response = await authenticatedGet(
      request, '/student/certificates', 'studentB'
    );

    expect(response.status()).toBe(200);
    // TODO: validar que nenhum certificado de outro estudante foi retornado.
  });

});
