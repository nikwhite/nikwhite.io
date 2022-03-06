const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    createProxyMiddleware(
      '/signal', {
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  )
  app.use(
    createProxyMiddleware(
      '/signal/connect', {
      target: 'ws://localhost:8080',
      ws: true,
      changeOrigin: true,
    })
  )
};