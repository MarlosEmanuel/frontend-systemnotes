<template>
  <div>
    <!-- Header -->
    <div class="header-top">
      <input type="search" v-model="busca" placeholder="Pesquisar clientes (nome, CPF/CNPJ)" />
      <div>
        <button @click="abrirFormNovoCliente">NOVO CLIENTE</button>
      </div>
    </div>

    <!-- Formulário Novo/Editar Cliente -->
    <div v-if="mostrarFormCliente" class="form-container">
      <h3>{{ formTitulo }}</h3>
      <form @submit.prevent="salvarCliente">
        <label>Nome*</label>
        <input v-model="clienteData.nome" placeholder="Nome completo" required />

        <label>CPF ou CNPJ*</label>
        <input v-model="clienteData.cpfOuCnpj" placeholder="CPF ou CNPJ" required />

        <label>Endereço*</label>
        <input v-model="clienteData.endereco" placeholder="Endereço completo" required />

        <label>Email*</label>
        <input v-model="clienteData.email" type="email" placeholder="email@exemplo.com" required />

        <div class="form-actions">
          <button type="submit" :disabled="loadingSalvar">
            {{ loadingSalvar ? "Salvando..." : "Salvar Cliente" }}
          </button>
          <button type="button" @click="cancelarFormCliente">Cancelar</button>
        </div>
      </form>
    </div>

    <!-- Lista de Clientes -->
    <div v-if="!mostrarFormCliente">
      <div>
        Total de {{ clientesFiltrados.length }} clientes
      </div>

      <div v-if="loadingBusca">Carregando clientes...</div>
      <div v-else-if="clientes.length === 0">Nenhum cliente encontrado.</div>

      <div v-else class="clients-list">
        <div
          v-for="cliente in clientesFiltrados"
          :key="cliente.clienteId"
          class="client-card"
          :class="statusClassBackend(cliente)"
        >
          <div class="avatar" :class="statusClassBackend(cliente)">
            {{ cliente.nome ? cliente.nome.charAt(0).toUpperCase() : "?" }}
          </div>
          <div class="client-info">
            <strong>{{ cliente.nome }}</strong>
            <small>CPF/CNPJ: {{ cliente.cpfOuCnpj }}</small>
            <small>Email: {{ cliente.email }}</small>
            <small>Endereço: {{ cliente.endereco }}</small>
          </div>
          <div class="actions-menu-container">
            <button @click="toggleMenu(cliente.clienteId)">⋮</button>
            <div v-if="menuAbertoClienteId === cliente.clienteId" class="actions-menu">
              <button @click="editarCliente(cliente)">Editar</button>
              <button @click="excluirCliente(cliente)">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";

const busca = ref("");
const clientes = ref([]);
const loadingBusca = ref(false);
const loadingSalvar = ref(false);
const mostrarFormCliente = ref(false);
const editandoCliente = ref(false);
const clienteData = ref({});
const menuAbertoClienteId = ref(null);

const formTitulo = computed(() => (editandoCliente.value ? "Editar Cliente" : "Novo Cliente"));

const resetForm = () => {
  clienteData.value = {
    nome: "",
    cpfOuCnpj: "",
    endereco: "",
    email: "",
  };
};

const listarClientes = async () => {
  loadingBusca.value = true;
  menuAbertoClienteId.value = null;
  try {
    const res = await api.get("/clientes");
    clientes.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    alert("Falha ao carregar clientes. Verifique o console.");
    clientes.value = [];
  } finally {
    loadingBusca.value = false;
  }
};

const clientesFiltrados = computed(() => {
  const termoBusca = busca.value.toLowerCase();
  return clientes.value.filter((c) => {
    const nomeOk = c.nome?.toLowerCase().includes(termoBusca);
    const cpfCnpjOk = c.cpfOuCnpj?.toLowerCase().includes(termoBusca);
    return nomeOk || cpfCnpjOk;
  });
});

const statusClassBackend = () => "status-other";

const abrirFormNovoCliente = () => {
  resetForm();
  editandoCliente.value = false;
  mostrarFormCliente.value = true;
  menuAbertoClienteId.value = null;
};

const cancelarFormCliente = () => {
  mostrarFormCliente.value = false;
  editandoCliente.value = false;
};

const salvarCliente = async () => {
  if (
    !clienteData.value.nome ||
    !clienteData.value.cpfOuCnpj ||
    !clienteData.value.endereco ||
    !clienteData.value.email
  ) {
    alert("Todos os campos marcados com * são obrigatórios.");
    return;
  }
  loadingSalvar.value = true;
  const payload = {
    nome: clienteData.value.nome,
    cpfOuCnpj: clienteData.value.cpfOuCnpj,
    endereco: clienteData.value.endereco,
    email: clienteData.value.email,
  };
  try {
    if (editandoCliente.value) {
      await api.put(`/clientes/${clienteData.value.clienteId}`, payload);
      alert("Cliente atualizado com sucesso!");
    } else {
      await api.post("/clientes", payload);
      alert("Cliente salvo com sucesso!");
    }
    mostrarFormCliente.value = false;
    editandoCliente.value = false;
    await listarClientes();
  } catch (error) {
    console.error("Erro ao salvar cliente:", error);
    const errorMsg = error.response?.data?.message || error.message || "Erro desconhecido";
    alert(`Falha ao salvar cliente: ${errorMsg}`);
  } finally {
    loadingSalvar.value = false;
  }
};

const toggleMenu = (clienteId) => {
  menuAbertoClienteId.value =
    menuAbertoClienteId.value === clienteId ? null : clienteId;
};

const editarCliente = (cliente) => {
  clienteData.value = {
    clienteId: cliente.clienteId,
    nome: cliente.nome,
    cpfOuCnpj: cliente.cpfOuCnpj,
    endereco: cliente.endereco,
    email: cliente.email,
  };
  editandoCliente.value = true;
  mostrarFormCliente.value = true;
  menuAbertoClienteId.value = null;
};

const excluirCliente = async (cliente) => {
  if (confirm(`Tem certeza que deseja excluir o cliente ${cliente.nome}?`)) {
    try {
      await api.delete(`/clientes/${cliente.clienteId}`);
      alert("Cliente excluído com sucesso!");
      await listarClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      const errorMsg = error.response?.data?.message || error.message || "Erro desconhecido";
      alert(`Falha ao excluir cliente: ${errorMsg}`);
    }
  }
  menuAbertoClienteId.value = null;
};

onMounted(() => {
  listarClientes();
});

document.addEventListener("click", (event) => {
  const clickedInsideMenu = event.target.closest(".actions-menu-container");
  if (!clickedInsideMenu) {
    menuAbertoClienteId.value = null;
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
.form-actions {
  margin-top: 15px;
}
.form-actions button {
  margin-right: 10px;
}

.clients-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.client-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  border-left: 4px solid #6c757d;
}

.status-other {
  border-color: #6c757d;
}

.avatar {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background-color: #eee;
  flex-shrink: 0;
  overflow: hidden;
  border: 3px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 20px;
  color: #555;
}

.client-info {
  flex-grow: 1;
}

.client-info strong {
  display: block;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
}

.client-info small {
  display: block;
  font-size: 13px;
  color: #555;
  margin-top: 2px;
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

.client-card .actions-menu-container > button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #888;
  padding: 0 8px;
  transition: color 0.3s ease;
}
.client-card .actions-menu-container > button:hover {
  color: #0d6efd;
}

[v-if="loadingBusca"],
[v-else-if="clientes.length === 0"] {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
</style>
