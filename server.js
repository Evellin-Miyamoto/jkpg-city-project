const express = require("express");
const app = express();
const PORT = 4000;
app.get("/", (req, res) => {
  res.send("Welcome to the REST API!");
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.use("/", express.static("public"));
