/* ============================================================
   VOTIX — produto.js
   Faz funcionar os botões da PÁGINA DE PRODUTO:
   comprar, adicionar ao carrinho, favoritar, compartilhar,
   descrição/ficha técnica, parcelamento e cálculo de frete.

   De onde vem o produto? Cada página de produto define, logo antes
   deste arquivo, uma linha assim:
       const P = {"id": "notebooks-18", "n": "Nome do produto", "p": 4058.9};
   id = código | n = nome | p = preço.

   Este arquivo usa funções do core.js: Cart, fmt(), badge(), toast() e BASE.
   ============================================================ */

// Atalho: $('add') = document.getElementById('add')
const $ = id => document.getElementById(id);


/* ------------------------------------------------------------
   COMPRA
   ------------------------------------------------------------ */

// Botão "Adicionar ao carrinho": põe o produto no carrinho, atualiza o número no
// cabeçalho e mostra um aviso verde por um instante.
$('add').onclick = () => {
  Cart.add(P);
  badge();
  toast('Adicionado ao carrinho');
};

// Botão "Comprar agora": põe o produto no carrinho e já abre a página do carrinho.
// (BASE = caminho até a raiz do site; necessário porque esta página fica em produtos/<categoria>/)
$('buy').onclick = () => {
  Cart.add(P);
  location.href = BASE + 'carrinho.html';
};


/* ------------------------------------------------------------
   ÍCONES DO TOPO DO CARTÃO (favoritar e compartilhar)
   ------------------------------------------------------------ */

// Coração: liga/desliga a classe "on" (que deixa o coração laranja)
$('fav').onclick = e => {
  const botao = e.currentTarget;
  botao.classList.toggle('on');
  botao.setAttribute('aria-pressed', botao.classList.contains('on'));   // informa leitores de tela
};

// Compartilhar: copia o endereço da página. Se o navegador não deixar, pede para copiar à mão.
$('shr').onclick = () => {
  try {
    navigator.clipboard.writeText(location.href);
    toast('Link copiado');
  } catch (e) {
    toast('Copie o endereço da página');
  }
};


/* ------------------------------------------------------------
   "VER DESCRIÇÃO" e "VER INFORMAÇÕES TÉCNICAS"
   Cada botão tem data-pn="d" ou "t", que é o id do painel que ele abre.
   Clicar mostra o painel (e esconde o outro); clicar de novo no mesmo fecha.
   ------------------------------------------------------------ */
document.querySelectorAll('[data-pn]').forEach(botao =>
  botao.onclick = () => {
    const painel = $(botao.dataset.pn);
    const vaiAbrir = !painel.classList.contains('on');                      // estava fechado?
    document.querySelectorAll('.pn').forEach(x => x.classList.remove('on'));  // fecha todos
    if (vaiAbrir) painel.classList.add('on');                                // abre só o clicado
  }
);


/* ------------------------------------------------------------
   PARCELAMENTO
   "Ver detalhes do parcelamento": lista de 1x até 10x sem juros (preço ÷ nº de parcelas).
   ------------------------------------------------------------ */
$('vpar').onclick = () => {
  const caixa = $('par');
  caixa.innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<div>${i + 1}x de R$ ${fmt(P.p / (i + 1))} sem juros</div>`
  ).join('');
  caixa.hidden = !caixa.hidden;     // mostra/esconde a lista
};


/* ------------------------------------------------------------
   FRETE (CEP)
   ------------------------------------------------------------ */

// "Inserir CEP": mostra/esconde o campo de CEP
$('icep').onclick = () => $('cf').classList.toggle('on');

// Enquanto digita: deixa só números (máximo 8) e coloca o hífen -> 01310-100
$('cin').oninput = e => {
  const numeros = e.target.value.replace(/\D/g, '').slice(0, 8);
  e.target.value = numeros.replace(/(\d{5})(\d)/, '$1-$2');
};

// "Calcular": com CEP completo (9 caracteres, contando o hífen), mostra o frete.
// Produto a partir de R$ 500 tem frete grátis; abaixo disso, R$ 24,90.
$('cok').onclick = () => {
  const cepCompleto = $('cin').value.length == 9;
  $('fr').textContent = cepCompleto
    ? (P.p >= 500
        ? 'Frete grátis. Receba em até 5 dias úteis.'
        : 'Frete de R$ 24,90. Receba em até 5 dias úteis.')
    : 'Informe um CEP com 8 dígitos.';
};
