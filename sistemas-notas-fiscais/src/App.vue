<template>
    <div id="app">
      <nav>
        <router-link to="/clientes">Clientes</router-link> |
        <router-link to="/produtos">Produtos</router-link> |
        <router-link to="/notasfiscais">Notas Fiscais</router-link>
      </nav>
      <router-view />
    </div>
</template>
  