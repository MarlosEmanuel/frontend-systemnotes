<template>
    <div>
      <h2>Produtos</h2>
      <form @submit.prevent="salvarProduto">
        <input v-model="produto.nome" placeholder="Nome" required />
        <input v-model.number="produto.preco" placeholder="Preço" required />
        <input v-model="produto.descricao" placeholder="Descrição" />
        <input v-model.number="produto.estoque" placeholder="Estoque" required />
        <button type="submit">Salvar</button>
      </form>
      <ul>
        <li v-for="p in produtos" :key="p.id">{{ p.nome }} - R$ {{ p.preco }}</li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import api from '@/services/api'
  
  const produto = ref({ nome: '', preco: 0, descricao: '', estoque: 0 })
  const produtos = ref([])
  
  const buscarProdutos = async () => {
    const res = await api.get('/produtos')
    produtos.value = res.data
  }
  
  const salvarProduto = async () => {
    await api.post('/produtos', produto.value)
    produto.value = { nome: '', preco: 0, descricao: '', estoque: 0 }
    buscarProdutos()
  }
  
  onMounted(() => buscarProdutos())
  </script>