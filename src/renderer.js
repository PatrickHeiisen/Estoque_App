const nomeInput = document.getElementById('nome')
const qtdInput = document.getElementById('quantidade')
const unidadeSelect = document.getElementById('unidade')
const categoriaInput = document.getElementById('categoria')

const nomeRetirada = document.getElementById('nome-retirada')
const qtdRetirada = document.getElementById('quantidade-retirada')

const listaProdutos = document.getElementById('lista-produtos')
const listaHistorico = document.getElementById('lista-historico')

// Carregar dados ao abrir
window.addEventListener('DOMContentLoaded', async () => {
    await atualizarInterface()
})

// Adicionar produto
document.getElementById('btn-adicionar').addEventListener('click', async () => {
    const nome = nomeInput.value.trim()
    const quantidade = parseInt(qtdInput.value)
    const unidade = unidadeSelect.value
    const categoria = categoriaInput.value.trim()

    if (!nome || isNaN(quantidade) || quantidade <= 0) {
        alert('Preencha os dados corretamente')
        return
    }

    try {
        await window.api.adicionarProduto({ nome, quantidade, unidade, categoria })
        await atualizarInterface()
        limparInputs()
    } catch (err) {
        alert('Erro ao adicionar: ' + err.message)
    }
});

// Retirar produto
document.getElementById('btn-retirar').addEventListener('click', async () => {
    const nome = nomeRetirada.value.trim()
    const quantidade = parseInt(qtdRetirada.value)

    if (!nome || isNaN(quantidade) || quantidade <= 0) {
        alert('Preencha os dados corretamente')
        return
    }

    try {
        await window.api.retirarProduto(nome, quantidade)
        await atualizarInterface()
        limparInputs(true)
    } catch (err) {
        alert('Erro ao retirar: ' + err.message)
    }
});

// Atualizar interface (produtos e histórico)
async function atualizarInterface() {
    const produtos = await window.api.listarProdutos()
    const historico = await window.api.listarHistorico()

    listaProdutos.innerHTML = ''
    produtos.forEach(p => {
        const li = document.createElement('li')
        li.textContent = `${p.nome} - ${p.quantidade} ${p.unidade}${p.categoria ? ' (' + p.categoria + ')' : ''}`
        listaProdutos.appendChild(li)
    });

    listaHistorico.innerHTML = ''
    historico.forEach(h => {
        const li = document.createElement('li')
        li.textContent = `${formatarData(h.data)} - ${h.mensagem}`
        listaHistorico.appendChild(li)
    })
}

// Limpar inputs
function limparInputs(retirada = false) {
    if (retirada) {
        nomeRetirada.value = ''
        qtdRetirada.value = ''
    } else {
        nomeInput.value = ''
        qtdInput.value = ''
        categoriaInput.value = ''
        unidadeSelect.selectedIndex = 0
    }
}

// Formatar data
function formatarData(data) {
    const d = new Date(data)
    return d.toLocaleString('pt-BR')
}
