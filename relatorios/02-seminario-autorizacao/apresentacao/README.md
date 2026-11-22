# Apresentação do seminário

Abra [index.html](index.html) em um navegador. O arquivo contém estilos, conteúdo e navegação; funciona offline, sem instalação ou servidor. Para os links das fontes locais funcionarem, mantenha a pasta dentro do repositório.

São **12 slides**, distribuídos em **seis blocos de 1min40**, totalizando **10 minutos**. A ordem mantém os responsáveis pelos temas da [issue #15](https://github.com/ErasmusEgalitarian/educado-tests/issues/15); o último bloco reúne limitações, conclusão e próximos passos. Os nomes vêm de [equipe.tex](../equipe.tex) e aparecem no rodapé de cada slide e no [roteiro completo](roteiro.md).

| Slides | Bloco | Intervalo |
|---|---|---|
| 1–2 | Abertura e fundamentação | 0:00–1:40 |
| 3–4 | Normas e referências | 1:40–3:20 |
| 5–6 | Técnicas de teste | 3:20–5:00 |
| 7–8 | Ferramentas | 5:00–6:40 |
| 9–10 | Aplicação ao Educado e métricas | 6:40–8:20 |
| 11–12 | Limitações e conclusão | 8:20–10:00 |

## Apresentar e ensaiar

- Use **← / →**, **Page Up / Page Down** ou **Espaço** para navegar. **Home / End** levam ao primeiro ou último slide.
- Use **F** para tela cheia e **N** para consultar as notas de fala. **As notas aparecem na tela compartilhada**: feche o painel antes de projetar e use o roteiro em outro dispositivo se precisar consultá-lo durante a apresentação.
- Use **T** ou **Iniciar** para controlar o cronômetro. Ele não começa automaticamente nem muda os slides. **Zerar** reinicia a contagem.
- O seletor permite ir diretamente a qualquer slide; o endereço `#slide-9`, por exemplo, abre o slide 9.
- Use **Ctrl+P** para imprimir ou salvar em PDF: um slide por página, sem controles ou notas. Ative os gráficos de fundo e desative cabeçalhos e rodapés do navegador, se necessário.
- Ensaie com as transições dentro dos blocos. O alvo é 10 minutos, com margem de dois minutos para mais ou para menos. A duração real depende do ritmo de fala.

## Base do conteúdo

A apresentação resume as fontes do [seminário](../fontes/relatorio.md) incluídas no [PR #22](https://github.com/ErasmusEgalitarian/educado-tests/pull/22), cujo head `dev` estava em `f3a673a57de72c29747faf053d0486d3fbeaa433` na criação desta branch. Cada slide aponta as seções correspondentes.

O conteúdo preserva o caráter de **pesquisa e planejamento**: os 23 casos são futuros, os percentuais são metas e as observações do código são hipóteses. Mantém a previsão de acesso público à mídia ativa e publicada e as pendências sobre certificados e escopo administrativo.

## Editar e gerar

- `conteudo.html`: conteúdo dos slides, notas, índice do integrante em `equipe.tex` (a partir de zero) e duração em segundos.
- `estilo.css`: composição em 16:9, dimensionamento e impressão.
- `navegacao.js`: navegação, atalhos, notas e cronômetro.
- `gerar.py`: incorpora estilos, navegação e nomes da equipe no HTML e gera o roteiro.
- `index.html` e `roteiro.md`: entregas geradas e versionadas; não editar diretamente.

Depois de alterar as fontes, execute na raiz do repositório:

```bash
python3 relatorios/02-seminario-autorizacao/apresentacao/gerar.py
node --check relatorios/02-seminario-autorizacao/apresentacao/navegacao.js
```

A geração usa apenas a biblioteca padrão do Python 3 e verifica o total de 12 slides, 10 minutos e 100 segundos por integrante. Revise visualmente os slides depois de alterar conteúdo ou estilo. Mudanças posteriores em `dev` ou no seminário devem ser refletidas nas fontes da apresentação e regeneradas.
