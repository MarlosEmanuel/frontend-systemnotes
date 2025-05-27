<template>
  <div id="app">
    <aside class="sidebar">
      <h1>Júnior Materiais de Construção</h1>
      <nav>
        <router-link to="/clientes" class="nav-link" active-class="active">Clientes</router-link>
        <router-link to="/produtos" class="nav-link" active-class="active">Produtos</router-link>
        <router-link to="/notasfiscais" class="nav-link" active-class="active">Notas Fiscais</router-link>
      </nav>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>