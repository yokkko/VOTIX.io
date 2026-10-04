/* ============================================================
   VOTIX — core.js
   O "núcleo" do site: é carregado em TODAS as páginas e oferece:
     1. Cart   -> o carrinho de compras (fica salvo no navegador)
     2. fmt()  -> formata dinheiro (1234.5 -> "1.234,50")
     3. badge()-> atualiza o número ao lado de "Carrinho" no cabeçalho
     4. toast()-> mostra o aviso verde ("Adicionado ao carrinho")
     5. O CABEÇALHO do site (logo, busca, links), escrito aqui uma única vez
        e inserido no <div id="topo"></div> de cada página.

   Para mudar um link ou texto do cabeçalho em todas as páginas,
   edite a seção "CABEÇALHO" lá embaixo.
   ============================================================ */

(function () {
  // Estilos do selo do carrinho (.cb, a bolinha laranja com o número)
  // e do aviso flutuante (#toast, a caixa verde que aparece embaixo da tela).
  // Ficam aqui, em vez de nos arquivos .css, porque estes dois elementos são criados pelo JavaScript.
  const st = document.createElement('style');
  st.textContent =
    '.cb{background:var(--org);color:#fff;border-radius:99px;padding:1px 7px;font-size:12px;margin-left:6px}' +
    '#toast{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);background:#19a35a;color:#fff;padding:12px 20px;border-radius:8px;font-weight:600;opacity:0;pointer-events:none;transition:.2s;z-index:99}' +
    '#toast.on{opacity:1;transform:translate(-50%,0)}';
  document.head.appendChild(st);

  // ---- 1. CARRINHO ----
  // Os itens ficam salvos no navegador (localStorage), na chave 'votix_cart', então
  // continuam lá mesmo se a pessoa trocar de página ou fechar o site.
  // Se o navegador bloquear o localStorage, usa uma cópia em memória (mem) como reserva.
  // Cada item do carrinho: { id, n (nome), p (preço), q (quantidade) }
  const mem = { c: [] };
  window.Cart = {
    // Cart.get()   -> devolve a lista de itens
    get() { try { return JSON.parse(localStorage.getItem('votix_cart')) || [] } catch (e) { return mem.c } },
    // Cart.set(lista) -> salva a lista de itens
    set(v) { mem.c = v; try { localStorage.setItem('votix_cart', JSON.stringify(v)) } catch (e) {} },
    // Cart.add(item, quantidade) -> adiciona; se o item já existe, só soma a quantidade
    add(it, q) {
      const c = this.get(), x = c.find(i => i.id == it.id);
      x ? x.q += q || 1 : c.push({ id: it.id, n: it.n, p: it.p, q: q || 1 });
      this.set(c);
    },
    // Cart.count() -> total de unidades no carrinho
    count() { return this.get().reduce((a, b) => a + b.q, 0) }
  };

  // ---- 2. UTILITÁRIOS ----

  // Formata número como dinheiro brasileiro, sempre com 2 casas: 4058.9 -> "4.058,90"
  window.fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Atualiza a bolinha com o número de itens ao lado de "Carrinho" (some se o carrinho estiver vazio)
  window.badge = () => {
    const b = document.getElementById('cb');
    if (b) { const n = Cart.count(); b.textContent = n; b.hidden = !n }
  };

  // Mostra uma mensagem rápida (1,6 segundo) no rodapé da tela. Ex.: toast('Link copiado')
  window.toast = m => {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t) }
    t.textContent = m; t.classList.add('on');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 1600);
  };

  // ---- 3. CABEÇALHO ----
  // BASE = caminho até a raiz do site (as páginas de produto ficam em produtos/<categoria>/,
  // então usam data-base="../../" no <body>). Todos os links do cabeçalho recebem esse prefixo.
  const topo = document.getElementById('topo');
  const B = document.body.dataset.base || '';
  window.BASE = B;

  if (topo) {
    // Escreve o HTML do cabeçalho dentro de <div id="topo">.
    // Para trocar o nome da loja, os links ou o texto da busca, mexa aqui:
    topo.innerHTML = (
      '<header>' +
        '<div class="top">' +
          '<a class="logo" href="index.html">VOTIX<i>»</i></a>' +
          '<form class="search" action="promocoes.html"><input name="q" placeholder="Busque na VOTIX" aria-label="Buscar"></form>' +
          '<div class="acts">' +
            '<a href="cadastro.html">Entre ou cadastre-se</a>' +
            '<a href="carrinho.html">Carrinho<span class="cb" id="cb" hidden>0</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="row2">' +
          '<a class="dep" href="promocoes.html">Departamentos</a>' +
          '<a class="cup" href="promocoes.html">Cupons</a>' +
          '<nav class="links">' +
            '<a href="promocoes.html">Mais vendidos</a>' +
            '<a href="mundo-gamer.html">Mundo Gamer</a>' +
            '<a href="placas-de-video.html">Hardware</a>' +
            '<a href="computadores.html">Computadores</a>' +
            '<a href="perifericos.html">Periféricos</a>' +
            '<a href="notebooks.html">Notebooks</a>' +
            '<a href="monitores.html">Monitores</a>' +
          '</nav>' +
        '</div>' +
      '</header>'
    ).replace(/(href|action)="/g, '$1="' + B);   // coloca o prefixo B antes de todo link (href) e do formulário (action)

    badge();   // mostra o número de itens do carrinho assim que o cabeçalho aparece
  }
})();
