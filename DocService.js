"use strict";

class DocService {

    constructor(app, server) {
        this.app = app;
        this.server = server;

        /**
         * Show or hide untagged routes from the docs
         * @type {boolean}
         */
        this.mask_untagged_routes = false;

        this.IGNORE_ROUTE_TEST = /^\/(local|docs)/;

        this.PLURAL_TEST = /s$/;
        this.GRAMMAR_TEST = /y$/;
        this.PLURAL_IGNORE_TEST = /^(productmatch)$/;

        this.CREATE_TEST = /^Create/;
        this.RETRIEVE_TEST = /^Retrieve/;
        this.LIST_TEST = /^List/;
        this.UPDATE_TEST = /^Update/;
        this.DELETE_TEST = /^(Delete|End)/;

        this.title = 'Okanjo API Documentation';
        this.name = 'Okanjo API';
        this.markdownLocation = '/docs/markdown';
        this.googleAnalId = 'UA-36849843-8';
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Helper to convert an auth strategy into a friendly name. Override this!
     * @param strategy
     * @return {*}
     */
    _beautifyAuthStrategy(strategy) {
        switch(strategy) {

            case "only_api_key_required":
                return 'an API key';

            case "session_and_api_key_required":
                return 'an API key and session token';

            /* istanbul ignore next: We don't use unused strategies. */
            default:
                return strategy;
        }
    }

    /**
     * Converts the route authentication strategy into friendly tags. Override this!
     * @param spec
     * @return {Array}
     * @private
     */
    _getAuthComponents(spec) {
        const components = new Set();
        if (spec.auth && spec.auth.mode === "required") {
            spec.auth.strategies.forEach((strategy) => {
                if (strategy === "only_api_key_required") {
                    components.add("api_key");
                } else if (strategy === "session_and_api_key_required") {
                    components.add("api_key");
                    components.add("session_token");
                } else {
                    components.add(strategy);
                }
            });
        }

        return Array.from(components);
    }

    /**
     * Sorts routes by resource, then by action
     * @param a
     * @param b
     * @return {*}
     */
    _routeSorter(a, b) {

        // Sort by resource, then by action
        // resource
        // - create
        // - retrieve
        // - list
        // - update
        // - delete_
        // - others by action alpha

        // Push non-id routes to the bottom
        /* istanbul ignore else: idk */
        if (!a.id) return 0;
        else if (!b.id) return -1;

        const aParts = a.id.split('.');
        const bParts = b.id.split('.');

        const aResource = aParts[0];
        const bResource = bParts[0];

        const aAction = aParts[1];
        const bAction = bParts[1];

        const comparisons = [
            aResource.localeCompare(bResource)
        ];

        const crudActions = ["create", "retrieve", "list", "update", "delete"];

        /* istanbul ignore if: this should be impossible since HAPI won't start with dup ids */
        if (aAction === bAction) {
            comparisons.push(0);
        } else {

            let aFound = 0, bFound = 0;
            crudActions.forEach((action) => {
                if (aAction === action) { comparisons.push(-1); aFound++; }
                if (bAction === action) { comparisons.push(1); bFound++; }
            });

            if (aFound === 0 && bFound > 0) {
                comparisons.push(1);
            } else if (aFound > 0 && bFound === 0) {
                comparisons.push(-1);
            } else {
                comparisons.push(aAction.localeCompare(bAction));
            }
        }

        return comparisons.find((x) => x !== 0) || /* istanbul ignore next: out of scope */ 0;
    }

    /**
     * Removes excluded fields from the given property container, recursively
     * @param container
     * @private
     */
    _removeExcludedFields(container) {
        Object.keys(container).forEach((param) => {
            if ((container[param].description||"TODO").toLowerCase() === 'excluded') {
                delete container[param];
            } else if (container[param].children) {
                // recurse child props
                this._removeExcludedFields(container[param].children);
            }
        });
    }

    /**
     * Gets the routing table as a serializable object
     * @return {Array} Array of normalized route definitions
     */
    getRouteTable() {

        const table = this.server.hapi.table();
        const out = [];

        table.forEach((route) => {
            /* istanbul ignore next: else might not happen if all routes are documented ! */
            if (!this.IGNORE_ROUTE_TEST.test(route.path) && (route.settings.tags ? route.settings.tags.indexOf('Excluded') < 0 : true)) {
                const def = {
                    id: route.settings.id,
                    method: route.method,
                    path: route.path,
                    auth: route.settings.auth,
                    description: route.settings.description,
                    notes: route.settings.notes,
                    tags: route.settings.tags,
                    validation: {
                        params: route.settings.validate.params ? route.settings.validate.params.describe().children : null,
                        query: route.settings.validate.query ? route.settings.validate.query.describe().children : null,
                        payload: route.settings.validate.payload ? route.settings.validate.payload.describe().children : null
                    }
                };

                // Strip excluded fields
                this._removeExcludedFields(def.validation.params || {});
                this._removeExcludedFields(def.validation.query || {});
                this._removeExcludedFields(def.validation.payload || {});

                out.push(def);
            }
        });

        // Return routes sorted by path
        return out.sort(this._routeSorter.bind(this));
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Gets the pluralized version of the resource name (quick and dirty)
     * @param resource
     * @return {*}
     * @private
     */
    _getPuralizedResourceName(resource) {
        if (this.PLURAL_TEST.test(resource) || this.PLURAL_IGNORE_TEST.test(resource)) {
            return resource;
        } else {
            if (this.GRAMMAR_TEST.test(resource)) {
                return resource.replace(this.GRAMMAR_TEST, '') + "ies";
            } else {
                return resource + 's';
            }
        }
    }

    /**
     * Converts a validation group (e.g. params, query, payload) into usable information
     * @param bucket
     * @param params (recursive support)
     * @return {Array}
     * @private
     */
    _convertValidationToParamSpec(bucket, params = []) {
        Object.keys(bucket).forEach((paramName) => {
            const spec = bucket[paramName];
            const param = {
                name: paramName,
                description: spec.description,
                type: spec.type,
                required: (spec.flags || {}).presence === "required",
                default: (spec.flags || {}).default,
                children: []
            };

            if (spec.children) {
                // Add children to the bucket
                this._convertValidationToParamSpec(spec.children, param.children);
            }

            params.push(param);
        });
        return params;
    }

    /**
     * Gets only the publicly accessible route definitions
     * @return {Array}
     */
    getPublicRouteTable() {
        const routeTable = this.getRouteTable();
        const routes = [];

        routeTable.forEach((spec) => {
            if (spec.id) {

                const idParts = spec.id.split('.');
                const resource = idParts[0];
                const action = idParts[1];

                const route = {
                    id: spec.id,

                    resource: {
                        name: resource,
                        pretty: spec.tags[0],
                        pluralized: this._getPuralizedResourceName(resource)
                    },

                    action: {
                        name: action,
                        short_description: spec.tags[1],
                        long_description: spec.description
                    },

                    endpoint: {
                        method: spec.method,
                        path: spec.path
                    },

                    arguments: {
                        params: this._convertValidationToParamSpec(spec.validation.params || {}),
                        query: this._convertValidationToParamSpec(spec.validation.query || {}),
                        payload: this._convertValidationToParamSpec(spec.validation.payload || {})
                    },

                    auth: {
                        required: spec.auth ? spec.auth.mode === "required" : false,
                        components: this._getAuthComponents(spec)
                    }
                };

                routes.push(route);
            }
        });

        return routes;
    }

    /**
     * Classify routes into groups: tagged routes, untagged routes, and list of tags
     * @param routes
     * @return {{tagged: Map, untagged: Array, taggedList: Array}}
     */
    _classifyRoutes(routes) {
        // Pull routes tagged routes
        const taggedRoutes = new Map();
        const untaggedRoutes = [];
        const taggedRoutesList = [];

        routes.forEach((route) => {
            /* istanbul ignore else: i hope all routes are documented! */
            if (route.tags) {
                /* istanbul ignore else: there should be no untagged routes, if there are, derp */
                if (route.tags.indexOf('Excluded') < 0 && route.tags.length >= 2) {
                    let resource = taggedRoutes.get(route.tags[0]);
                    if (!resource) {
                        resource = new Map();
                    }

                    let method = resource.get(route.tags[1]);
                    /* istanbul ignore else: you should always organize a route as [Resource] > [Method] */
                    if (!method) {
                        method = route;
                    }
                    resource.set(route.tags[1], method);
                    taggedRoutes.set(route.tags[0], resource);
                    taggedRoutesList.push(route);
                } else {
                    untaggedRoutes.push(route);
                }
            } else if (!this.mask_untagged_routes) {
                untaggedRoutes.push(route);
            }
        });

        return {
            tagged: taggedRoutes,
            untagged: untaggedRoutes,
            taggedList: taggedRoutesList
        };
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Converts a route into a canonical reference name
     * @param route
     * @return {*}
     */
    _canonicalize(route) {
        if (route.tags && route.tags.length >= 2) {
            return `${route.tags[0]} ${route.tags[1]}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
        } else {
            const path = route.path.replace(/[/-{}]/g,'').replace(/ /, '-');
            /* istanbul ignore next: edge case */
            return `route-list-${route.method}${path.length ? '-' + path :  ''}`;
        }
    }

    /**
     * Inserts the route definition into the given markup builder
     * @param markup
     * @param schema
     * @param [prefix] – Prefix to attach to front of element
     */
    _parameterize(markup, schema, prefix = '') {
        if (schema) {
            if (prefix === '') markup.push('');

            Object.keys(schema).forEach((key) => {
                const val = schema[key],
                    flags = val.flags || {},
                    presence = flags.presence,
                    isEnum = flags.allowOnly || false,
                    def = flags.default,
                    type = val.type,
                    badges = [];
                let example = "",
                    enumeration = "";

                /* istanbul ignore else */
                if (presence) badges.push(`((${presence}${def !== undefined ? ', default is ' + this._formatDefaultValue(def) : ''}))`);

                /* istanbul ignore else */
                if (type) badges.push(`((${type}))`);

                /* istanbul ignore if */
                if (val.examples) {
                    example = `E.g. ${val.examples.map((v) => "`"+v.value+"`").join(', ')}`;
                }

                /* istanbul ignore if */
                if (isEnum) {
                    enumeration = (val.valids.length === 2 ? 'Either' : 'One of') + ": " + val.valids.map((v) => "`"+v+"`").join(', ') + ".";
                }

                /* istanbul ignore next */
                markup.push(`${prefix}${key} ${badges.join(' ')}\n${prefix}:   ${val.description  || 'TODO'} ${enumeration} ${example}`);

                // Does this object have children? if so, show child properties
                if (val.children) {
                    this._parameterize(markup, val.children, prefix + "  ");
                }
            });

            if (prefix === '') markup.push('');
        } else {
            markup.push(`None.`);
        }
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Formats a given default value type for output
     * @param val
     * @return {string}
     */
    _formatDefaultValue(val) {
        switch (typeof val) {
            case "string":
            case "number":
            case "boolean":
                return "`"+val+"`";
            case "object":
                return "`"+JSON.stringify(val)+"`";
            /* istanbul ignore next  */
            default:
                this.app.dump('Warning: Unknown default value for docs:', val);
                return val+"";
        }
    }

    /**
     * Sorts route methods by C-R-L-U-D
     * @param b
     * @param a
     * @return {number}
     */
    _methodSort(b, a) {
        /* istanbul ignore next: out of scope */
        if (this.CREATE_TEST.test(a)) return 1;
        else if (this.CREATE_TEST.test(b)) return -1;
        else if (this.RETRIEVE_TEST.test(a)) return 1;
        else if (this.RETRIEVE_TEST.test(b)) return -1;
        else if (this.LIST_TEST.test(a)) return 1;
        else if (this.LIST_TEST.test(b)) return -1;
        else if (this.UPDATE_TEST.test(a)) return 1;
        else if (this.UPDATE_TEST.test(b)) return -1;
        else if (this.DELETE_TEST.test(a)) return 1;
        else if (this.DELETE_TEST.test(b)) return -1;
        else return 0;
    }

    /**
     * Generates returnable markdown version of the server routes
     * @param includeUnorganizedRoutes
     * @return {string}
     */
    generateMarkdown(includeUnorganizedRoutes) {

        const routes = this.getRouteTable();
        const classification = this._classifyRoutes(routes);

        const untaggedRoutes = classification.untagged;
        const taggedRoutes = classification.tagged;

        const resources = [];
        const resourceMethods = {};

        taggedRoutes.forEach((methods, resource) => {
            resources.push(resource);
            resourceMethods[resource] = [];
            methods.forEach((route, method) => {
                resourceMethods[resource].push(method);
            });

            resourceMethods[resource].sort(this._methodSort.bind(this));
        });

        resources.sort();


        const markup = [`# API Routes\n\n`];

        //
        // SUMMARY LIST
        //

        markup.push('# Route Summary\n');

        resources.forEach((resource) => {
            resourceMethods[resource].forEach((category) => {
                const route = taggedRoutes.get(resource).get(category);
                markup.push(` * [<code><span class="method" style="display: inline-block; min-width: 3.75em; text-align: right; padding: 0 .25em 0 0;">${route.method.toUpperCase()}</span> <span class="route">${route.path}</span></code>](#${this._canonicalize(route)})`);
            });
        });

        /* istanbul ignore else: local only */
        if (includeUnorganizedRoutes) {
            /* istanbul ignore next: i hope all routes are documented! */
            untaggedRoutes.forEach((route) => {
                markup.push(` * [<code style="color:red;"><span class="method" style="display: inline-block; min-width: 3.75em; text-align: right; padding: 0 .25em 0 0;">${route.method.toUpperCase()}</span> <span class="route">${route.path}</span></code>](#${this._canonicalize(route)})`);
            });
        }

        markup.push('');


        //
        // ORGANIZED ROUTES
        //

        resources.forEach((resource) => {

            markup.push(`# ${resource}\n`);

            resourceMethods[resource].forEach((category) => {

                markup.push(`## ${category}\n`);

                const route = taggedRoutes.get(resource).get(category);

                /* istanbul ignore else */
                if (route.description) {
                    markup.push(route.description, '\n');
                }

                markup.push(`#### Route\n\n > \`${route.method.toUpperCase()} ${route.path}\`\n`);

                // Auth
                markup.push(`#### Authentication`);
                /* istanbul ignore else */
                if (route.auth && route.auth.strategies) {
                    /* istanbul ignore next */
                    markup.push(`${route.auth.mode === "required" ? "Requires" : route.auth.mode }:\n`);
                    route.auth.strategies.forEach((strategy) => {
                        markup.push(` * ${this._beautifyAuthStrategy(strategy)}`);
                    });
                    markup.push(``);
                } else {
                    markup.push(`None.`);
                }
                markup.push('');

                // Params
                markup.push(`#### Parameters`);
                this._parameterize(markup, route.validation.params);
                markup.push('');

                // Query
                markup.push(`#### Query Parameters`);
                this._parameterize(markup, route.validation.query);
                markup.push('');

                // Payload
                markup.push(`#### Payload`);
                this._parameterize(markup, route.validation.payload);
                markup.push('');
            });

            markup.push('');

        });

        /* istanbul ignore else: local only */
        if (includeUnorganizedRoutes) {


            /* istanbul ignore next - i hope all routes are doc'd */
            if (untaggedRoutes.length) {
                markup.push('# Uncategorised\n');
            }

            //
            // UNORGANIZED ROUTES
            //

            /* istanbul ignore next - i hope all routes are doc'd */
            untaggedRoutes.forEach((route) => {
                markup.push(`## ${route.method.toUpperCase()} ${route.path}\n`);

                // Auth
                markup.push(`#### Authentication`);
                /* istanbul ignore else */
                if (route.auth && route.auth.strategies) {
                    /* istanbul ignore next */
                    markup.push(`${route.auth.mode === "required" ? "Requires" : route.auth.mode }:\n`);
                    route.auth.strategies.forEach((strategy) => {
                        markup.push(` * ${this._beautifyAuthStrategy(strategy)}`);
                    });
                    markup.push(``);
                } else {
                    markup.push(`None.`);
                }
                markup.push('');

                // Params
                markup.push(`#### Parameters`);
                this._parameterize(markup, route.validation.params);
                markup.push('');

                // Query
                markup.push(`#### Query Parameters`);
                this._parameterize(markup, route.validation.query);
                markup.push('');

                // Payload
                markup.push(`#### Payload`);
                this._parameterize(markup, route.validation.payload);
                markup.push('');
            });

            markup.push('');
        }

        return markup.join('\n');
    }

    /**
     * Gets the documentation page template
     * @param {*} [options]
     * @return {*}
     */
    getDocsPageMarkupTemplate(options = {}) {
        const cdn = options.cdn || 'https://developer.okanjo.com';
        return `<!doctype html>
            <html>
            <head>
                <meta charset='utf-8'>
                <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
                <meta name="viewport" content="width=device-width">
                <link rel="shortcut icon" type="image/x-icon" href="img/favicon.png">

                <title>${this.title}</title>

                <link  href='${cdn}/css/theme.css' rel='stylesheet'>

                <!-- Meta -->
                <meta content="${this.title}" property="og:title">
                <meta content="${this.title}" name="description">

                <!-- Initializer -->

                <!--suppress JSUnresolvedLibraryURL -->
                <script src="${cdn}/js/docs-build.js"></script>
                <script>
                    Flatdoc.run({

                        fetcher: Flatdoc.file('${this.markdownLocation}')

                    });
                </script>

            </head>
            <body role='flatdoc'>

            <div class="okanjo-header">
                <a href="/"><img src="${cdn}/img/okanjo.png"></a><h1>Developer Docs</h1>
            </div>

            <div class='header'>
                <ul>
                    <li><a href='/docs' class="">${this.name}</a></li>
                </ul>
            </div>

            <div class='content-root'>
                <div class='menubar'>
                    <div class='menu section' role='flatdoc-menu'></div>
                </div>
                <div role='flatdoc-content' class='content'></div>
            </div>
            <script>

                (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

                ga('create', '${this.googleAnalId}', 'auto');
                ga('send', 'pageview');

            </script>
            </body>
            </html>`;
    }

}

module.exports = DocService;
