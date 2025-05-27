<template>
  <div>
    <!-- Formulário de Criação de Nota -->
    <div class="form-container nota-form">
      <h3>Criar Nova Nota Fiscal</h3>
      <form @submit.prevent="criarNota">
        <div class="form-group">
          <label for="clienteSelect">Cliente</label>
          <select id="clienteSelect" v-model="novaNota.clienteId" required>
            <option disabled value="">Selecione um cliente</option>
            <option v-for="c in clientes" :key="c.clienteId" :value="c.clienteId">{{ c.nome }}</option>
          </select>
        </div>

        <h4>Itens da Nota</h4>
        <div class="nota-items">
          <div v-for="(item, index) in novaNota.items" :key="index" class="item-row">
            <select v-model="item.produtoId" required>
              <option disabled value="">Selecione produto</option>
              <option v-for="p in produtos" :key="p.id" :value="p.id">{{ p.nome }} (R$ {{ p.preco.toFixed(2) }})</option>
            </select>
            <input
              type="number"
              v-model.number="item.quantidade"
              placeholder="Qtd."
              min="1"
              required
            />
            <span>Total Item: R$ {{ calcularTotalItem(item).toFixed(2) }}</span>
            <button type="button" @click.prevent="removerItem(index)" class="remove-item-btn">Remover</button>
          </div>
          <button type="button" @click="adicionarItem" class="add-item-btn">Adicionar Produto</button>
        </div>

        <div class="nota-total">
          <strong>Total da Nota: R$ {{ calcularTotalNota().toFixed(2) }}</strong>
        </div>

        <button type="submit" :disabled="loadingCriacao">{{ loadingCriacao ? 'Criando...' : 'Criar Nota' }}</button>
      </form>
    </div>

    <hr />

    <!-- Lista de Notas Fiscais -->
    <h3>Notas Fiscais Emitidas</h3>
    <div v-if="loadingBusca">Carregando notas fiscais...</div>
    <div v-else-if="notas.length === 0">Nenhuma nota fiscal encontrada.</div>
    <div v-else class="notas-lista">
      <div v-for="n in notas" :key="n.id" class="nota-card">
        <div class="nota-info">
          <strong>Nota #{{ n.id }}</strong>
          <small>Cliente: {{ getClienteNome(n.clienteId) }}</small>
          <small>Data: {{ formatarData(n.dataEmissao) }}</small> <!-- Assumindo que a API retorna dataEmissao -->
          <small>Total: R$ {{ n.valorTotal ? n.valorTotal.toFixed(2) : '0.00' }}</small>
        </div>
        <div class="actions-menu-container">
           <button @click="toggleMenu(n.id)">⋮</button>
           <div v-if="menuAbertoNotaId === n.id" class="actions-menu">
             <button @click="verDetalhesNota(n)">Ver Detalhes</button>
             <button @click="excluirNota(n)">Excluir/Cancelar</button>
           </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";

const novaNota = ref({ clienteId: "", items: [{ produtoId: "", quantidade: 1 }] });
const notas = ref([]);
const clientes = ref([]);
const produtos = ref([]);
const loadingBusca = ref(false);
const loadingCriacao = ref(false);
const menuAbertoNotaId = ref(null);

// Busca dados iniciais (clientes, produtos, notas existentes)
const buscarDadosIniciais = async () => {
  loadingBusca.value = true;
  menuAbertoNotaId.value = null;
  try {
    // Executa todas as buscas em paralelo para otimizar
    const [resClientes, resProdutos, resNotas] = await Promise.all([
      api.get("/clientes"),
      api.get("/produtos"),
      api.get("/notafiscal")
    ]);
    clientes.value = resClientes.data || [];
    produtos.value = resProdutos.data || [];
    notas.value = resNotas.data || [];
  } catch (error) {
    console.error("Erro ao buscar dados iniciais:", error);
    alert("Falha ao carregar dados para a página de notas fiscais."); // Melhorar feedback
    // Limpar arrays em caso de erro pode ser útil
    clientes.value = [];
    produtos.value = [];
    notas.value = [];
  } finally {
    loadingBusca.value = false;
  }
};

// Busca apenas as notas fiscais (para recarregar a lista)
const buscarNotas = async () => {
    loadingBusca.value = true;
    menuAbertoNotaId.value = null;
    try {
        const resNotas = await api.get("/notafiscal");
        notas.value = resNotas.data || [];
    } catch (error) {
        console.error("Erro ao buscar notas fiscais:", error);
        alert("Falha ao recarregar a lista de notas fiscais."); // Melhorar feedback
    } finally {
        loadingBusca.value = false;
    }
};

const adicionarItem = () => {
  novaNota.value.items.push({ produtoId: "", quantidade: 1 });
};

const removerItem = (index) => {
  if (novaNota.value.items.length > 1) { // Não permite remover o último item
      novaNota.value.items.splice(index, 1);
  }
};

const getProdutoPreco = (produtoId) => {
    const produto = produtos.value.find(p => p.id === produtoId);
    return produto ? produto.preco : 0;
};

const calcularTotalItem = (item) => {
    const preco = getProdutoPreco(item.produtoId);
    return preco * (item.quantidade || 0);
};

