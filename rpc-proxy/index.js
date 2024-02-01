const express = require("express");
const {
  createProxyMiddleware,
  responseInterceptor,
} = require("http-proxy-middleware");
require("dotenv").config();

const app = express();
const API_KEY = process.env.IRONFORGE_API_KEY;
const TARGET_URL = `https://rpc.ironforge.network/devnet?apiKey=${API_KEY}`;

app.use(express.json());

app.use(
  "/",
  createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    ws: true,
    onProxyReq: (proxyReq, req, res) => {
      console.log("============");
      console.log(req.body);
    },
    logLevel: "debug",
  })
);

app.listen(8080, () => {
  console.log(`Server is running on port 8080`);
});
