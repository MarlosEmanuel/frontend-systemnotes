// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'

createApp(App)
  .use(router) // <== Usa o router
  .mount('#app')
