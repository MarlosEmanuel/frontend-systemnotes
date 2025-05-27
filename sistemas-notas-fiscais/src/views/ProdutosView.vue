<template>
  <div>
    <!-- Header -->
    <div class="header-top">
      <input
        type="search"
        v-model="busca"
        placeholder="Pesquisar produtos"
        @input="filtrarProdutos"
      />
      <button @click="abrirFormNovoProduto">NOVO PRODUTO</button>
    </div>

    <!-- Formulário Novo/Editar Produto -->
    <div v-if="mostrarFormProduto" class="form-container">
       <h3>{{ formTitulo }}</h3>
       <form @submit.prevent="salvarProduto">
         <label>Nome</label>
         <input v-model="produtoData.nome" placeholder="Nome do produto" required />

         <label>Preço (R$)</label>
         <input
           v-model.number="produtoData.preco"
           placeholder="Ex: 49.90"
           type="number"
           step="0.01"
           min="0"
           required
         />

         <label>Descrição</label>
         <input v-model="produtoData.descricao" placeholder="Descrição (opcional)" />

         <label>Estoque</label>
         <input
           v-model.number="produtoData.estoque"
           placeholder="Quantidade em estoque"
           type="number"
           min="0"
           required
         />

         <button type="submit" :disabled="loadingSalvar">
           {{ loadingSalvar ? 'Salvando...' : 'Salvar Produto' }}
         </button>
         <button type="button" @click="cancelarFormProduto" :disabled="loadingSalvar">
           Cancelar
         </button>
       </form>
    </div>

    <!-- Lista de Produtos -->
    <div v-if="!mostrarFormProduto">
      <div>
        Total de {{ produtosFiltrados.length }} produtos
      </div>

      <!-- Estado de carregamento e vazio -->
      <div v-if="loadingBusca">Carregando produtos...</div>
      <div v-else-if="produtos.length === 0">Nenhum produto encontrado.</div>

      <div v-else class="products-list">
        <div
          v-for="p in produtosFiltrados"
          :key="p.id"
          class="product-card"
        >
          <div class="product-info">
             <strong>{{ p.nome }}</strong>
             <small>R$ {{ p.preco ? p.preco.toFixed(2) : '0.00' }}</small>
             <small>Estoque: {{ p.estoque !== null ? p.estoque : 'N/A' }}</small>
             <small v-if="p.descricao">{{ p.descricao }}</small>
          </div>
          <div class="actions-menu-container">
             <button @click="toggleMenu(p.id)">⋮</button>
             <div v-if="menuAbertoProdutoId === p.id" class="actions-menu">
               <button @click="editarProduto(p)">Editar</button>
               <button @click="excluirProduto(p)">Excluir</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const busca = ref('')
const produtos = ref([])
const produtosFiltrados = ref([])
const loadingBusca = ref(false)
const loadingSalvar = ref(false)
const mostrarFormProduto = ref(false)
const editandoProduto = ref(false)
const produtoData = ref({}) // Para form de novo/editar
const menuAbertoProdutoId = ref(null)

const formTitulo = computed(() => (editandoProduto.value ? 'Editar Produto' : 'Novo Produto'));

function filtrarProdutos() {
  if (!produtos.value) {
      produtosFiltrados.value = [];
      return;
  }
  const termo = busca.value.toLowerCase()
  produtosFiltrados.value = produtos.value.filter(p =>
    p.nome.toLowerCase().includes(termo)
  )
}

const listarProdutos = async () => {
  loadingBusca.value = true
  menuAbertoProdutoId.value = null
  try {
    const res = await api.get('/produtos')
    produtos.value = Array.isArray(res.data) ? res.data : []
    filtrarProdutos()
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    alert('Falha ao carregar produtos. Verifique o console.')
    produtos.value = []
    produtosFiltrados.value = []
  } finally {
    loadingBusca.value = false
  }
}

const resetForm = () => {
    produtoData.value = { nome: '', preco: 0, descricao: '', estoque: 0 };
};

const abrirFormNovoProduto = () => {
    resetForm();
    editandoProduto.value = false;
    mostrarFormProduto.value = true;
    menuAbertoProdutoId.value = null;
};

const cancelarFormProduto = () => {
    if (loadingSalvar.value) return
    mostrarFormProduto.value = false;
    editandoProduto.value = false;
};

async function salvarProduto() {
  if (!produtoData.value.nome || produtoData.value.preco === null || produtoData.value.estoque === null) {
      alert('Nome, Preço e Estoque são obrigatórios.');
      return;
  }

  loadingSalvar.value = true
  try {
    if (editandoProduto.value) {
      await api.put(`/produtos/${produtoData.value.id}`, produtoData.value)
      alert('Produto atualizado com sucesso!')
    } else {
      await api.post('/produtos', produtoData.value)
      alert('Produto salvo com sucesso!')
    }
    mostrarFormProduto.value = false
    editandoProduto.value = false
    await listarProdutos()
  } catch (error) {
    console.error('Erro ao salvar produto:', error)
    alert('Falha ao salvar produto. Verifique o console.')
  } finally {
    loadingSalvar.value = false
  }
}

const toggleMenu = (produtoId) => {
  menuAbertoProdutoId.value =
    menuAbertoProdutoId.value === produtoId ? null : produtoId;
};

const editarProduto = (produto) => {
  produtoData.value = { ...produto };
  editandoProduto.value = true;
  mostrarFormProduto.value = true;
  menuAbertoProdutoId.value = null;
};

const excluirProduto = async (produto) => {
  if (confirm(`Tem certeza que deseja excluir o produto ${produto.nome}?`)) {
    try {
      await api.delete(`/produtos/${produto.id}`);
      alert('Produto excluído com sucesso!');
      await listarProdutos();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Falha ao excluir produto. Verifique o console.');
    }
  }
  menuAbertoProdutoId.value = null;
};

onMounted(() => {
  listarProdutos();
});

document.addEventListener('click', (event) => {
  const menuContainers = document.querySelectorAll('.actions-menu-container')
  let clickedInsideMenu = false
  menuContainers.forEach(container => {
    if (container.contains(event.target)) {
      clickedInsideMenu = true
    }
  })
  if (!clickedInsideMenu) {
    menuAbertoProdutoId.value = null
  }
});
</script>

<style scoped>
.form-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}
.form-container h3 {
  margin-bottom: 15px;
}
.form-container label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}
.form-container input,
.form-container select {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.form-container button {
  margin-right: 10px;
}

.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
  padding: 15px 20px;
  position: relative;
}

.product-info small {
  display: block;
  margin-top: 4px;
}

.actions-menu-container {
  position: relative;
  flex-shrink: 0;
}

.actions-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  z-index: 10;
  min-width: 120px;
}

.actions-menu button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.actions-menu button:hover {
  background-color: #f4f6f8;
  color: #0d6efd;
}

.product-card .actions-menu-container > button {
  padding: 0 8px;
}

[v-if="loadingBusca"],
[v-else-if="produtos.length === 0"] {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
</style>
