const { app } = require('electron')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Garante que a função só será chamada quando o Electron estiver pronto
const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'estoque.db')

const db = new sqlite3.Database(dbPath)

// Criação das tabelas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      unidade TEXT NOT NULL,
      categoria TEXT
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mensagem TEXT NOT NULL,
      data TEXT NOT NULL
    );
  `)
})

module.exports = {
  adicionarProduto: (produto, callback) => {
    const { nome, quantidade, unidade, categoria } = produto;
    db.get(`SELECT * FROM produtos WHERE LOWER(nome) = LOWER(?)`, [nome], (err, row) => {
      if (err) return callback(err)

      if (row) {
        const novaQuantidade = row.quantidade + quantidade;
        db.run(`UPDATE produtos SET quantidade = ? WHERE id = ?`, [novaQuantidade, row.id], callback)
      } else {
        db.run(
          `INSERT INTO produtos (nome, quantidade, unidade, categoria) VALUES (?, ?, ?, ?)`,
          [nome, quantidade, unidade, categoria],
          callback
        )
      }
    })
  },

  retirarProduto: (nome, quantidade, callback) => {
    db.get(`SELECT * FROM produtos WHERE LOWER(nome) = LOWER(?)`, [nome], (err, row) => {
      if (err) return callback(err)

      if (!row) return callback(new Error('Produto não encontrado'))
      if (row.quantidade < quantidade) return callback(new Error('Estoque insuficiente'))

      const novaQuantidade = row.quantidade - quantidade

      if (novaQuantidade === 0) {
        db.run(`DELETE FROM produtos WHERE id = ?`, [row.id], callback)
      } else {
        db.run(`UPDATE produtos SET quantidade = ? WHERE id = ?`, [novaQuantidade, row.id], callback)
      }
    })
  },

  listarProdutos: (callback) => {
    db.all(`SELECT * FROM produtos ORDER BY nome`, callback)
  },

  adicionarHistorico: (mensagem, callback) => {
    const data = new Date().toISOString();
    db.run(`INSERT INTO historico (mensagem, data) VALUES (?, ?)`, [mensagem, data], callback)
  },

  listarHistorico: (callback) => {
    db.all(`SELECT * FROM historico ORDER BY id DESC`, callback)
  }
}
