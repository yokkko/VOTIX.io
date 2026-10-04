/* ============================================================
   VOTIX — carrinho.js
   PÁGINA DO CARRINHO: mostra os itens, muda quantidades, remove,
   calcula frete (CEP), aplica cupom e "finaliza" a compra.

   Os itens ficam guardados no navegador (localStorage), pelo objeto
   Cart do core.js. Cada item tem: id, n (nome), p (preço) e q (quantidade).

   Este arquivo usa funções do core.js: Cart, fmt() e badge().
   ============================================================ */

// Atalho: $('cep') = document.getElementById('cep')
const $ = id => document.getElementById(id);

// Cupons válidos: código -> desconto (0.1 = 10%). Para criar um cupom novo, adicione uma linha aqui.
const CUP = { MUNDOGAMER: .1, BEMVINDO: .05 };

let cupom = '';   // cupom aplicado no momento ('' = nenhum)
let ok = false;   // o cliente clicou em "Calcular" com um CEP válido?


/* ------------------------------------------------------------
   RESUMO DO PEDIDO (caixa da direita)
   Recalcula e escreve: Produtos, Desconto, Frete e Total.
   ------------------------------------------------------------ */
function sum() {
  const c = Cart.get();
  const sub = c.reduce((a, i) => a + i.p * i.q, 0);         // subtotal = soma de (preço × quantidade)
  const d = sub * (CUP[cupom] || 0);                         // desconto do cupom (0 se não houver)
  const base = sub - d;                                      // valor depois do desconto
  const cepOk = $('cep').value.length == 9;                  // CEP preenchido por completo (00000-000)?

  // Frete: compras a partir de R$ 500 = grátis (0) | senão R$ 24,90 (se o CEP foi calculado) | senão null (não sabemos ainda)
  const fr = base >= 500 ? 0 : (ok && cepOk ? 24.9 : null);
  const tot = base + (fr || 0);                              // total a pagar

  $('vSub').textContent = 'R$ ' + fmt(sub);
  $('rDesc').hidden = !d;                                    // linha "Desconto" só aparece se houver desconto
  $('vDesc').textContent = '− R$ ' + fmt(d);
  $('vFr').textContent = fr === 0 ? 'Grátis' : fr ? 'R$ ' + fmt(fr) : 'Informe o CEP';
  $('vTot').textContent = 'R$ ' + fmt(tot);
  $('vPix').textContent = 'No PIX: R$ ' + fmt(tot * .95) + ' (5% off)';   // 5% de desconto no PIX
}


/* ------------------------------------------------------------
   DESENHAR O CARRINHO
   Mostra a lista de itens, ou a mensagem de "carrinho vazio".
   ------------------------------------------------------------ */
function draw() {
  const c = Cart.get();
  badge();                                                   // atualiza o número ao lado de "Carrinho"

  // --- Carrinho vazio: esconde título e resumo e mostra o aviso ---
  if (!c.length) {
    $('h').hidden = $('cl').hidden = true;
    if (!$('vz')) {                                          // cria o aviso só uma vez
      const v = document.createElement('div');
      v.id = 'vz';
      v.className = 'vz';
      v.innerHTML = '<h1>Seu carrinho está vazio</h1><p>Adicione produtos para ver o resumo do pedido.</p><a href="promocoes.html">Ver promoções</a>';
      $('m').appendChild(v);
    }
    return;
  }

  // --- Título: "Carrinho (3 itens)" ---
  $('h').textContent = `Carrinho (${Cart.count()} ${Cart.count() == 1 ? 'item' : 'itens'})`;

  // --- Um bloco para cada item ---
  // O link do nome leva à página do produto: produtos/<categoria>/<id>.html
  // (a categoria é o id sem o número final: "notebooks-18" -> "notebooks")
  $('lista').innerHTML = c.map(i => `
    <div class="it">
      <div class="th"></div>
      <div>
        <a href="produtos/${i.id.replace(/-\d+$/, '')}/${i.id}.html">${i.n}</a>
        <div class="u">R$ ${fmt(i.p)} cada</div>
        <button class="rm" data-rm="${i.id}">Remover</button>
      </div>
      <div class="rt">
        <div class="qty">
          <button data-dec="${i.id}" aria-label="Diminuir">−</button>
          <span>${i.q}</span>
          <button data-inc="${i.id}" aria-label="Aumentar">+</button>
        </div>
        <b>R$ ${fmt(i.p * i.q)}</b>
      </div>
    </div>`).join('');

  sum();   // atualiza o resumo
}


/* ------------------------------------------------------------
   EVENTOS
   ------------------------------------------------------------ */

// Cliques na lista: Remover, "−" e "+".
// Cada botão guarda o id do item em data-rm / data-dec / data-inc.
$('lista').addEventListener('click', e => {
  const botao = e.target.closest('button');
  if (!botao) return;                                        // clicou fora de um botão: ignora

  const d = botao.dataset;
  let c = Cart.get();
  const id = d.rm || d.inc || d.dec;                         // qual item?
  const i = c.find(x => x.id == id);
  if (!i) return;

  if (d.rm) c = c.filter(x => x != i);                       // Remover: tira o item da lista
  if (d.inc) i.q++;                                          // "+": uma unidade a mais
  if (d.dec && --i.q < 1) c = c.filter(x => x != i);         // "−": uma a menos; se chegar a zero, remove o item

  Cart.set(c);   // salva
  draw();        // redesenha
});

// Campo de CEP: só números (máx. 8) com hífen. Mudou o CEP? Precisa calcular o frete de novo (ok = false).
$('cep').addEventListener('input', e => {
  const numeros = e.target.value.replace(/\D/g, '').slice(0, 8);
  e.target.value = numeros.replace(/(\d{5})(\d)/, '$1-$2');
  ok = false;
  sum();
});

// Botão "Calcular" (CEP)
$('bcep').onclick = () => {
  ok = $('cep').value.length == 9;
  $('msg').textContent = ok ? 'Frete calculado para o seu CEP.' : 'Informe um CEP com 8 dígitos.';
  sum();
};

// Botão "Aplicar" (cupom): aceita letras maiúsculas ou minúsculas
$('bcup').onclick = () => {
  const codigo = $('cup').value.trim().toUpperCase();
  cupom = CUP[codigo] ? codigo : '';                         // cupom existe? guarda. Senão, limpa.
  $('msg').textContent = cupom
    ? `Cupom ${codigo} aplicado: ${CUP[codigo] * 100}% de desconto.`
    : 'Cupom inválido.';
  sum();
};

// Botão "Finalizar compra"
$('fin').onclick = () => {
  const total = Cart.get().reduce((a, i) => a + i.p * i.q, 0) * (1 - (CUP[cupom] || 0));

  // Abaixo de R$ 500 o frete é cobrado, então precisa do CEP calculado antes de finalizar
  if (total < 500 && !ok) {
    $('msg').textContent = 'Calcule o frete com seu CEP para continuar.';
    $('cep').focus();
    return;
  }

  // Esvazia o carrinho e mostra a mensagem final (loja de demonstração: nada é cobrado de verdade)
  Cart.set([]);
  badge();
  $('m').innerHTML = '<div class="vz"><h1 style="color:#19a35a">Pedido realizado</h1><p>Esta é uma loja de demonstração: nenhum pagamento foi feito.</p><a href="index.html">Voltar à loja</a></div>';
};


/* ------------------------------------------------------------
   PRIMEIRO DESENHO
   ------------------------------------------------------------ */
draw();
