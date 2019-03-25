
//
// You can verify visually that everything is working like so:
//
// $ node test-app/verify.js
//

const Repl = require('repl');
const OkanjoApp = require('okanjo-app');
const OkanjoWebServer = require('okanjo-app-server');

const DocService = require('../DocService');
const authStrategies = require('../test-app/extensions/auth_strategies');

const config = require('../test-app/config');

const app = new OkanjoApp(config);

// Hapi Authentication Strategies Enumeration
app.authModes = {
    keyOnly: 'only_api_key_required',
    sessionAndKey: 'session_and_api_key_required',
    placementKey: 'placement_key_required'
};

app.services = {
    docs: new DocService(app, null) // stub - needs server
};

const server = new OkanjoWebServer(app, config.webServer, {
    extensions: [
        authStrategies
    ]
});

server.start().then(() => {
    console.log(`SERVER RUNNING! ${server.hapi.info.uri}`); // eslint-disable-line no-console
});

// Assign the server
app.services.docs.server = server;



// Expose a REPL for debugging
const replServer = Repl.start({prompt: '> '});
replServer.context.app = app;
replServer.context.config = config;
replServer.context.server = server;

