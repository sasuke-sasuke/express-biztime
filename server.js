/** Server startup for BizTime. */
const PORT = 3000;

const app = require("./app");

app.listen(PORT, function () {
  console.log(`Listening on Port ${PORT}`);
});
