const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:8081/api',
            changeOrigin: true,
            logger: console, // Use console for basic logging to the terminal
            logLevel: 'debug', // Set the desired log level (e.g., 'debug', 'info', 'warn', 'error')

            on: {
                proxyReq: (proxyReq, req, res) => {

                },
            },
        })
    );
};