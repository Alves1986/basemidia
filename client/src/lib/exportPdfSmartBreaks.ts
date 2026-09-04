/**
 * Exportação de PDF sem cortar elementos no meio da página.
 *
 * Problema original: html2canvas tira um screenshot único e gigante do
 * container, e o jsPDF fatia essa imagem em blocos de altura fixa
 * (1 página = N pixels). Como o corte é "cego", ele corta o meio de
 * qualquer elemento que esteja em cima da linha de corte.
 *
 * Solução: em vez de cortar em Y fixo, procuramos a posição de corte
 * "segura" mais próxima — ou seja, um espaço em branco entre elementos,
 * nunca o meio de um elemento. Fazemos isso lendo a posição real (DOM)
 * de cada elemento filho do container ANTES de gerar o canvas.
 *
 * Requisitos:
 *   npm install html2canvas jspdf
 */

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportOptions {
  /** Elemento raiz que será exportado (o "papel" inteiro) */
  element: HTMLElement;
  /** Nome do arquivo final, ex: "briefing-cliente.pdf" */
  fileName: string;
  /**
   * Seletor CSS dos "blocos indivisíveis" — qualquer elemento que
   * NUNCA pode ser cortado ao meio (cards, seções, linhas de tabela,
   * parágrafos, imagens). Ex: ".pdf-block, section, .card, p, img"
   * Se não passar, usamos os filhos diretos + parágrafos/imagens.
   */
  atomicSelector?: string;
  /** Margem em mm nas 4 bordas da página A4. Default 10mm. */
  marginMm?: number;
  /** Escala de renderização do html2canvas (qualidade). Default 2. */
  scale?: number;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export async function exportPdfSmartBreaks({
  element,
  fileName,
  atomicSelector = "p, img, table, tr, li, h1, h2, h3, h4, .pdf-block, .card",
  marginMm = 10,
  scale = 2,
}: ExportOptions) {
  // 1) Renderiza o container inteiro como uma imagem de alta resolução
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
  });

  const canvasWidthPx = canvas.width;
  const canvasHeightPx = canvas.height;

  const usableWidthMm = A4_WIDTH_MM - marginMm * 2;
  const usableHeightMm = A4_HEIGHT_MM - marginMm * 2;

  // Fator: pixels do canvas -> mm reais na página útil
  const pxPerMm = canvasWidthPx / usableWidthMm;
  const usableHeightPx = usableHeightMm * pxPerMm;

  // 2) Pega a posição Y (em px do canvas) de cada elemento "atômico"
  //    que não pode ser cortado. Convertendo de coordenada DOM (CSS px)
  //    para coordenada do canvas usando a mesma escala do html2canvas.
  const rootRect = element.getBoundingClientRect();
  const domToCanvasScale = canvasWidthPx / element.scrollWidth;

  const atoms = Array.from(
    element.querySelectorAll<HTMLElement>(atomicSelector)
  ).map((el) => {
    const rect = el.getBoundingClientRect();
    const top = (rect.top - rootRect.top + element.scrollTop) * domToCanvasScale;
    const bottom = top + rect.height * domToCanvasScale;
    return { top, bottom };
  });

  // 3) Calcula os pontos de corte "seguros": nunca dentro de um átomo
  const cutPoints: number[] = [0];
  let cursor = 0;

  while (cursor < canvasHeightPx) {
    let nextCut = Math.min(cursor + usableHeightPx, canvasHeightPx);

    // Se o corte proposto cai dentro de algum elemento, recua até o
    // início daquele elemento (empurra o elemento inteiro pra próxima página)
    const breaking = atoms.find(
      (a) => a.top < nextCut && a.bottom > nextCut && a.top > cursor
    );

    if (breaking) {
      nextCut = breaking.top;
    }

    // Proteção: se não sobrou espaço nenhum (elemento maior que a página),
    // corta mesmo assim para não travar em loop infinito.
    if (nextCut <= cursor) {
      nextCut = cursor + usableHeightPx;
    }

    cutPoints.push(nextCut);
    cursor = nextCut;
  }

  // 4) Gera o PDF, uma página por fatia
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  for (let i = 0; i < cutPoints.length - 1; i++) {
    const sliceTopPx = cutPoints[i];
    const sliceHeightPx = cutPoints[i + 1] - cutPoints[i];
    if (sliceHeightPx <= 0) continue;

    // Recorta a fatia num canvas temporário
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvasWidthPx;
    sliceCanvas.height = sliceHeightPx;
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.drawImage(
      canvas,
      0,
      sliceTopPx,
      canvasWidthPx,
      sliceHeightPx,
      0,
      0,
      canvasWidthPx,
      sliceHeightPx
    );

    const imgData = sliceCanvas.toDataURL("image/jpeg", 0.95);
    const sliceHeightMm = sliceHeightPx / pxPerMm;

    if (i > 0) pdf.addPage();
    pdf.addImage(
      imgData,
      "JPEG",
      marginMm,
      marginMm,
      usableWidthMm,
      sliceHeightMm
    );
  }

  pdf.save(fileName);
}
