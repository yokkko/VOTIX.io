/* ============================================================
   VOTIX — cadastro.js
   PÁGINA DE CADASTRO ("Criar conta"):
     - alterna entre Pessoa física (CPF) e Pessoa jurídica (CNPJ)
     - coloca máscaras automáticas (pontos, traços, parênteses)
     - valida cada campo e mostra a mensagem de erro
     - confirma o cadastro quando tudo está certo

   Nada é enviado para servidor: é uma loja de demonstração.
   ============================================================ */

// Atalho: $('email') = document.getElementById('email')
const $ = id => document.getElementById(id);

let tipo = 'pf';   // tipo de cadastro escolhido: 'pf' = Pessoa física | 'pj' = Pessoa jurídica

// Devolve só os números de um texto: "123.456-78" -> "12345678"
const digits = v => v.replace(/\D/g, '');


/* ------------------------------------------------------------
   1. MÁSCARAS
   Transformam o que a pessoa digita num formato bonito, enquanto ela digita.
   ------------------------------------------------------------ */
const mask = {

  // CPF: 12345678901 -> 123.456.789-01 (até 11 números)
  pf: v => digits(v).slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')       // depois dos 3 primeiros: ponto
    .replace(/(\d{3})(\d)/, '$1.$2')       // depois dos 6 primeiros: ponto
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2'), // antes dos 2 últimos: traço

  // CNPJ: 12345678000195 -> 12.345.678/0001-95 (até 14 números)
  pj: v => digits(v).slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2'),

  // Celular: 11912345678 -> (11) 91234-5678 (até 11 números)
  cel: v => digits(v).slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
};


/* ------------------------------------------------------------
   2. VALIDAÇÃO DE CPF E CNPJ
   Conferem os dois dígitos verificadores (o cálculo oficial que a
   Receita usa). Devolvem true se o número for válido.
   ------------------------------------------------------------ */
function cpfOk(c) {
  c = digits(c);
  if (c.length != 11 || /^(\d)\1+$/.test(c)) return false;     // precisa ter 11 números e não pode ser tudo igual (111.111.111-11)
  for (let t = 9; t < 11; t++) {                                // t=9 confere o 1º dígito verificador; t=10, o 2º
    let s = 0;
    for (let i = 0; i < t; i++) s += c[i] * (t + 1 - i);
    if ((s * 10 % 11) % 10 != c[t]) return false;
  }
  return true;
}

function cnpjOk(c) {
  c = digits(c);
  if (c.length != 14 || /^(\d)\1+$/.test(c)) return false;     // precisa ter 14 números e não pode ser tudo igual
  for (let t = 12; t < 14; t++) {                               // t=12 confere o 1º dígito verificador; t=13, o 2º
    let s = 0, p = t - 7;
    for (let i = 0; i < t; i++) {
      s += c[i] * p--;
      if (p < 2) p = 9;
    }
    if ((s * 10 % 11) % 10 != c[t]) return false;
  }
  return true;
}


/* ------------------------------------------------------------
   3. REGRAS DE CADA CAMPO
   Cada regra recebe o texto digitado (v) e devolve:
     ''              -> está certo
     'uma mensagem'  -> está errado (e a mensagem aparece em vermelho)
   O nome da regra é o mesmo id do campo no HTML.
   ------------------------------------------------------------ */
const rules = {

  // Nome: pessoa física precisa de nome E sobrenome; empresa, de pelo menos 3 letras
  nome: v =>
    v.trim().split(/\s+/).filter(Boolean).length < 2 && tipo == 'pf' ? 'Informe nome e sobrenome.'
    : v.trim().length < 3 ? 'Informe o nome da empresa.'
    : '',

  // CPF ou CNPJ (conforme o tipo escolhido)
  doc: v =>
    !v ? `Informe o ${tipo == 'pf' ? 'CPF' : 'CNPJ'}.`
    : (tipo == 'pf' ? cpfOk(v) : cnpjOk(v)) ? ''
    : `${tipo == 'pf' ? 'CPF' : 'CNPJ'} inválido.`,

  // Data de nascimento (pessoa física) ou de abertura (empresa)
  nasc: v => {
    if (!v) return tipo == 'pf' ? 'Informe sua data de nascimento.' : 'Informe a data de abertura.';
    const d = new Date(v), h = new Date();                      // d = data digitada | h = hoje
    if (d > h) return 'Data no futuro.';
    if (tipo == 'pf' && h.getFullYear() - d.getFullYear() < 18) return 'É preciso ter 18 anos ou mais.';
    return '';
  },

  // E-mail: texto + @ + texto + ponto + pelo menos 2 letras (ex.: voce@email.com)
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Informe um e-mail válido.',

  // Celular: 11 números (DDD + 9 dígitos)
  cel: v => digits(v).length == 11 ? '' : 'Informe o celular com DDD.',

  // Senha: mínimo de 8 caracteres, com pelo menos uma letra e um número
  senha: v => v.length < 8 || !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Use 8 ou mais caracteres, com letras e números.' : '',

  // Confirmar senha: precisa ser igual à senha
  conf: v => v && v === $('senha').value ? '' : 'As senhas não conferem.'
};

