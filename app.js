const http = require("http");
const { socketInitialize } = require("./socket.js");
const app = require("./express.js");
const port = process.env.PORT || 3000;

const server = http.createServer(app);

socketInitialize(server);

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
