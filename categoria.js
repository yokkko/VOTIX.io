/* ============================================================
   VOTIX — categoria.js
   Monta as PÁGINAS DE CATEGORIA (promocoes.html, notebooks.html, ...):
   lista de produtos, filtros, ordenação, paginação, favoritar e
   "adicionar ao carrinho".

   Como funciona, em resumo:
     1. Descobre a categoria pelo <body data-cat="...">.
     2. Gera a lista de produtos (40 por categoria) a partir dos dados abaixo.
     3. Desenha a página inteira dentro de <main id="app">.
     4. Cada vez que o cliente mexe num filtro, chama desenhar() de novo.

   Este arquivo usa funções do core.js: Cart, fmt(), badge() e toast().
   ============================================================ */


/* ------------------------------------------------------------
   1. DADOS DAS CATEGORIAS
   Para cada categoria:
     t      = título exibido
     tipos  = tipos de produto
     marcas = marcas disponíveis
     specs  = variações (memória, versão...)
     min/max= faixa de preço usada para gerar os preços
   São 5 tipos × 4 marcas × 2 variações = 40 produtos por categoria.
   (Para trocar nomes/marcas/preços, é só editar aqui.)
   ------------------------------------------------------------ */
const CATS = {
  'promocoes': {
    t: 'Promoções',
    tipos: ['Notebook', 'Monitor', 'Teclado', 'SSD', 'Headset'],
    marcas: ['Acer', 'Logitech', 'Kingston', 'Samsung'],
    specs: ['Edição Oferta', 'Pro'],
    min: 89, max: 4200
  },
  'notebooks': {
    t: 'Notebooks',
    tipos: ['Notebook Core i5', 'Notebook Ryzen 5', 'Notebook Core i7', 'Notebook Gamer', 'Notebook Ultrafino'],
    marcas: ['Acer', 'Lenovo', 'Dell', 'Asus'],
    specs: ['8GB, SSD 256GB', '16GB, SSD 512GB'],
    min: 2100, max: 9800
  },
  'monitores': {
    t: 'Monitores',
    tipos: ['Monitor 24"', 'Monitor 27"', 'Monitor Gamer 144Hz', 'Monitor Curvo 34"', 'Monitor Portátil'],
    marcas: ['LG', 'Samsung', 'AOC', 'Dell'],
    specs: ['Full HD', 'QHD'],
    min: 520, max: 4300
  },
  'placas-de-video': {
    t: 'Placas de Vídeo',
    tipos: ['Placa de Vídeo RTX 4060', 'Placa de Vídeo RX 7600', 'Placa de Vídeo GTX 1650', 'Placa de Vídeo RTX 4070', 'Placa de Vídeo RX 6600'],
    marcas: ['Gigabyte', 'Asus', 'MSI', 'PCYes'],
    specs: ['8GB GDDR6', '12GB GDDR6'],
    min: 980, max: 6200
  },
  'perifericos': {
    t: 'Periféricos',
    tipos: ['Mouse Gamer', 'Teclado Mecânico', 'Headset Gamer', 'Webcam Full HD', 'Mousepad Extra Grande'],
    marcas: ['Logitech', 'Redragon', 'HyperX', 'Razer'],
    specs: ['RGB', 'Sem Fio'],
    min: 39, max: 890
  },
  'mundo-gamer': {
    t: 'Mundo Gamer',
    tipos: ['Console Portátil', 'Controle Sem Fio', 'Cadeira Gamer', 'Volante com Pedais', 'Headset Gamer 7.1'],
    marcas: ['Sony', 'Microsoft', 'Logitech', 'Thunderx3'],
    specs: ['Edição Padrão', 'Edição Especial'],
    min: 149, max: 3900
  },
  'computadores': {
    t: 'Computadores',
    tipos: ['Computador Intel Core i5', 'Computador Ryzen 5', 'PC Gamer Ryzen 7', 'Computador Desktop Core i3', 'Mini PC Core i7'],
    marcas: ['Alphapc', 'Megaview', 'Concórdia', 'Pichau'],
    specs: ['8GB, SSD 240GB', '16GB, SSD 512GB'],
    min: 740, max: 4820
  }
};


