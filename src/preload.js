const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  adicionarProduto: (produto) => ipcRenderer.invoke('produto:adicionar', produto),
  retirarProduto: (nome, quantidade) => ipcRenderer.invoke('produto:retirar', nome, quantidade),
  listarProdutos: () => ipcRenderer.invoke('produto:listar'),
  listarHistorico: () => ipcRenderer.invoke('historico:listar')
})
