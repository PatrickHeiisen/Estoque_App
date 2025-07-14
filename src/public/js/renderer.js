const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o banco
const dbPath = path.join(__dirname, '..', 'banco', 'estoque.db');
const db = new sqlite3.Database(dbPath);

// 🔧 Garante que as tabelas existam
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      unidade TEXT DEFAULT 'Unid',
      categoria TEXT,
      data_entrada TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_nome TEXT NOT NULL,
      tipo TEXT NOT NULL, -- 'entrada' ou 'saida'
      quantidade INTEGER NOT NULL,
      data TEXT NOT NULL
    );
  `);
});

// Estado de edição
let editando = false;
let idEditando = null;

// Elementos da interface
const nomeInput = document.getElementById('nome');
const quantidadeInput = document.getElementById('quantidade');
const unidadeInput = document.getElementById('unidade');
const categoriaInput = document.getElementById('categoria');
const btnAdicionar = document.getElementById('btn-adicionar');
const listaProdutos = document.getElementById('lista-produtos');

const nomeRetiradaInput = document.getElementById('nome-retirada');
const quantidadeRetiradaInput = document.getElementById('quantidade-retirada');
const btnRetirar = document.getElementById('btn-retirar');

// Adicionar ou editar produto
btnAdicionar.addEventListener('click', () => {
  const nome = nomeInput.value.trim();
  const quantidade = parseInt(quantidadeInput.value);
  const unidade = unidadeInput.value;
  const categoria = categoriaInput.value.trim();
  const data_entrada = new Date().toISOString().split('T')[0];

  if (!nome || isNaN(quantidade) || quantidade <= 0) {
    alert('Preencha corretamente o nome e a quantidade (maior que 0)!');
    return;
  }

  if (editando && idEditando !== null) {
    db.run(
      `UPDATE produtos SET nome = ?, quantidade = ?, unidade = ?, categoria = ? WHERE id = ?`,
      [nome, quantidade, unidade, categoria, idEditando],
      (err) => {
        if (err) {
          console.error('Erro ao editar produto:', err.message);
        } else {
          resetarFormulario();
          carregarProdutos();
        }
      }
    );
  } else {
    db.run(
      `INSERT INTO produtos (nome, quantidade, unidade, categoria, data_entrada)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, quantidade, unidade, categoria, data_entrada],
      (err) => {
        if (err) {
          console.error('Erro ao inserir produto:', err.message);
        } else {
          db.run(
            `INSERT INTO movimentacoes (produto_nome, tipo, quantidade, data)
             VALUES (?, 'entrada', ?, ?)`,
            [nome, quantidade, data_entrada]
          );
          resetarFormulario();
          carregarProdutos();
          carregarHistorico();
        }
      }
    );
  }
});

// Retirar produto
btnRetirar.addEventListener('click', () => {
  const nome = nomeRetiradaInput.value.trim();
  const quantidade = parseInt(quantidadeRetiradaInput.value);

  if (!nome || isNaN(quantidade) || quantidade <= 0) {
    alert('Informe um nome de produto válido e a quantidade a retirar!');
    return;
  }

  db.get('SELECT * FROM produtos WHERE nome = ? COLLATE NOCASE', [nome], (err, produto) => {
    if (err) {
      console.error('Erro ao buscar produto:', err.message);
    } else if (!produto) {
      alert('Produto não encontrado!');
    } else if (produto.quantidade < quantidade) {
      alert(`Quantidade insuficiente! Só tem ${produto.quantidade} unidades.`);
    } else {
      const novaQtd = produto.quantidade - quantidade;
      db.run('UPDATE produtos SET quantidade = ? WHERE id = ?', [novaQtd, produto.id], (err) => {
        if (err) {
          console.error('Erro ao atualizar produto:', err.message);
        } else {
          const data_retirada = new Date().toISOString().split('T')[0];
          db.run(
            `INSERT INTO movimentacoes (produto_nome, tipo, quantidade, data)
             VALUES (?, 'saida', ?, ?)`,
            [produto.nome, quantidade, data_retirada]
          );
          nomeRetiradaInput.value = '';
          quantidadeRetiradaInput.value = '';
          carregarProdutos();
          carregarHistorico();
        }
      });
    }
  });
});

// Carrega a lista de produtos
function carregarProdutos() {
  listaProdutos.innerHTML = '';

  db.all('SELECT * FROM produtos ORDER BY id DESC', (err, rows) => {
    if (err) {
      console.error('Erro ao buscar produtos:', err.message);
      return;
    }

    rows.forEach((produto) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${produto.nome}</strong> - ${produto.quantidade} ${produto.unidade || 'Unid'} [${produto.categoria || 'Sem categoria'}]
        <button class="btn-editar" data-id="${produto.id}">Editar</button>
        <button class="btn-excluir" data-id="${produto.id}">Excluir</button>
      `;
      listaProdutos.appendChild(li);
    });

    document.querySelectorAll('.btn-excluir').forEach(botao => {
      botao.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        excluirProduto(id);
      });
    });

    document.querySelectorAll('.btn-editar').forEach(botao => {
      botao.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        editarProduto(id);
      });
    });
  });
}

// Excluir produto
function excluirProduto(id) {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    db.run('DELETE FROM produtos WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Erro ao excluir produto:', err.message);
      } else {
        carregarProdutos();
      }
    });
  }
}

// Editar produto
function editarProduto(id) {
  db.get('SELECT * FROM produtos WHERE id = ?', [id], (err, produto) => {
    if (err) {
      console.error('Erro ao buscar produto para edição:', err.message);
    } else if (produto) {
      nomeInput.value = produto.nome;
      quantidadeInput.value = produto.quantidade;
      unidadeInput.value = produto.unidade || 'Unid';
      categoriaInput.value = produto.categoria || '';

      editando = true;
      idEditando = id;
      btnAdicionar.textContent = 'Salvar Edição';
    }
  });
}

// Resetar formulário
function resetarFormulario() {
  nomeInput.value = '';
  quantidadeInput.value = '';
  unidadeInput.value = 'Unid';
  categoriaInput.value = '';
  btnAdicionar.textContent = 'Adicionar';
  editando = false;
  idEditando = null;
}

// Carregar histórico
function carregarHistorico() {
  const listaHistorico = document.getElementById('lista-historico');
  listaHistorico.innerHTML = '';

  db.all('SELECT * FROM movimentacoes ORDER BY id DESC', (err, rows) => {
    if (err) {
      console.error('Erro ao buscar histórico:', err.message);
      return;
    }

    rows.forEach((mov) => {
      const li = document.createElement('li');
      li.textContent = `${mov.data} - [${mov.tipo.toUpperCase()}] ${mov.produto_nome} - ${mov.quantidade} un.`;
      listaHistorico.appendChild(li);
    });
  });
}

// Início
carregarProdutos();
carregarHistorico();
