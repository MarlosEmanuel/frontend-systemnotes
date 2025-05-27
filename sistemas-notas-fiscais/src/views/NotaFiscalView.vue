<template>
  <div>
    <!-- Formulário de Criação de Nota -->
    <div class="form-container nota-form">
      <h3>Criar Nova Nota Fiscal</h3>
      <form @submit.prevent="criarNota">
        <div class="form-group">
          <label for="clienteSelect">Cliente</label>
          <select
            id="clienteSelect"
            v-if="clientes.length > 0"
            v-model="novaNota.clienteId"
            required
          >
            <option disabled value="">Selecione um cliente</option>
            <option
              v-for="c in clientes"
              :key="c.clienteId"
              :value="String(c.clienteId)"
            >
              {{ c.nome }}
            </option>
          </select>
          <div v-else>Carregando clientes...</div>
          <p><small>Cliente selecionado: "{{ novaNota.clienteId }}"</small></p>
        </div>

        <h4>Itens da Nota</h4>
        <div class="nota-items">
          <div
            v-for="(item, index) in novaNota.items"
            :key="index"
            class="item-row"
          >
            <select v-model="item.produtoId" required>
              <option disabled value="">Selecione produto</option>
              <option v-for="p in produtos" :key="p.id" :value="String(p.id)">
                {{ p.nome }} (R$ {{ formatarPreco(p.precoUnitario) }})
              </option>
            </select>
            <input
              type="number"
              v-model.number="item.quantidade"
              placeholder="Qtd."
              min="1"
              max="9999"
              required
            />
            <span>Total Item: R$ {{ calcularTotalItem(item).toFixed(2) }}</span>
            <button
              type="button"
              @click.prevent="removerItem(index)"
              class="remove-item-btn"
            >
              Remover
            </button>
          </div>
          <button type="button" @click="adicionarItem" class="add-item-btn">
            Adicionar Produto
          </button>
        </div>

        <div class="nota-total">
          <strong>Total da Nota: R$ {{ calcularTotalNota().toFixed(2) }}</strong>
        </div>

        <button type="submit" :disabled="loadingCriacao">
          {{ loadingCriacao ? "Criando..." : "Criar Nota" }}
        </button>
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
          <small>Cliente: {{ n.clienteNome || "Cliente não informado" }}</small>
          <small>Data: {{ formatarData(n.dataEmissao) }}</small>
          <small>
            Total: R$
            {{ n.valorTotal ? n.valorTotal.toFixed(2) : "0.00" }}
          </small>
          <div>
            <strong>Itens:</strong>
            <ul>
              <li v-for="item in n.itemNotaFiscalResponse" :key="item.id">
                {{ item.nome }} - Quantidade: {{ item.quantidade }} - Preço
                unitário: R$ {{ formatarPreco(item.precoUnitario) }}
              </li>
            </ul>
          </div>
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
import { ref, onMounted, watch } from "vue";
import api from "@/services/api";

const novaNota = ref({
  clienteId: "",
  items: [{ produtoId: "", quantidade: 1 }],
});
const notas = ref([]);
const clientes = ref([]);
const produtos = ref([]);
const loadingBusca = ref(false);
const loadingCriacao = ref(false);
const menuAbertoNotaId = ref(null);

const buscarDadosIniciais = async () => {
  loadingBusca.value = true;
  menuAbertoNotaId.value = null;
  try {
    const [resClientes, resProdutos, resNotas] = await Promise.all([
      api.get("/clientes"),
      api.get("/produtos"),
      api.get("/notafiscal"),
    ]);
    clientes.value = resClientes.data || [];
    produtos.value = resProdutos.data || [];
    notas.value = resNotas.data || [];

    // Definir clienteId inicial para o primeiro cliente disponível
    if (clientes.value.length > 0) {
      novaNota.value.clienteId = String(clientes.value[0].clienteId);
    } else {
      novaNota.value.clienteId = "";
    }
  } catch (error) {
    console.error("Erro ao buscar dados iniciais:", error);
    alert("Falha ao carregar dados para a página de notas fiscais.");
    clientes.value = [];
    produtos.value = [];
    notas.value = [];
    novaNota.value.clienteId = "";
  } finally {
    loadingBusca.value = false;
  }
};

const buscarNotas = async () => {
  loadingBusca.value = true;
  menuAbertoNotaId.value = null;
  try {
    const resNotas = await api.get("/notafiscal");
    notas.value = resNotas.data || [];
  } catch (error) {
    console.error("Erro ao buscar notas fiscais:", error);
    alert("Falha ao recarregar a lista de notas fiscais.");
  } finally {
    loadingBusca.value = false;
  }
};

