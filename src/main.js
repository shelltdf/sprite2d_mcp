import { createApp } from "vue";
import { createPinia, setActivePinia } from "pinia";
import App from "./App.vue";
import { i18n } from "./i18n/index.js";
import { useUiStore } from "./stores/ui.js";
import "./styles/win-shell.css";
import "./styles/theme.css";

const app = createApp(App);
const pinia = createPinia();
setActivePinia(pinia);
app.use(pinia);
app.use(i18n);
useUiStore().initTheme();
app.mount("#app");
