export async function getHtml2Pdf() {
  // @ts-ignore
  if (window.html2pdf) return window.html2pdf;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.integrity = "sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // @ts-ignore
      resolve(window.html2pdf);
    };
    script.onerror = () => {
      reject(new Error("Failed to load html2pdf.js"));
    };
    document.head.appendChild(script);
  });
}
