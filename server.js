const app = require("./api/index");
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log("LXWIS API running at http://localhost:" + port));
