
import type { APIRequestContext } from '@playwright/test';

export function getToken(role: string): string | undefined {
  const tokens: Record<string, string | undefined> = {
    creator: process.env.CREATOR_TOKEN,
    otherCreator: process.env.OTHER_CREATOR_TOKEN,
    admin: process.env.ADMIN_TOKEN,
    studentA: process.env.STUDENT_A_TOKEN,
    studentB: process.env.STUDENT_B_TOKEN
  };

  return tokens[role];
}

export function requireToken(role: string): string {
  const token = getToken(role);

  if (!token) {
    throw new Error(`Token não configurado: ${role}`);
  }

  return token;
}

export async function authenticatedGet(
  request: APIRequestContext,
  path: string,
  role: string
) {
  return request.get(path, {
    headers: {
      Authorization: `Bearer ${requireToken(role)}`
    }
  });
}

export async function authenticatedRequest(
  request: APIRequestContext,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  role: string,
  data?: object
) {
  return request.fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${requireToken(role)}`,
      'Content-Type': 'application/json'
    },
    data
  });
}

/**
 * BLOQUEIO DE SEGURANÇA:
 * Operações que alteram dados só podem ser habilitadas
 * em staging ou localhost.
 */
export function canRunMutation(): boolean {
  const url = process.env.API_URL ?? '';

  const allowedEnvironment =
    url.includes('staging') ||
    url.includes('localhost') ||
    url.includes('127.0.0.1');

  return (
    allowedEnvironment &&
    process.env.RUN_MUTATION_TESTS === 'true' &&
    process.env.ALLOW_MUTATIONS === 'true'
  );
}

/**
 * Não permite executar teste de escrita sem autorização explícita.
 */
export function requireMutationEnvironment(): void {
  if (!canRunMutation()) {
    throw new Error(
      'OPERAÇÃO BLOQUEADA: este teste pode modificar o banco. ' +
      'Utilize staging, dados descartáveis e autorização explícita.'
    );
  }
}
