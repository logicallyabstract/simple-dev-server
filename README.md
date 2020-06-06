# @logicallyabstract/simple-dev-server

This server is meant to be a way to serve typescript source files directly to a browser. It transpiles typescript and rewrites imports using node's resolve function.

## Getting Started

`npm install --save-dev @logicallyabstract/simple-dev-server`

`npx simple-dev-server --port 3000 --fallback-index /static/index.html`

**Warning** Do not use this to serve a production website. Use this for local development or running tests only.
