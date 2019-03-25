"use strict";

/* istanbul ignore next */

/**
 * @this OkanjoServer
 */
module.exports = function() {

    this.hapi.route({
        method: 'GET',
        path: '/docs/json/full',
        handler: (request, h) => {
            const docBlob = this.app.services.docs.getRouteTable();
            return h
                .response(JSON.stringify(docBlob, null, '  '))
                .type('application/json')
            ;
        },
        config: {
            tags: ['Excluded']
        }
    });


    this.hapi.route({
        method: 'GET',
        path: '/docs/markdown',
        handler: (request, h) => {
            return h
                .response(this.app.services.docs.generateMarkdown(!!request.query.private))
                .header('content-type', 'text/markdown; charset=UTF-8')
            ;
        },
        config: {
            tags: ['Excluded']
        }
    });


    this.hapi.route({
        method: 'GET',
        path: '/docs',
        handler: (request, h) => {
            return h
                .response(this.app.services.docs.getDocsPageMarkupTemplate({
                    // cdn: 'http://localhost:3002'
                    cdn: 'http://developer.okanjo.com'
                }))
                .header('content-type', 'text/html; charset=UTF-8')
            ;
        },
        config: {
            tags: ['Excluded']
        }
    });

    this.hapi.route({
        method: 'GET',
        path: '/docs/json',
        handler: (request, h) => {
            const docBlob = this.app.services.docs.getPublicRouteTable();
            return h
                .response(JSON.stringify(docBlob, null, '  '))
                .type('application/json')
            ;
        },
        config: {
            tags: ['Excluded']
        }
    });

};