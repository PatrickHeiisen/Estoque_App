const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Caminho correto para a pasta onde vai ficar o .db
const pastaBanco = path.join(__dirname);
const dbPath = path.join(pastaBanco, 'estoque.db');

// Garante que a pasta existe
if (!fs.existsSync(pastaBanco)) {
    fs.mkdirSync(pastaBanco, { recursive: true });
}

// Cria ou abre o banco
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco:', err.message);
    } else {
        console.log('Banco de dados conectado em:', dbPath);
    }
});

// Cria a tabela de produtos
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

// Cria a tabela de movimentações
db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    categoria TEXT,
    unidade TEXT DEFAULT 'Unid',
    data_entrada TEXT NOT NULL
    );
`);

module.exports = db;
