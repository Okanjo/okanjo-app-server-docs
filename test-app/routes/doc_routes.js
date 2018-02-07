"use strict";

/* istanbul ignore next */

/**
 * @this OkanjoServer
 */
module.exports = function() {

    this.hapi.route({
        method: 'GET',
        path: '/docs/json/full',
        handler: (request, reply) => {
            const docBlob = this.app.services.docs.getRouteTable(this);
            reply(JSON.stringify(docBlob, null, '  ')).type('application/json');
        },
        config: {
            tags: ['Excluded']
        }
    });


    this.hapi.route({
        method: 'GET',
        path: '/docs/markdown',
        handler: (request, reply) => {
            reply(this.app.services.docs.generateMarkdown(!!request.query.private)).header('content-type', 'text/markdown; charset=UTF-8');
        },
        config: {
            tags: ['Excluded']
        }
    });


    this.hapi.route({
        method: 'GET',
        path: '/docs',
        handler: (request, reply) => {
            reply(this.app.services.docs.getDocsPageMarkupTemplate()).header('content-type', 'text/html; charset=UTF-8');
        },
        config: {
            tags: ['Excluded']
        }
    });

    this.hapi.route({
        method: 'GET',
        path: '/docs/json',
        handler: (request, reply) => {
            const docBlob = this.app.services.docs.getPublicRouteTable();
            reply(JSON.stringify(docBlob, null, '  ')).type('application/json');
        },
        config: {
            tags: ['Excluded']
        }
    });

};