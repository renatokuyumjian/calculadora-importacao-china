# Notas de integração e fontes

A plataforma utilizará a AwesomeAPI como integração principal de câmbio USD/BRL, pois a documentação confirma o endpoint `https://economia.awesomeapi.com.br/json/last/USD-BRL` e o retorno com os campos `bid`, `ask`, `timestamp` e `create_date`. A interface manterá fallback manual para o usuário informar a cotação quando houver limite, indisponibilidade, cache ou necessidade de usar taxa negociada em contrato.

A Receita Federal disponibiliza a TIPI em formatos PDF, DOCX e XLSX em página oficial. Como não foi identificado endpoint público simples e estável para consulta transacional de alíquota de IPI por NCM durante a pesquisa inicial, a versão implementada terá uma tabela local editável por NCM e uma rotina de busca por base local. A arquitetura deixa o backend preparado para plugar uma fonte fiscal externa futura quando houver API contratada ou arquivo oficial automatizável.

Para II, a estratégia funcional será semelhante: base local editável com NCM, descrição, alíquota de II e alíquota de IPI, acompanhada de busca textual/código. Isso atende a operação diária com governança, porque o usuário pode revisar e atualizar as alíquotas conforme a classificação fiscal validada pelo despachante ou área tributária.

Fontes consultadas:

[1]: https://docs.awesomeapi.com.br/api-de-moedas "AwesomeAPI — API de Cotações"
[2]: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/tipi-tabela-de-incidencia-do-imposto-sobre-produtos-industrializados "Receita Federal — TIPI"

## Simulador oficial da Receita Federal informado pelo usuário

A página `https://www4.receita.fazenda.gov.br/simulador/` apresenta o **Simulador do Tratamento Tributário e Administrativo das Importações**. A experiência oficial exige três entradas obrigatórias: **código NCM**, **valor aduaneiro estimado** e **moeda**. A própria página informa que o simulador retorna alíquotas ad valorem vigentes, montantes dos tributos calculados com base nos dados fornecidos e controles administrativos vinculados à classificação fiscal da mercadoria. A tela contém hCaptcha, portanto a automação direta do cálculo oficial dentro da aplicação deve ser tratada com cautela; a plataforma pode manter link de comparação e usar bases editáveis/integrações públicas quando disponíveis.


## Checagem funcional final no navegador — 2026-05-11

A aplicação foi aberta no navegador pela URL de desenvolvimento e renderizou a tela principal com estética brutalist tipográfica, título massivo, link ao Simulador da Receita, usuário autenticado, cards de dashboard e formulário editável. A extração da página confirmou a presença dos campos críticos de logística, alíquotas, venda, créditos e container; a busca/edição de NCM apresentou NCM 3307.20.10 com II 18% e IPI 9,75%; o resumo consolidado exibiu FOB convertido, frete internacional, seguro, valor aduaneiro/CIF, AFRMM, capatazia, outros custos, tributos de importação e custo nacionalizado/landed cost. A tela também exibiu tributos discriminados, débitos na venda, créditos aproveitáveis, tributo líquido, aproveitamento de container, resultado líquido, custo médio por NCM, histórico salvo e área de PDFs armazenados. Essa verificação visual complementa a validação automatizada por TypeScript, Vitest e build de produção.
