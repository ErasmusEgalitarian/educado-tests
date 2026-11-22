# Ambiente reproduzivel de autorizacao

Este ambiente prepara uma instancia local da API e dados sintéticos para as
questões operacionais da issue #26. Ele não aprova P06–P11 e não produz
resultados de testes de autorização.

## Pre-requisitos

- Node.js 20 ou superior
- npm
- Docker Desktop ou Docker Engine com Compose
- PowerShell 7 ou superior
- Repositórios `educado-api` e, opcionalmente, `educado-web` como irmãos de
  `educado-tests`

Estrutura esperada:

```text
Code/
  Testes/
    educado-api/
    educado-tests/
    educado-web/
```

## Configuração

Na pasta `ambiente`, copie `.env.example` para `.env.local` e ajuste apenas se
os diretórios ou portas forem diferentes. O arquivo `.env.local` não deve ser
versionado.

```powershell
Copy-Item .env.example .env.local
.\setup.ps1
.\verify.ps1
```

O setup:

1. cria o `.env` da API a partir do exemplo, caso ainda não exista;
2. instala as dependências da API;
3. sobe PostgreSQL, Redis e MinIO pelo Compose, usando o override
   `docker-compose.minio.override.yml` para uma imagem comunitária OSS
   S3-compatível, com credenciais sintéticas locais;
4. aguarda a infraestrutura;
5. inicia a API local;
6. cria ADM1, U1, U2, A e B;
7. cria C1/C2, suas seções e atividades sintéticas;
8. matricula A em C1 e B em C2;
9. salva IDs reais em `fixtures.local.json`.

Senhas e tokens não são versionados. O arquivo local contém apenas dados de
execução; não copie tokens para relatórios ou evidências públicas.

## Fixture mínima

| Símbolo | Estado |
|---|---|
| U1/U2 | usuários USER independentes |
| ADM1 | usuário ADMIN distinto |
| A/B | estudantes independentes |
| C1/C2 | cursos sintéticos ativos de U1/U2 |
| S1/S2 | seções sintéticas de C1/C2 |
| Q1/Q2 | atividades sintéticas de S1/S2 |
| MP | imagem ACTIVE associada ao curso C1 |
| MNP | imagem ACTIVE criada por U2, não associada a C1/C2 |
| MI | imagem INACTIVE de U1 |

O modelo atual não possui campo `published` em `MediaAsset`. A distinção MP/MNP
segue o recorte operacional da issue #26: MP é a mídia ativa associada a um
curso de U1; MNP é ativa no catálogo de mídias, mas não publicada em curso.
P07 continua pendente para definir o significado e a política do stream público.

Antes da execução, uma cópia de `fixtures.local.json` deve ser registrada com
commit da API, commit da Web, versões de Node/npm/Docker, timestamp e data de
restauração. Evidências devem ser saneadas e não conter tokens ou dados reais.
Use `evidence.example.json` como esquema para registrar setup, versões,
resultado de verificação, bloqueios operacionais e evidências associadas.

## Verificação

`verify.ps1` separa falha de setup de falha de autorização:

- API responde em `/docs`;
- ADM1, U1, U2 e estudantes conseguem autenticar;
- perfis próprios são consultados;
- ADM1 consulta `/admin/registrations`;
- U1 e U2 conseguem criar/consultar seus cursos;
- A e B possuem matrícula somente no curso correspondente;
- o manifesto contém IDs válidos.

Uma falha de conectividade, login, fixture ou consulta obrigatória é bloqueio
operacional, não falha de autorização.

## Limpeza

```powershell
.\reset.ps1
```

O reset derruba os containers e apaga os volumes PostgreSQL/MinIO/Redis, remove
`fixtures.local.json` e a saída de setup. Recrie o ambiente com `setup.ps1`.
Não use esses comandos em ambiente compartilhado, homologação ou produção.

## Limitações conhecidas

- Os dados de mídia, certificado e publicação dependem dos estados aprovados
  pelas políticas P07/P08;
- o modelo institucional depende de P11;
- este ambiente não decide o efeito de mudança de papel sobre sessões (P09);
- o cliente Web é opcional nesta etapa; os casos HTTP devem bater diretamente na
  API;
- o setup HTTP foi exercitado com PowerShell/`Invoke-RestMethod`; Playwright não
  está instalado neste repositório e não foi executado nesta entrega;
- ZAP não está instalado nem foi considerado aplicável para os casos HTTP locais
  repetíveis desta etapa;
- Jest é efetivamente instalado na API por `npm ci`; Vitest está definido no Web,
  mas o Web não participa da verificação HTTP direta deste setup.
