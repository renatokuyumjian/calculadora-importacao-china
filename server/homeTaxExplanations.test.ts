import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../client/src/pages/Home";

describe("Home tax explanations", () => {
  it("renderiza explicações de base, fórmula e justificativa para impostos de importação", () => {
    const html = renderToString(React.createElement(Home));

    expect(html).toContain("Como este valor foi calculado");
    expect(html).toContain("Base usada");
    expect(html).toContain("Fórmula aplicada");
    expect(html).toContain("Por que é feito assim");
    expect(html).toContain("II = valor aduaneiro × alíquota de II");
    expect(html).toContain("Base ICMS =");
    expect(html).toContain("O ICMS-Importação é tratado por dentro nesta simulação");
    expect(html).toContain("despesas portuárias brasileiras pagas a terceiros");
    expect(html).toContain("capatazias nacionais destacadas");
    expect(html).toContain("frete rodoviário pós-desembaraço");
    expect(html).toContain("ficam fora desta base");
  });
});