/* ------------------------------------------------------------
   2. QUAL CATEGORIA ESTAMOS MOSTRANDO?
   ------------------------------------------------------------ */
const slug = document.body.dataset.cat;      // ex.: "notebooks" (vem do <body data-cat="notebooks">)
const categoria = CATS[slug];                // os dados dessa categoria

// Texto digitado na busca do cabeçalho (ex.: promocoes.html?q=acer), em minúsculas
const busca = (new URLSearchParams(location.search).get('q') || '').toLowerCase();


/* ------------------------------------------------------------
   3. GERAÇÃO DOS PRODUTOS
   Os produtos são de demonstração e são "inventados" por um gerador de
   números pseudo-aleatórios com semente fixa. Assim, toda vez que a página
   abre, os MESMOS produtos e preços aparecem (e batem com as páginas
   individuais de cada produto).

   ATENÇÃO: não mude a ordem das chamadas aleatorio() abaixo, senão os
   preços deixam de bater com as páginas dos produtos.
   ------------------------------------------------------------ */
let semente = slug.length * 97 + 7;
const aleatorio = () => (semente = (semente * 9301 + 49297) % 233280) / 233280;   // devolve um número entre 0 e 1

const todos = [];   // lista com os 40 produtos da categoria
let proximoId = 1;

categoria.tipos.forEach(tipo =>
  categoria.marcas.forEach(marca =>
    categoria.specs.forEach(spec => {
      // preço = sorteado entre min e max, terminando em ,90
      const preco = Math.round(categoria.min + aleatorio() * (categoria.max - categoria.min)) + .9;
      // 40% dos produtos estão em oferta
      const emOferta = aleatorio() < .4;

      todos.push({
        id: proximoId++,
        nome: `${tipo} ${marca}, ${spec}`,
        marca: marca,
        preco: preco,
        // preço antigo (riscado): 15% a 30% maior que o atual. 0 = sem oferta
        precoAntigo: emOferta ? Math.round(preco * (1.15 + aleatorio() * .15)) : 0,
        fr: aleatorio() < .5,    // tem frete grátis?
        pr: aleatorio() < .3,    // é "Prime Ninja"?
        ob: aleatorio() < .25,   // é "OpenBox"?
        // nota de 4.0 a 5.0 (60% dos produtos têm nota; os outros ficam sem)
        nota: aleatorio() < .6 ? (4 + Math.round(aleatorio() * 10) / 10).toFixed(1) : ''
      });
    })
  )
);

// Menor e maior preço da categoria (usados como valor inicial do filtro de preço)
const precoMin = Math.floor(Math.min(...todos.map(x => x.preco)));
const precoMax = Math.ceil(Math.max(...todos.map(x => x.preco)));


/* ------------------------------------------------------------
   4. ESTADO DA PÁGINA
   Guarda o que o cliente escolheu nos filtros. O desenhar() lê isso aqui.
   OBS.: fr, ob, pr e of têm o mesmo nome dos checkboxes (id="fr", etc.).
   ------------------------------------------------------------ */
const estado = {
  ordem: '',          // '' = padrão | 'a' = menor preço | 'd' = maior preço | 'n' = melhor avaliados
  porPagina: 20,      // quantos produtos por página
  pagina: 1,          // página atual
  fr: false,          // filtro: só frete grátis
  ob: false,          // filtro: só OpenBox
  pr: false,          // filtro: só Prime Ninja
  of: false,          // filtro: só ofertas
  min: precoMin,      // filtro: preço mínimo
  max: precoMax,      // filtro: preço máximo
  marcas: new Set(),  // filtro: marcas marcadas (vazio = todas)
  buscaMarca: ''
};

const favoritos = new Set();   // ids dos produtos favoritados (só vale enquanto a página estiver aberta)


