const env = {
  CORS_ALLOW_ORIGIN: process.env.CORS_ALLOW_ORIGIN,
  IRONFORGE_API_KEY: process.env.IRONFORGE_API_KEY,
};

const IRONFORGE_RPC_URL = "https://rpc.ironforge.network/devnet";

async function proxy(request: Request) {
  // If the request is an OPTIONS request, return a 200 response with permissive CORS headers
  // This is required for the Helius RPC Proxy to work from the browser and arbitrary origins
  // If you wish to restrict the origins that can access your Helius RPC Proxy, you can do so by
  // changing the `*` in the `Access-Control-Allow-Origin` header to a specific origin.
  // For example, if you wanted to allow requests from `https://example.com`, you would change the
  // header to `https://example.com`. Multiple domains are supported by verifying that the request
  // originated from one of the domains in the `CORS_ALLOW_ORIGIN` environment variable.
  const supportedDomains = env.CORS_ALLOW_ORIGIN ? env.CORS_ALLOW_ORIGIN.split(",") : undefined;
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
  if (supportedDomains) {
    const origin = request.headers.get("Origin");
    if (origin && supportedDomains.includes(origin)) {
      corsHeaders["Access-Control-Allow-Origin"] = origin;
    }
  } else {
    corsHeaders["Access-Control-Allow-Origin"] = "*";
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const upgradeHeader = request.headers.get("Upgrade");

  if (upgradeHeader || upgradeHeader === "websocket") {
    console.log("UPGRADE", `${IRONFORGE_RPC_URL}?apiKey=${env.IRONFORGE_API_KEY}`);
    return await fetch(`${IRONFORGE_RPC_URL}?apiKey=${env.IRONFORGE_API_KEY}`, request);
  }

  const { pathname, search } = new URL(request.url);
  const payload = await request.text();
  const proxyRequestUrl = `${IRONFORGE_RPC_URL}${pathname}?apiKey=${env.IRONFORGE_API_KEY}${
    search ? `&${search.slice(1)}` : ""
  }`;
  const proxyRequest = new Request(proxyRequestUrl, {
    method: request.method,
    body: payload || null,
    headers: {
      "Content-Type": "application/json",
      // "X-Helius-Cloudflare-Proxy": "true",
    },
  });

  console.log("PROXY", proxyRequestUrl);
  return await fetch(proxyRequest).then((res) => {
    return new Response(res.body, {
      status: res.status,
      headers: corsHeaders,
    });
  });
}

export async function GET(request: Request) {
  return proxy(request);
}

export async function HEAD(request: Request) {
  return proxy(request);
}

export async function POST(request: Request) {
  return proxy(request);
}

export async function PUT(request: Request) {
  return proxy(request);
}

export async function OPTIONS(request: Request) {
  return proxy(request);
}
