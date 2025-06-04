import { createApp } from "vue";

import 'bootstrap/dist/css/bootstrap.min.css';
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css"; // Importing the Toast CSS
import App from "./App.vue";
import router from "./router"; // Ensure this path matches your router file



const app = createApp(App);

app.use(router);
app.use(Toast);

app.mount("#app");