/* ------------------------------------------------------------
   5. ÍCONES (desenhos SVG usados nos botões e filtros)
   ------------------------------------------------------------ */
const icones = {
  caminhao: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 5h14v10H1zM15 8h4l4 4v3h-8zM6 20a2.2 2.2 0 100-4.400 2.200 2.200 0 000 4.400zm12 0a2.200 2.200 0 100-4.400 2.200 2.200 0 000 4.400z"/></svg>',
  caixa:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18l-2 5H5zM4 10h16v10H4zM9 12v2h6v-2z"/></svg>',
  estrela:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/></svg>',
  coracao:  '<svg viewBox="0 0 24 24"><path d="M12 21s-7.500-4.600-9.500-9.200C1 8 3.200 4.500 6.700 4.500c2 0 3.600 1.100 5.300 3 1.700-1.900 3.300-3 5.300-3 3.500 0 5.700 3.500 4.200 7.300C19.500 16.400 12 21 12 21z"/></svg>',
  carrinho: '<svg viewBox="0 0 24 24"><path d="M2 3h3l2.400 11h11l2-8H6"/><circle cx="9" cy="19" r="1.500"/><circle cx="17" cy="19" r="1.500"/></svg>'
};


/* ------------------------------------------------------------
   6. ESTRUTURA DA PÁGINA (HTML)
   Escreve o esqueleto dentro de <main id="app">: título, filtros à esquerda
   e, à direita, a barra de ordenação + a grade de produtos + a paginação.
   A grade (#gd) e a paginação (#pgn) começam vazias; quem preenche é o desenhar().
   ------------------------------------------------------------ */
document.title = categoria.t + ' — VOTIX';   // título da aba do navegador

document.getElementById('app').innerHTML = `
<div class="wrap">

  <!-- Trilha "Você está em: ..." e faixa laranja com o título -->
  <div class="bc"><b>Você está em:</b> ${categoria.t}</div>
  <div class="tit">${categoria.t}</div>

  <div class="lay">

    <!-- ===== COLUNA ESQUERDA: FILTROS ===== -->
    <aside>

      <!-- Interruptores: Frete grátis, OpenBox, Prime Ninja -->
      <div class="fb">
        <label class="sw"><span>${icones.caminhao}Frete grátis</span><input type="checkbox" id="fr"></label>
        <label class="sw"><span>${icones.caixa}OpenBox</span><input type="checkbox" id="ob"></label>
        <label class="sw"><span>${icones.estrela}Prime Ninja</span><input type="checkbox" id="pr"></label>
      </div>

      <!-- Faixa de preço (mínimo e máximo) -->
      <div class="fb">
        <h4>Preço</h4>
        <div class="pr2">
          <input type="number" id="mn" value="${precoMin}" aria-label="Mínimo">
          <span>–</span>
          <input type="number" id="mx" value="${precoMax}" aria-label="Máximo">
        </div>
      </div>

      <!-- Só ofertas -->
      <div class="fb">
        <h4>Ofertas</h4>
        <label><input type="checkbox" id="of"> Oferta</label>
      </div>

      <!-- Marcas: campo de busca + uma caixinha por marca (em ordem alfabética) -->
      <div class="fb">
        <h4>Marcas</h4>
        <input class="bs" id="bq" placeholder="Buscar marca">
        <div class="bl">${categoria.marcas.slice().sort().map(m => `<label><input type="checkbox" data-m="${m}"> ${m}</label>`).join('')}</div>
      </div>

    </aside>

    <!-- ===== COLUNA DIREITA: PRODUTOS ===== -->
    <section>

      <!-- Barra: Ordenar, Exibir (itens por página) e contador de produtos -->
      <div class="bar">
        <b>Ordenar:</b>
        <select id="so">
          <option value="">Escolha</option>
          <option value="a">Menor preço</option>
          <option value="d">Maior preço</option>
          <option value="n">Melhor avaliados</option>
        </select>
        <b>Exibir:</b>
        <select id="pp"><option>20</option><option>40</option><option>60</option></select>
        <span class="n" id="cn"></span>
      </div>

      <div class="grid" id="gd"></div>   <!-- aqui entram os cartões dos produtos -->
      <div class="pg" id="pgn"></div>    <!-- aqui entram os botões de página -->

    </section>
  </div>
</div>
<footer>VOTIX — loja de demonstração.</footer>`;


