<template>
    <div>
      <h2>Clientes</h2>
      <form @submit.prevent="salvarCliente">
        <input v-model="cliente.nome" placeholder="Nome" required />
        <input v-model="cliente.cpfOuCnpj" placeholder="CPF ou CNPJ" required />
        <input v-model="cliente.endereco" placeholder="Endereço" required />
        <input v-model="cliente.email" placeholder="Email" required />
        <button type="submit">Salvar</button>
      </form>
      <ul>
        <li v-for="c in clientes" :key="c.clienteId">{{ c.nome }} - {{ c.email }}</li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import api from '@/services/api'
  
  const cliente = ref({ nome: '', cpfOuCnpj: '', endereco: '', email: '' })
  const clientes = ref([])
  
  const buscarClientes = async () => {
    const res = await api.get('/clientes')
    clientes.value = res.data
  }
  
  const salvarCliente = async () => {
    await api.post('/clientes', cliente.value)
    cliente.value = { nome: '', cpfOuCnpj: '', endereco: '', email: '' }
    buscarClientes()
  }
  
  onMounted(() => buscarClientes())
  </script>