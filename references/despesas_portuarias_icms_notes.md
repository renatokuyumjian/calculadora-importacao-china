# Despesas portuárias brasileiras e base do ICMS-Importação

## Conclusão operacional

Quando a rubrica **Despesas Portuárias** corresponder a valores pagos no Brasil a terminal, operador portuário, recinto alfandegado, armazém, prestador privado ou agente interveniente, e não a valores recolhidos à Fazenda Nacional por DARF ou débito autorizado no PUCOMEX, a interpretação mais consistente é que esses valores **não compõem a base de cálculo do ICMS-Importação**. Eles continuam compondo o custo nacionalizado/landed cost, mas não devem ser tratados como despesas aduaneiras para fins de numerador do ICMS.

A exceção relevante é quando algum valor classificado internamente como despesa portuária já estiver embutido no valor aduaneiro constante da DI/DUIMP ou corresponder a tributo/taxa/contribuição efetivamente paga à repartição alfandegária até o desembaraço. Nesse caso, ele entra direta ou indiretamente na base.

## Fundamentos encontrados

A Lei Complementar nº 87/1996 inclui, na base do ICMS-Importação, o valor do documento de importação, II, IPI, IOF e quaisquer outros impostos, taxas, contribuições e despesas aduaneiras. No RICMS-SP, o artigo 37, IV, adota a mesma lógica e o § 6º delimita as despesas aduaneiras como aquelas efetivamente pagas à repartição alfandegária até o desembaraço.

A Resposta à Consulta Tributária SP nº 32972/2025 reforça que as despesas aduaneiras que não possuem campo próprio são as efetivamente pagas à repartição alfandegária até o desembaraço, citando como exemplos taxa Siscomex, diferenças de peso, classificação fiscal e multas por infrações.

As Consultas COPAT/SC nº 100/2001 e nº 24/2003 são particularmente úteis porque afirmam expressamente que despesas aduaneiras são apenas as devidas à repartição alfandegária, excluindo despesas pagas a outras entidades, como despesas portuárias. A orientação da Receita Estadual do Rio Grande do Sul, publicada em 2026, segue a mesma linha: valores pagos a operador portuário, recinto alfandegado ou outros agentes intervenientes, quando não recolhidos por DARF ou débito autorizado no PUCOMEX, não se enquadram como despesas aduaneiras e não integram a base do ICMS na importação.

## Aplicação à planilha do usuário

O usuário informou que o valor de **R$ 11.277,80** de Despesas Portuárias foi pago aqui no Brasil. Com essa informação, a planilha da empresa parece correta ao excluir esse valor do cálculo do ICMS-Importação, desde que a rubrica represente serviços portuários/operacionais privados ou valores cobrados por terminal/recinto/operador e não valores recolhidos à Fazenda Nacional.

## Decisão recomendada para a calculadora

A calculadora deve separar **Despesas Portuárias brasileiras** dos **custos aduaneiros que entram no ICMS**. A rubrica deve permanecer no custo nacionalizado e no total de demais custos, mas deve ficar fora do numerador do ICMS por padrão, com aviso técnico de que valores já embutidos no valor aduaneiro ou recolhidos à Fazenda Nacional podem ter tratamento diferente.

## Referências

[1]: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm "Lei Complementar nº 87/1996, art. 13"
[2]: https://legislacao.fazenda.sp.gov.br/Paginas/art037.aspx "RICMS-SP, art. 37"
[3]: https://legislacao.fazenda.sp.gov.br/Paginas/RC32972_2025.aspx "Resposta à Consulta Tributária SP nº 32972/2025"
[4]: https://legislacao.sef.sc.gov.br/html/consultas/2001/con_01_100.htm "Consulta COPAT/SC nº 100/2001"
[5]: https://legislacao.sef.sc.gov.br/html/consultas/2003/con_03_024.htm "Consulta COPAT/SC nº 24/2003"
[6]: https://atendimento.receita.rs.gov.br/da-base-de-calculo-do-icms-na-importacao "Receita Estadual RS - Base de cálculo do ICMS na importação"

## Comparação com a implementação atual

Na implementação atual de `shared/nationalizationBasics.ts`, a rubrica `portExpenses` foi retirada de `totalAduaneiraCostsBrl` e passou a ter total e rateio próprios (`totalPortExpensesBrl` e `allocatedPortExpensesBrl`). Assim, o `icmsNumerator` considera apenas `customsValueBrl + II + IPI + PIS + COFINS + allocatedAduaneiraCostsBrl`, em que `allocatedAduaneiraCostsBrl` representa Siscomex, AFRMM e demais taxas efetivamente pagas à repartição alfandegária, sem incluir Despesas Portuárias brasileiras pagas a terceiros.

Diante da informação do usuário de que o valor de R$ 11.277,80 foi pago no Brasil, a fórmula atual preserva `portExpenses` dentro de `allocatedOtherCostsBrl` e do `landedCostBrl`, mas mantém a rubrica fora do numerador da base de ICMS-Importação quando representar valores pagos a terminal, operador, recinto alfandegado, armazenagem, movimentação ou prestadores privados.
