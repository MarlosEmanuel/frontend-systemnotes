// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import ClientesView from '../views/ClientesView.vue'
import ProdutosView from '../views/ProdutosView.vue'
import NotasFiscaisView from '../views/NotaFiscalView.vue'

const routes = [
  { path: '/', redirect: '/clientes' },
  { path: '/clientes', component: ClientesView },
  { path: '/produtos', component: ProdutosView },
  { path: '/notasfiscais', component: NotasFiscaisView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