watch(clientes, (newClientes) => {
  const ids = newClientes.map((c) => String(c.clienteId));
  if (!ids.includes(novaNota.value.clienteId)) {
    novaNota.value.clienteId = "";
  }
});

const adicionarItem = () => {
  novaNota.value.items.push({ produtoId: "", quantidade: 1 });
};

const removerItem = (index) => {
  if (novaNota.value.items.length > 1) {
    novaNota.value.items.splice(index, 1);
  }
};

const formatarPreco = (valor) => {
  const num = Number(valor);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};

const getProdutoPreco = (produtoId) => {
  const produto = produtos.value.find((p) => p.id === produtoId);
  return produto ? produto.precoUnitario : 0;
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
  console.log("Dados para envio:", JSON.stringify(novaNota.value, null, 2));

  if (
    !novaNota.value.clienteId ||
    novaNota.value.clienteId === "undefined" ||
    novaNota.value.clienteId === ""
  ) {
    alert("Selecione um cliente válido.");
    return;
  }

  if (
    novaNota.value.items.length === 0 ||
    novaNota.value.items.some(
      (item) =>
        !item.produtoId ||
        item.produtoId === "" ||
        !item.quantidade ||
        item.quantidade <= 0
    )
  ) {
    alert(
      "Preencha todos os itens da nota corretamente (produto e quantidade > 0)."
    );
    return;
  }

  loadingCriacao.value = true;
  try {
    const payload = {
      clienteId: String(novaNota.value.clienteId),
      items: novaNota.value.items.map((item) => ({
        produtoId: String(item.produtoId),
        quantidade: Number(item.quantidade) > 0 ? Number(item.quantidade) : 1,
      })),
    };
    await api.post("/notafiscal", payload);
    alert("Nota Fiscal criada com sucesso!");
    novaNota.value = { clienteId: "", items: [{ produtoId: "", quantidade: 1 }] };
    await buscarNotas();
  } catch (error) {
    console.error("Erro ao criar nota fiscal:", error);
    alert("Falha ao criar nota fiscal. Verifique o console.");
  } finally {
    loadingCriacao.value = false;
  }
};

const toggleMenu = (notaId) => {
  menuAbertoNotaId.value = menuAbertoNotaId.value === notaId ? null : notaId;
};

const verDetalhesNota = (nota) => {
  alert(
    `Detalhes da Nota #${nota.id}\nCliente: ${
      nota.clienteNome || "Cliente não informado"
    }\nTotal: R$ ${nota.valorTotal?.toFixed(2) ?? "0.00"}\n(Implementar visualização completa)`
  );
  menuAbertoNotaId.value = null;
};

const excluirNota = async (nota) => {
  if (
    confirm(
      `Tem certeza que deseja excluir a Nota Fiscal #${nota.id}? Esta ação não pode ser desfeita.`
    )
  ) {
    try {
      await api.delete(`/notafiscal/${nota.id}`);
      alert("Nota Fiscal excluída com sucesso!");
      await buscarNotas();
    } catch (error) {
      console.error("Erro ao excluir nota fiscal:", error);
      alert("Falha ao excluir nota fiscal. Verifique o console.");
    }
  }
  menuAbertoNotaId.value = null;
};

const formatarData = (dataISO) => {
  if (!dataISO) return "-";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  buscarDadosIniciais();
});

// Fecha menu ao clicar fora
document.addEventListener("click", (event) => {
  const menuContainers = document.querySelectorAll(".actions-menu-container");
  let clickedInsideMenu = false;
  menuContainers.forEach((container) => {
    if (container.contains(event.target)) {
      clickedInsideMenu = true;
    }
  });
  if (!clickedInsideMenu) {
    menuAbertoNotaId.value = null;
  }
});
</script>

<style scoped>
.nota-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nota-form h3,
.nota-form h4 {
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label,
.item-row label {
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
  margin-right: 10px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.item-row select {
  flex-grow: 1;
  min-width: 200px;
}

.item-row input[type="number"] {
  width: 80px;
}

.item-row span {
  font-weight: 500;
  min-width: 120px;
}

.remove-item-btn {
  background-color: #dc3545;
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
  background-color: #0d6efd;
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
}

.notas-lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.nota-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  padding: 15px 20px;
  position: relative;
}

.nota-info small {
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 140px;
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

[v-if="loadingBusca"],
[v-else-if="notas.length === 0"] {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
</style>