/* ------------------------------------------------------------
   7. ATALHOS
   ------------------------------------------------------------ */
const $ = id => document.getElementById(id);                        // $('gd') = document.getElementById('gd')
const on = (id, evento, funcao) => $(id).addEventListener(evento, funcao);   // "quando <evento> acontecer em <id>, rode <funcao>"


/* ------------------------------------------------------------
   8. DESENHAR (a função principal)
   Aplica os filtros, ordena, separa a página atual e escreve tudo na tela.
   É chamada na abertura da página e sempre que o cliente muda algo.
   ------------------------------------------------------------ */
function desenhar() {

  // --- a) FILTRAR: fica só o produto que passa em TODAS as condições ---
  let lista = todos.filter(x =>
    x.preco >= estado.min && x.preco <= estado.max &&                // dentro da faixa de preço
    (!busca || x.nome.toLowerCase().includes(busca)) &&              // contém o texto buscado (se houver busca)
    (!estado.fr || x.fr) &&                                          // frete grátis (se o filtro estiver ligado)
    (!estado.pr || x.pr) &&                                          // Prime Ninja
    (!estado.ob || x.ob) &&                                          // OpenBox
    (!estado.of || x.precoAntigo) &&                                 // em oferta
    (!estado.marcas.size || estado.marcas.has(x.marca))              // marca marcada (ou nenhuma marcada = todas)
  );

  // --- b) ORDENAR ---
  if (estado.ordem == 'a') lista.sort((a, b) => a.preco - b.preco);                // menor preço primeiro
  if (estado.ordem == 'd') lista.sort((a, b) => b.preco - a.preco);                // maior preço primeiro
  if (estado.ordem == 'n') lista.sort((a, b) => (b.nota || 0) - (a.nota || 0));    // maior nota primeiro

  // --- c) PAGINAR ---
  const totalPaginas = Math.max(1, Math.ceil(lista.length / estado.porPagina));
  estado.pagina = Math.min(estado.pagina, totalPaginas);      // se a página atual não existe mais, volta para a última

  // --- d) CONTADOR "N produtos" ---
  $('cn').innerHTML = `<b>${lista.length}</b> produtos`;

  // --- e) CARTÕES DOS PRODUTOS (só os da página atual) ---
  const daPagina = lista.slice((estado.pagina - 1) * estado.porPagina, estado.pagina * estado.porPagina);

  $('gd').innerHTML = lista.length
    ? daPagina.map(x => `
      <div class="pc">
        <span class="nt" ${x.nota ? '' : 'hidden'}>${x.nota}</span>

        <!-- Botões: favoritar (coração) e adicionar ao carrinho -->
        <div class="act">
          <button class="fav${favoritos.has(x.id) ? ' on' : ''}" data-f="${x.id}" aria-pressed="${favoritos.has(x.id)}" aria-label="Favoritar">${icones.coracao}</button>
          <button class="cart" data-c="${x.id}" aria-label="Adicionar ao carrinho">${icones.carrinho}</button>
        </div>

        <!-- Foto + nome: levam para a página do produto -->
        <a href="produtos/${slug}/${slug}-${x.id}.html"><div class="ph"></div><h3>${x.nome}</h3></a>

        ${x.precoAntigo ? `<div class="old">R$ ${fmt(x.precoAntigo)}</div>` : ''}
        <div class="pr">R$ ${fmt(x.preco)}</div>
        <small>No PIX ou 10x de R$ ${fmt(x.preco / 10)}</small>
        ${x.precoAntigo ? `<span class="off">-${Math.round(100 - x.preco / x.precoAntigo * 100)}%</span>` : ''}
      </div>`).join('')
    // nenhum produto passou nos filtros:
    : '<div class="empty" style="grid-column:1/-1">Nenhum produto com esses filtros. Amplie o preço ou limpe as marcas.</div>';

  // --- f) BOTÕES DE PÁGINA (1, 2, 3...) — só aparecem se houver mais de uma página ---
  $('pgn').innerHTML = totalPaginas > 1
    ? Array.from({ length: totalPaginas }, (_, i) =>
        `<button class="${i + 1 == estado.pagina ? 'on' : ''}" data-p="${i + 1}">${i + 1}</button>`
      ).join('')
    : '';
}


