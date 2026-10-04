/* ============================================================
   VOTIX — index.js
   Página inicial: faz as setas ‹ › do carrossel de banners funcionarem.
   (O HTML chama sl(-1) na seta esquerda e sl(1) na direita.)
   ============================================================ */

// Rola o carrossel um banner para o lado.
// direcao: -1 = volta um banner | 1 = avança um banner
function sl(direcao) {
  const carrossel = document.getElementById('car');
  const larguraDoBanner = carrossel.firstElementChild.offsetWidth + 16;   // largura + 16px de espaço entre banners
  carrossel.scrollBy({ left: direcao * larguraDoBanner });
}