// Confere UM campo: roda a regra, escreve a mensagem de erro embaixo dele e
// marca o campo (aria-invalid) para a borda ficar vermelha. Devolve true se está certo.
function check(id) {
  const campo = $(id);
  const msg = rules[id](campo.value);
  const erro = campo.parentElement.querySelector('.err');
  erro.textContent = msg;
  campo.setAttribute('aria-invalid', !!msg);
  return !msg;
}


/* ------------------------------------------------------------
   4. EVENTOS
   ------------------------------------------------------------ */

// Todos os campos: confere ao SAIR do campo (blur).
// Se o campo já está com erro, confere de novo a cada tecla, para o erro sumir assim que for corrigido.
Object.keys(rules).forEach(id => {
  $(id).addEventListener('blur', () => check(id));
  $(id).addEventListener('input', () => {
    if ($(id).getAttribute('aria-invalid') == 'true') check(id);
  });
});

// Máscaras aplicadas enquanto digita (CPF/CNPJ conforme o tipo, e celular)
$('doc').addEventListener('input', e => e.target.value = mask[tipo](e.target.value));
$('cel').addEventListener('input', e => e.target.value = mask.cel(e.target.value));

// Botão "Mostrar/Ocultar" da senha (mexe nos dois campos de senha ao mesmo tempo)
$('eye').onclick = () => {
  const estavaOculta = $('senha').type == 'password';
  $('senha').type = $('conf').type = estavaOculta ? 'text' : 'password';
  $('eye').textContent = estavaOculta ? 'Ocultar' : 'Mostrar';
};

// Abas "Pessoa física" / "Pessoa jurídica": troca o tipo, os rótulos e limpa os campos afetados
document.querySelectorAll('[data-t]').forEach(aba =>
  aba.onclick = () => {
    tipo = aba.dataset.t;
    document.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-selected', x === aba));   // destaca a aba clicada

    const pf = tipo == 'pf';
    $('lNome').textContent = pf ? 'Nome completo' : 'Razão social';
    $('lDoc').textContent = pf ? 'CPF' : 'CNPJ';
    $('lNasc').textContent = pf ? 'Data de nascimento' : 'Data de abertura';
    $('doc').placeholder = pf ? '000.000.000-00' : '00.000.000/0000-00';
    $('doc').value = '';

    // limpa os erros dos 3 campos que mudam de significado
    ['nome', 'doc', 'nasc'].forEach(id => {
      $(id).setAttribute('aria-invalid', false);
      $(id).parentElement.querySelector('.err').textContent = '';
    });
  }
);

// Botão "Criar conta" (envio do formulário)
$('fm').addEventListener('submit', e => {
  e.preventDefault();                                           // não recarrega a página

  const oks = Object.keys(rules).map(check);                    // confere TODOS os campos
  const termos = $('termos').checked;                           // aceitou os termos?
  $('eTermos').textContent = termos ? '' : 'Aceite os termos para continuar.';

  // Se algo está errado, leva o cursor ao primeiro campo com erro e para por aqui
  if (oks.includes(false) || !termos) {
    const erro = document.querySelector('[aria-invalid=true]');
    (erro || $('termos')).focus();
    return;
  }

  // Tudo certo: troca o formulário pela mensagem "Conta criada" (usa só o primeiro nome)
  const primeiroNome = $('nome').value.trim().split(' ')[0];
  $('box').innerHTML = `<div class="ok"><h1>Conta criada</h1><p>Bem-vindo(a), ${primeiroNome.replace(/[<>&]/g, '')}. Enviamos um e-mail para confirmar o seu cadastro.</p><a href="index.html">Começar a comprar</a></div>`;
  scrollTo(0, 0);
});
