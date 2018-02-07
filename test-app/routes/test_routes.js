"use strict";

const Joi = require('joi');

/* istanbul ignore next */
/**
* @this OkanjoWebServer
*/
module.exports = function() {
    const app = this.app;

    const handler = (request, reply) => {
        reply(this.app.response.ok());
    };


    // Test param definitions
    app.fields = {

        // Common fields
        id: Joi.string().token(), // MISSING - don't crash if gone .description('Object identifier.'),

        skip: Joi.number().integer().min(0).default(0).description('Skips this many records. Used for pagination.'),
        take: Joi.number().integer().min(1).max(50).default(25).description('Returns this many records. Used for pagination.'),

        // Example Product fields
        resourceName: Joi.string().trim().min(1).max(140).description('Name of the product.'),
        description: Joi.string().trim().min(1).max(40960).description('Description of the product.'),
        price: Joi.number().greater(0).precision(4).description('Price of the product.'),
        buy_url: Joi.string().uri({ scheme: ['http','https'] }).description('Product detail page.'),
        image_urls: Joi.array().items(Joi.string().uri({ scheme: ['http','https'] })).unique().max(25).description('Product images. The first image will be used for listings and should be a square. Remaining images are for additional detail.'),
        buy_url_track_param: Joi.string().trim().min(1).max(250).allow(null).description('Name of parameter to append to buy_url for campaign tracking'),

        currency: Joi.string().alphanum().length(3).uppercase().description('ISO 4217 currency code.').example('USD')

    };


    this.hapi.route({
        method: 'GET',
        path: '/products',
        handler,
        config: {
            auth: app.authModes.sessionAndKey,
            validate: {
                query: {
                    store_id: app.fields.id.optional(),
                    skip: app.fields.skip.optional(),
                    take: app.fields.take.optional()
                }
            },
            id: 'product.list',
            description: "Lists products",
            tags: ["Products", "List products"]
        }
    });

    this.hapi.route({
        method: 'POST',
        path: '/products',
        handler,
        config: {
            auth: app.authModes.sessionAndKey,
            validate: {
                payload: {
                    // Where to post the product
                    store_id: app.fields.id.required(),

                    // Required
                    name: app.fields.resourceName.required(),
                    description: app.fields.description.required(),
                    image_urls: app.fields.image_urls.required(),
                    price: app.fields.price.required(),
                    buy_url: app.fields.buy_url.required(),
                    buy_url_track_param: app.fields.buy_url_track_param.optional(),

                    currency: app.fields.currency.optional().default('USD')
                }
            },
            id: 'product.create',
            description: "Creates a product",
            tags: ["Products", "Create a product"]
        }
    });

    this.hapi.route({
        method: 'GET',
        path: '/products/{product_id}',
        handler,
        config: {
            auth: app.authModes.keyOnly,
            validate: {
                params: {
                    product_id: app.fields.id.required()
                }
            },
            id: 'product.retrieve',
            description: "Retrieves a product",
            tags: ["Products", "Retrieve a product"]
        }
    });

    this.hapi.route({
        method: 'GET',
        path: '/other/auth/strategy',
        handler,
        config: {
            auth: app.authModes.placementKey,
            id: 'test.unknown_strategy',
            description: "Deletes a product",
            tags: ["Products", "Delete a product"]
        }
    });

    this.hapi.route({
        method: 'PUT',
        path: '/products/{product_id}',
        handler,
        config: {
            auth: app.authModes.sessionAndKey,
            validate: {
                params: {
                    product_id: app.fields.id.required()
                },
                payload: {
                    // Required
                    name: app.fields.resourceName.optional(),
                    description: app.fields.description.optional(),
                    image_urls: app.fields.image_urls.optional(),
                    price: app.fields.price.optional(),
                    buy_url: app.fields.buy_url.optional(),
                    buy_url_track_param: app.fields.buy_url_track_param.optional(),

                    currency: app.fields.currency.optional()

                }
            },
            id: 'product.update',
            description: "Updates a product",
            tags: ["Products", "Update a product"]
        }
    });

    this.hapi.route({
        method: 'DELETE',
        path: '/products/{product_id}',
        handler,
        config: {
            auth: app.authModes.sessionAndKey,
            validate: {
                params: {
                    product_id: app.fields.id.required()
                }
            },
            id: 'product.delete',
            description: "Deletes a product",
            tags: ["Products", "Delete a product"]
        }
    });


    this.hapi.route({
        method: 'GET',
        path: '/other/auth/optional',
        handler,
        config: {
            auth: {
                mode: 'optional',
                strategies: [app.authModes.placementKey]
            },
            id: 'test.optional_strategy',
            description: "Deletes a product",
            tags: ["Products", "Delete a product"]
        }
    });



    this.hapi.route({
        method: 'GET',
        path: '/other/auth/dup/action',
        handler,
        config: {
            auth: {
                mode: 'optional',
                strategies: [app.authModes.placementKey]
            },
            id: 'test2.optional_strategy',
            description: "Deletes a product",
            tags: ["Products", "Delete a product"]
        }
    });

    this.hapi.route({
        method: 'GET',
        path: '/no/docs',
        handler,
        config: {
        }
    });


    this.hapi.route({
        method: 'GET',
        path: '/plurality/1',
        handler,
        config: {
            id: 'productmatch.poop',
            description: "Whatever",
            tags: ["ProductMatch", "Poop on stuff"]
        }
    });

    this.hapi.route({
        method: 'GET',
        path: '/grammar/1',
        handler,
        config: {
            id: 'property.create',
            description: "Whatever",
            tags: ["Property", "Create a Property"]
        }
    });

    this.hapi.route({
        method: 'DELETE',
        path: '/object/in/default/test',
        handler,
        config: {
            validate: {
                query: {
                    val: Joi.object().default({a: "hi", b: 42}).description('Example').optional()
                }
            },
            id: 'test.delete',
            description: "Whatever",
            tags: ["Testy", "Generic Tests"]
        }
    });

    this.hapi.route({
        method: 'PUT',
        path: '/payload/no/presense',
        handler,
        config: {
            validate: {
                payload: {
                    val: Joi.string().description('poop')
                }
            },
            id: 'test.presense',
            description: "Whatever",
            tags: ["Testy", "Presense Tests"]
        }
    });

};