/* ------------------------------------------------------------
   9. EVENTOS (o que acontece quando o cliente mexe nos filtros)
   Em todos: atualiza o "estado" e chama desenhar() para refazer a lista.
   Quando o filtro muda a lista, volta para a página 1.
   ------------------------------------------------------------ */

// Interruptores e "Oferta": Frete grátis (fr), OpenBox (ob), Prime Ninja (pr), Oferta (of)
['fr', 'ob', 'pr', 'of'].forEach(chave =>
  on(chave, 'change', e => { estado[chave] = e.target.checked; estado.pagina = 1; desenhar(); })
);

// Preço mínimo e máximo (se o campo ficar vazio, usa 0 e "infinito")
on('mn', 'input', e => { estado.min = +e.target.value || 0;   estado.pagina = 1; desenhar(); });
on('mx', 'input', e => { estado.max = +e.target.value || 1e9; estado.pagina = 1; desenhar(); });

// Ordenar e "Exibir N por página"
on('so', 'change', e => { estado.ordem = e.target.value; desenhar(); });
on('pp', 'change', e => { estado.porPagina = +e.target.value; estado.pagina = 1; desenhar(); });

// Campo "Buscar marca": esconde da lista as marcas que não combinam com o texto digitado
on('bq', 'input', e =>
  document.querySelectorAll('[data-m]').forEach(caixa =>
    caixa.parentElement.hidden = !caixa.dataset.m.toLowerCase().includes(e.target.value.toLowerCase())
  )
);

// Caixinhas de marca: marcar adiciona a marca ao filtro; desmarcar remove
document.querySelectorAll('[data-m]').forEach(caixa =>
  caixa.onchange = () => {
    caixa.checked ? estado.marcas.add(caixa.dataset.m) : estado.marcas.delete(caixa.dataset.m);
    estado.pagina = 1;
    desenhar();
  }
);

// Botões de página: vai para a página clicada e rola para o topo
on('pgn', 'click', e => {
  if (e.target.dataset.p) { estado.pagina = +e.target.dataset.p; desenhar(); scrollTo(0, 0); }
});

// Cliques dentro da grade de produtos (um só "ouvinte" para todos os cartões)
on('gd', 'click', e => {

  // Clicou no coração? Favorita / desfavorita
  const fav = e.target.closest('[data-f]');
  if (fav) {
    const id = +fav.dataset.f;
    favoritos.has(id) ? favoritos.delete(id) : favoritos.add(id);
    fav.classList.toggle('on', favoritos.has(id));
    fav.setAttribute('aria-pressed', favoritos.has(id));
    return;
  }

  // Clicou no carrinho? Coloca o produto no carrinho, atualiza o número e mostra o aviso
  const botao = e.target.closest('[data-c]');
  if (botao) {
    const produto = todos.find(y => y.id == botao.dataset.c);
    Cart.add({ id: slug + '-' + produto.id, n: produto.nome, p: produto.preco });   // n = nome, p = preço (formato do carrinho)
    badge();
    toast('Adicionado ao carrinho');
    botao.classList.add('ok');                                  // botão fica laranja por um instante...
    setTimeout(() => botao.classList.remove('ok'), 1200);       // ...e volta ao normal
  }
});


/* ------------------------------------------------------------
   10. PRIMEIRO DESENHO
   ------------------------------------------------------------ */
desenhar();
