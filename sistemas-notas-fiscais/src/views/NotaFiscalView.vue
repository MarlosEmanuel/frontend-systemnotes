<template>
    <div>
      <h2>Nota Fiscal</h2>
      <form @submit.prevent="criarNota">
        <select v-model="nota.clienteId">
          <option v-for="c in clientes" :value="c.clienteId" :key="c.clienteId">{{ c.nome }}</option>
        </select>
  
        <div v-for="(item, index) in nota.items" :key="index">
          <select v-model="item.produtoId">
            <option v-for="p in produtos" :value="p.id" :key="p.id">{{ p.nome }}</option>
          </select>
          <input type="number" v-model.number="item.quantidade" placeholder="Quantidade" min="1" />
          <button @click.prevent="removerItem(index)">Remover</button>
        </div>
  
        <button @click.prevent="adicionarItem">Adicionar Produto</button>
        <button type="submit">Criar Nota</button>
      </form>
  
      <hr />
  
      <ul>
        <li v-for="n in notas" :key="n.id">
          Nota {{ n.id }} - Total: R$ {{ n.valorTotal }} - Cliente: {{ n.clienteNome }}
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import api from '@/services/api'
  
  const nota = ref({ clienteId: '', items: [] })
  const notas = ref([])
  const clientes = ref([])
  const produtos = ref([])
  
  const buscarDados = async () => {
    const resClientes = await api.get('/clientes')
    const resProdutos = await api.get('/produtos')
    const resNotas = await api.get('/notafiscal')
    clientes.value = resClientes.data
    produtos.value = resProdutos.data
    notas.value = resNotas.data
  }
  
  const adicionarItem = () => {
    nota.value.items.push({ produtoId: '', quantidade: 1 })
  }
  
  const removerItem = (index) => {
    nota.value.items.splice(index, 1)
  }
  
  const criarNota = async () => {
    await api.post('/notafiscal', nota.value)
    nota.value = { clienteId: '', items: [] }
    buscarDados()
  }
  
  onMounted(() => buscarDados())
  </script>
  