import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";

const app = createApp();
const { port } = loadConfig();

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
