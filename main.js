const { app, BrowserWindow, nativeTheme, Menu, shell, ipcMain } = require('electron/main')
const path = require('path')
const db = require('./db/database.js');

// Janela Principal
const createWindow = () => {
    nativeTheme.themeSource = 'dark'
    win = new BrowserWindow({
        width: 900,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    })

    Menu.setApplicationMenu(Menu.buildFromTemplate(templete))
    win.loadFile('./src/index.html')
}

// Janela Sobre
const aboutWindow = () => {
    nativeTheme.themeSource = 'dark'
    const win = new BrowserWindow({
        width: 400,
        height: 450,
        autoHideMenuBar: true,
        resizable: false,
        minimizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js')
        }
    })

    win.loadFile('./src/sobre.html')
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Menu
const templete = [
    {
        label: 'Ferramentas',
        submenu: [
            {
                label: 'Ampliar',
                role: 'zoomIn'
            },
            {
                label: 'Reduzir',
                role: 'zoomOut'
            },
            {
                label: 'Tamanho padrão',
                role: 'resetZoom'
            },
            {
                type: 'separator'
            },
            {
                label: 'Recarregar',
                role: 'reload'
            },
            {
                label: 'DevTools',
                role: 'toggleDevTools'
            },
            {
                label: 'Sair',
                click: () => app.quit(),
                accelerator: 'Alt+F4'
            }
        ]
    },
    {
        label: 'Ajuda',
        submenu: [
            {
                label: 'Repositório',
                click: () => shell.openExternal('https://github.com/PatrickHeiisen/Estoque_App.git')
            },
            {
                label: 'Sobre',
                click: () => aboutWindow()
            }
        ]
    }
]

// IPCs para Produto
ipcMain.handle('produto:adicionar', async (event, produto) => {
    return new Promise((resolve, reject) => {
        db.adicionarProduto(produto, (err) => {
            if (err) reject(err);
            else {
                const msg = `➕ Adicionado ${produto.quantidade} ${produto.unidade}(s) de ${produto.nome}`;
                db.adicionarHistorico(msg, () => { });
                resolve();
            }
        });
    });
});

ipcMain.handle('produto:retirar', async (event, nome, quantidade) => {
    return new Promise((resolve, reject) => {
        db.retirarProduto(nome, quantidade, (err) => {
            if (err) reject(err);
            else {
                const msg = `📤 Retirado ${quantidade} de ${nome}`;
                db.adicionarHistorico(msg, () => { });
                resolve();
            }
        });
    });
});

ipcMain.handle('produto:listar', async () => {
    return new Promise((resolve, reject) => {
        db.listarProdutos((err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

ipcMain.handle('historico:listar', async () => {
    return new Promise((resolve, reject) => {
        db.listarHistorico((err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});