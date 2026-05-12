# Achados iniciais sobre o simulador oficial da Receita Federal

URL consultada: https://www4.receita.fazenda.gov.br/simulador/

A página é o **Simulador do Tratamento Tributário e Administrativo das Importações**. A interface pública exige três entradas principais para a simulação: **código NCM**, **valor aduaneiro estimado da mercadoria** e **moeda correspondente ao valor aduaneiro informado**. A própria página informa que o simulador permite visualizar alíquotas ad-valorem vigentes dos tributos que podem incidir sobre uma importação e o montante desses tributos calculados com base nos dados fornecidos.

A página possui proteção hCaptcha no formulário, portanto a calculadora do projeto não deve depender de automação direta ou scraping operacional do resultado. A implementação deve usar o simulador como referência de validação e experiência, mantendo campos editáveis por item no app para NCM, valor aduaneiro/base e alíquotas fiscais.

Campos visíveis relevantes no formulário oficial:

| Campo | Observação para a implementação |
|---|---|
| Código NCM | Deve continuar existindo por item. |
| Valor Aduaneiro | No app, pode ser representado por FOB em BRL acrescido de custos rateados quando aplicável. |
| Moeda | No app, já existe câmbio e FOB em USD/BRL; podemos exibir a base em BRL. |
| Resultado esperado | Alíquotas e montantes de II, IPI, PIS/COFINS e demais incidências, conforme NCM e base. |

Decisão técnica inicial: implementar **cálculos editáveis e transparentes** no app, com link de referência para o simulador oficial e aviso de validação por NCM, em vez de tentar automatizar consulta no site da Receita.

## Fórmula adotada na calculadora simplificada

Para esta etapa, a calculadora usará o simulador oficial como referência conceitual, mas manterá as alíquotas editáveis no próprio item. Como o formulário oficial pede **valor aduaneiro**, a implementação calculará esse valor por item como **FOB em BRL + frete internacional rateado em BRL**. As despesas que permanecem como custos aduaneiros para a base do ICMS, como Siscomex e AFRMM, serão rateadas separadamente e entrarão no custo nacionalizado e na base de ICMS de importação. As **despesas portuárias brasileiras pagas a terceiros**, as **capatazias nacionais destacadas** e o **frete rodoviário nacional contratado após o desembaraço** serão rateados para compor apenas o custo nacionalizado, sem integrar a base do ICMS-Importação.

| Componente | Fórmula adotada |
|---|---|
| Rateio por item | FOB do item em BRL dividido pelo FOB total em BRL; se não houver FOB, rateio igualitário entre itens. |
| Valor aduaneiro do item | FOB total em BRL do item + frete rateado em BRL. |
| II | Valor aduaneiro × alíquota de II. |
| Base de IPI | Valor aduaneiro + II. |
| IPI | Base de IPI × alíquota de IPI. |
| PIS-Importação | Valor aduaneiro × alíquota de PIS. |
| COFINS-Importação | Valor aduaneiro × alíquota de COFINS. |
| Base de ICMS por dentro | (Valor aduaneiro + II + IPI + PIS + COFINS + custos aduaneiros rateados) ÷ (1 − alíquota de ICMS). Despesas portuárias brasileiras pagas a terceiros, capatazias nacionais destacadas e frete rodoviário nacional pós-desembaraço ficam fora desta base. |
| ICMS-Importação | Base de ICMS × alíquota de ICMS. |
| Total de impostos | II + IPI + PIS + COFINS + ICMS. |
| Custo nacionalizado | Valor aduaneiro + custos aduaneiros rateados + despesas portuárias brasileiras rateadas + capatazias nacionais rateadas + frete rodoviário nacional rateado + total de impostos. |

A interface deve informar que as alíquotas por NCM devem ser conferidas no simulador oficial da Receita Federal, já que o site possui proteção humana e não deve ser automatizado diretamente nesta etapa. Também deve deixar claro que despesas portuárias brasileiras pagas a terminais, operadores, recintos alfandegados ou terceiros privados, capatazias nacionais destacadas e o frete rodoviário Porto → São José do Rio Preto representam custos mantidos no custo nacionalizado, mas não no numerador da base de ICMS-Importação.
