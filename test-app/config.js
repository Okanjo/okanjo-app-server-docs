const Path = require('path');
module.exports = {
    webServer: {

        // HAPI global options
        hapiServerOptions: {
            routes: {
                cors: true, // always allow CORS - we're an API!
                jsonp: 'callback', // allow transposition of responses to JSONP callbacks when desired
                validate: {
                    options: {
                        // Show all errors with the request, not just the first one (great for form error presentation)
                        abortEarly: false,

                        // Don't get hung up on unknown garbage
                        allowUnknown: true,
                        stripUnknown: true
                    }
                },
                payload: {
                    allow: [
                        'application/json'
                        //'application/x-www-form-urlencoded',
                        //'application/octet-stream',
                        //'text/*',
                        //'multipart/form-data',
                    ]
                }
            },

            // Basic config
            port: 3001,
        },

        drainTime: 1, // how long to wait to drain connection before killing the socket on shutdown (in ms)

        // Worker config
        workers: 1, // How many workers to maintain at any given time
        autoReload: false, // Whether to recycle the workers when server-side changes are made (good for development)

        // Route config
        routePath: Path.join(__dirname, 'routes'),

        // Socket.io config
        webSocketEnabled: false, // Whether socket.io is bound to the web server port

        // View handler options
        viewHandlerEnabled: false, // Whether the server should even do view handing at all √

        // Static file handler options
        staticHandlerEnabled: false // Whether to enable static asset serving
    }
};