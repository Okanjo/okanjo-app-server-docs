/* istanbul ignore next */

/**
 * Register the core authentication mechanisms for use with routes
 * @this OkanjoServer
 */
module.exports = async function() {

    const plugin = require('hapi-auth-basic-key');

    // Register the plugin
    await this.hapi.register(plugin);

    // Register the key-only auth strategy
    this.hapi.auth.strategy(this.app.authModes.keyOnly, 'basic', {
        validate: async (/*request, key, secret, h*/) => {
            // hard coded failure
            return { credentials: null, isValid: false };
        }
    });

    // Register the key-only auth strategy
    this.hapi.auth.strategy(this.app.authModes.placementKey, 'basic', {
        validate: async (/*request, key, secret, h*/) => {
            // hard coded failure
            return { credentials: null, isValid: false };
        }
    });

    // Register session and key strategy
    this.hapi.auth.strategy(this.app.authModes.sessionAndKey, 'basic', {
        validate: async (/*request, key, secret, h*/) => {
            // hard coded failure
            return { credentials: null, isValid: false, error: this.app.response.unauthorized('Session token required') };
        }
    });

};