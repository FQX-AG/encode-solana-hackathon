const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();
const API_KEY = process.env.IRONFORGE_API_KEY;
const TARGET_URL = `https://rpc.ironforge.network/devnet?apiKey=${API_KEY}`;

if (!API_KEY) {
  console.error("ERROR: IRONFORGE_API_KEY is not defined in .env file.");
  process.exit(1);
}

app.use(express.json());

app.use(
  "/",
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    ws: true,
    onProxyReq: (proxyReq, req, res) => {
      console.log("============ Modified Proxy Request ============");
      console.log("Modified Request Headers:", proxyReq.getHeaders());
      console.log("============ Proxy Request ============");
      console.log("Request Body:", req.body);
      console.log("Request Headers:", req.headers);
      proxyReq.setHeader("Connection", "keep-alive");
    },
    logLevel: "debug",
    onError: (err, req, res) => {
      console.error("Proxy Error:", err);
      res.status(500).send("Proxy encountered an error");
    },
  })
);

app.listen(8080, () => {
  console.log(`Server is running on port 8080`);
});
