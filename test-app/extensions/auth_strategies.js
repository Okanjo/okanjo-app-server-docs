/* istanbul ignore next */

/**
 * Register the core authentication mechanisms for use with routes
 * @this OkanjoWebServer
 * @param callback
 */
module.exports = function(callback) {

    const plugin = require('hapi-auth-basic-key');

    // Register the plugin
    this.hapi.register(plugin, (err) => {

        /* istanbul ignore if: not really testable */
        if (err) {
            this.app.report('Failed to load ' + plugin.register.attributes.name, err);
            process.exit(17);
        }

        //
        // Register the key-only auth strategy
        //
        this.hapi.auth.strategy(this.app.authModes.keyOnly, 'basic', {
            validateFunc: (req, key, secret, callback) => {
                // hard coded failure
                callback(err, false, {
                    key: null
                });
            }
        });


        //
        // Register the key-only auth strategy
        //
        this.hapi.auth.strategy(this.app.authModes.placementKey, 'basic', {
            validateFunc: (req, key, secret, callback) => {
                // hard coded failure
                callback(err, false, {
                    key: null
                });
            }
        });


        //
        // Register session and key strategy
        //
        this.hapi.auth.strategy(this.app.authModes.sessionAndKey, 'basic', {
            validateFunc: (req, key, secret, callback) => {
                // hard coded failure
                callback(this.app.response.unauthorized('Session token required'), false, undefined);
            }
        });


        callback();

    });
};