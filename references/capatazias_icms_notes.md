# Notas de pesquisa: capatazias na base do ICMS-Importação

## Fontes consultadas

1. Lei Complementar nº 87/1996, art. 13, V, no site do Planalto: a base do ICMS na importação é a soma do valor constante dos documentos de importação, II, IPI, IOF e quaisquer outros impostos, taxas, contribuições e despesas aduaneiras.
2. RICMS-SP, art. 37, IV e § 6º, no site da Secretaria da Fazenda de São Paulo: define a base estadual de forma semelhante e restringe “demais despesas aduaneiras” às efetivamente pagas à repartição alfandegária até o desembaraço da mercadoria, com exemplos como diferenças de peso, classificação fiscal e multas.
3. Resposta à Consulta Tributária SP nº 25936/2022: conclui que a despesa com capatazia incorrida em território nacional, quando de fato excluída do valor aduaneiro constante da Declaração de Importação, não compõe a base de cálculo do ICMS na importação.
4. Resposta à Consulta Tributária SP nº 28647/2023: reafirma a conclusão de 2022 para capatazia cobrada pelo porto de destino, com base no Decreto Federal nº 11.090/2022 e na exclusão da capatazia nacional do valor aduaneiro.
5. Governo Federal sobre o Decreto nº 11.090/2022: registra a exclusão do custo de capatazia realizada em território nacional da base do imposto de importação/valor aduaneiro.

## Síntese preliminar

A regra geral do ICMS-Importação inclui despesas aduaneiras. Contudo, para São Paulo, há entendimento oficial recente de que capatazia incorrida no território nacional e excluída do valor aduaneiro da DI não integra a base do ICMS-Importação. Assim, a planilha da empresa faz sentido se a capatazia em questão for a capatazia nacional/porto de destino e se ela não estiver no valor aduaneiro da DI. Se a rubrica estiver embutida no valor aduaneiro ou corresponder a custo anterior/internacional incluído no transporte até o local de importação, a exclusão pode não se aplicar automaticamente.

## Comparação com a implementação anterior

Antes da correção fiscal, `capatazias` estava agrupada dentro de `totalAduaneiraCostsBrl` junto com `portExpenses`, `siscomex` e `afrmm`. Esse total era rateado como `allocatedAduaneiraCostsBrl` e entrava no numerador do ICMS em `icmsNumerator = customsValueBrl + II + IPI + PIS + COFINS + allocatedAduaneiraCostsBrl`. Portanto, a implementação anterior incluía capatazias na base do ICMS-Importação.

Diante das fontes oficiais de São Paulo, a implementação foi revista para refletir a regra de que capatazia nacional/porto de destino, de fato excluída do valor aduaneiro da DI/DUIMP, não compõe a base do ICMS. A solução mais segura não é excluir qualquer capatazia em qualquer situação, mas tratar a rubrica da interface como “capatazia nacional excluída do valor aduaneiro” por padrão, com explicação técnica ao usuário.

## Decisão implementada

A calculadora passou a tratar `capatazias` como custo nacional destacado fora da base do ICMS-Importação. Na prática, a rubrica continua sendo rateada entre os produtos e somada ao custo nacionalizado, mas não integra `allocatedAduaneiraCostsBrl`, que agora representa apenas as despesas aduaneiras mantidas no numerador do ICMS, como Siscomex, AFRMM e taxas efetivamente pagas à repartição alfandegária. A interface deve explicar que essa regra pressupõe capatazia nacional/porto de destino destacada e não embutida no valor aduaneiro da DI/DUIMP.