const calcularTotalNota = () => {
    return novaNota.value.items.reduce((total, item) => {
        return total + calcularTotalItem(item);
    }, 0);
};

const criarNota = async () => {
  if (!novaNota.value.clienteId || novaNota.value.items.length === 0 || novaNota.value.items.some(item => !item.produtoId || !item.quantidade || item.quantidade <= 0)) {
    alert("Selecione um cliente e preencha todos os itens da nota corretamente (produto e quantidade > 0).");
    return;
  }

  loadingCriacao.value = true;
  try {
    // Prepara o payload - pode ser necessário ajustar conforme a API espera
    const payload = {
        clienteId: novaNota.value.clienteId,
        items: novaNota.value.items.map(item => ({ produtoId: item.produtoId, quantidade: item.quantidade }))
        // A API deve calcular o valorTotal e dataEmissao no backend
    };
    await api.post("/notafiscal", payload);
    alert("Nota Fiscal criada com sucesso!"); // Melhorar feedback
    // Limpa o formulário
    novaNota.value = { clienteId: "", items: [{ produtoId: "", quantidade: 1 }] };
    await buscarNotas(); // Recarrega a lista de notas
  } catch (error) {
    console.error("Erro ao criar nota fiscal:", error);
    alert("Falha ao criar nota fiscal. Verifique o console."); // Melhorar feedback
  } finally {
      loadingCriacao.value = false;
  }
};

// --- Funções do Menu de Ações ---
const toggleMenu = (notaId) => {
  if (menuAbertoNotaId.value === notaId) {
    menuAbertoNotaId.value = null;
  } else {
    menuAbertoNotaId.value = notaId;
  }
};

const verDetalhesNota = (nota) => {
  // Idealmente, navegar para uma rota de detalhes ou abrir um modal
  console.log("Detalhes da Nota:", nota); // Log para debug
  alert(`Detalhes da Nota #${nota.id}\nCliente: ${getClienteNome(nota.clienteId)}\nTotal: R$ ${nota.valorTotal.toFixed(2)}\n(Implementar visualização completa)`);
  menuAbertoNotaId.value = null;
};

const excluirNota = async (nota) => {
  if (confirm(`Tem certeza que deseja excluir a Nota Fiscal #${nota.id}? Esta ação não pode ser desfeita.`)) {
    try {
      await api.delete(`/notafiscal/${nota.id}`);
      alert("Nota Fiscal excluída com sucesso!"); // Melhorar feedback
      await buscarNotas(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao excluir nota fiscal:", error);
      alert("Falha ao excluir nota fiscal. Verifique o console."); // Melhorar feedback
    }
  }
  menuAbertoNotaId.value = null;
};

// --- Funções Auxiliares ---
const getClienteNome = (clienteId) => {
    const cliente = clientes.value.find(c => c.clienteId === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
};

const formatarData = (dataISO) => {
    if (!dataISO) return 'Data indisponível';
    try {
        return new Date(dataISO).toLocaleDateString('pt-BR');
    } catch (e) {
        return 'Data inválida';
    }
};

// --- Ciclo de Vida ---
onMounted(() => {
  buscarDadosIniciais();
});

// Fechar menu ao clicar fora
document.addEventListener('click', (event) => {
  const menuContainer = document.querySelector('.actions-menu-container');
  if (menuContainer && !menuContainer.contains(event.target)) {
    menuAbertoNotaId.value = null;
  }
});

</script>

<style scoped>
/* Estilos para o formulário de nota */
.nota-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nota-form h3, .nota-form h4 {
  margin-bottom: 15px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
}

.form-group select,
.item-row select,
.item-row input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px; /* Espaço entre elementos na linha */
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px; /* Espaçamento entre itens */
  margin-bottom: 10px;
  flex-wrap: wrap; /* Permite quebrar linha em telas menores */
}

.item-row select {
    flex-grow: 1; /* Ocupa espaço disponível */
    min-width: 200px; /* Largura mínima */
}

.item-row input[type="number"] {
    width: 80px; /* Largura fixa para quantidade */
}

.item-row span {
    font-weight: 500;
    min-width: 120px; /* Espaço para total do item */
}

.remove-item-btn {
  background-color: #dc3545; /* Vermelho */
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-item-btn:hover {
  background-color: #b02a37;
}

.add-item-btn {
  background-color: #0d6efd; /* Azul */
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  font-size: 14px;
}

.add-item-btn:hover {
  background-color: #0b5ed7;
}

.nota-total {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    text-align: right;
}

.nota-form button[type="submit"] {
    margin-top: 15px;
    /* Estilos já definidos em main.css ou aqui */
}

/* Estilos para a lista de notas (reutilizar de main.css) */
.notas-lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* nota-card já estilizado em main.css */
.nota-card {
    /* Estilos base já devem vir de main.css */
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.nota-info small {
    display: block;
    margin-top: 4px;
}

/* Estilos para o menu de ações (reutilizados/adaptados) */
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
  min-width: 140px; /* Aumentado para caber texto */
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

.nota-card .actions-menu-container > button {
  padding: 0 8px;
}

/* Estilos para loading e empty state */
[v-if="loadingBusca"],
[v-else-if="notas.length === 0"] {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
</style>
