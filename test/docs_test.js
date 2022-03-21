"use strict";

const should = require('should');
const OkanjoApp = require('okanjo-app');
const OkanjoWebServer = require('okanjo-app-server');
const Needle = require('needle');

const DocService = require('../DocService');
const authStrategies = require('../test-app/extensions/auth_strategies');

describe('Okanjo Server Docs', () => {

    const config = require('../test-app/config');

    let app, server;
    const baseUrl = `http://localhost:${config.webServer.hapiServerOptions.port}/`;


    // Start the web server
    before(async () => {
        app = new OkanjoApp(config);

        // Hapi Authentication Strategies Enumeration
        app.authModes = {
            keyOnly: 'only_api_key_required',
            sessionAndKey: 'session_and_api_key_required',
            placementKey: 'placement_key_required'
        };

        app.services = {
            docs: new DocService(app, null) // stub - needs server
        };

        server = new OkanjoWebServer(app, app.config.webServer, {
            extensions: [
                authStrategies
            ]
        });

        await server.start();

        // Assign the server
        app.services.docs.server = server;
    });

    // Stop the web server
    after(async () => {
        await server.stop();
    });

    it('should get routing table', function() {
        const table = app.services.docs.getRouteTable();
        table.should.be.an.Object().and.not.empty();
    });

    it('should serve docs page', function(done) {
        Needle.get(`${baseUrl}docs`, function(err, res) {
            should(err).not.be.ok();
            res.should.be.an.Object();
            res.statusCode.should.be.equal(200);

            res.headers['content-type'].should.match(/^text\/html/);
            res.body.should.be.a.String().and.not.not.be.ok();
            done();
        });
    });

    it('should serve markdown docs', function(done) {
        Needle.get(`${baseUrl}docs/markdown`, function(err, res) {
            should(err).not.be.ok();
            res.should.be.an.Object();
            res.statusCode.should.be.equal(200);

            res.headers['content-type'].should.match(/^text\/markdown/);
            res.body.should.be.a.String().and.not.not.be.ok();
            done();
        });
    });

    it('should serve markdown docs with options', function(done) {
        const markup = app.services.docs.getDocsPageMarkupTemplate({ cdn: 'custom.example.com' });
        markup.should.match(/custom\.example\.com\/css\/theme\.css/);
        done();
    });

    it('should serve markdown docs with no options', function(done) {
        const markup = app.services.docs.getDocsPageMarkupTemplate();
        markup.should.match(/developer\.okanjo\.com\/css\/theme\.css/);
        done();
    });

    it('should serve markdown docs private mode', function(done) {
        Needle.get(`${baseUrl}docs/markdown?private=1`, function(err, res) {
            should(err).not.be.ok();
            res.should.be.an.Object();
            res.statusCode.should.be.equal(200);

            res.headers['content-type'].should.match(/^text\/markdown/);
            res.body.should.be.a.String().and.not.not.be.ok();

            should(res.body.indexOf('secret')).be.exactly(-1);

            done();
        });
    });

    it('should serve json docs', function(done) {
        Needle.get(`${baseUrl}docs/json`, function(err, res) {
            should(err).not.be.ok();
            res.should.be.an.Object();
            res.statusCode.should.be.equal(200);

            res.headers['content-type'].should.match(/^application\/json/);
            res.body.should.be.an.Object().and.not.not.be.ok();

            should(JSON.stringify(res.body).indexOf('secret')).be.exactly(-1);

            done();
        });
    });

    describe('_removeExcludedFields', () => {

        it('should handle new joi formats', () => {
            const new_payload = {
                "type": "object",
                "keys": {
                    "complexObject": {
                        "type": "object",
                        "keys": {
                            "stuff": {
                                "type": "object",
                                "keys": {
                                    "id": {
                                        "type": "string",
                                        "flags": {
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "token"
                                            }
                                        ]
                                    },
                                    "resourceName": {
                                        "type": "string",
                                        "flags": {
                                            "description": "Name of the product.",
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "trim",
                                                "args": {
                                                    "enabled": true
                                                }
                                            },
                                            {
                                                "name": "min",
                                                "args": {
                                                    "limit": 1
                                                }
                                            },
                                            {
                                                "name": "max",
                                                "args": {
                                                    "limit": 140
                                                }
                                            }
                                        ]
                                    },
                                    "take": {
                                        "type": "number",
                                        "flags": {
                                            "default": 25,
                                            "description": "Returns this many records. Used for pagination."
                                        },
                                        "rules": [
                                            {
                                                "name": "integer"
                                            },
                                            {
                                                "name": "min",
                                                "args": {
                                                    "limit": 1
                                                }
                                            },
                                            {
                                                "name": "max",
                                                "args": {
                                                    "limit": 50
                                                }
                                            }
                                        ]
                                    },
                                    "secret": {
                                        "type": "string",
                                        "flags": {
                                            "description": "Excluded"
                                        }
                                    }
                                }
                            },
                            "things": {
                                "type": "object",
                                "keys": {
                                    "description": {
                                        "type": "string",
                                        "flags": {
                                            "description": "Description of the product.",
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "trim",
                                                "args": {
                                                    "enabled": true
                                                }
                                            },
                                            {
                                                "name": "min",
                                                "args": {
                                                    "limit": 1
                                                }
                                            },
                                            {
                                                "name": "max",
                                                "args": {
                                                    "limit": 40960
                                                }
                                            }
                                        ]
                                    },
                                    "price": {
                                        "type": "number",
                                        "flags": {
                                            "description": "Price of the product.",
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "greater",
                                                "args": {
                                                    "limit": 0
                                                }
                                            },
                                            {
                                                "name": "precision",
                                                "args": {
                                                    "limit": 4
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            };

            app.services.docs._removeExcludedFields(new_payload.keys);

            // console.log(JSON.stringify(new_payload, null, 2));
            new_payload.should.deepEqual({
                "type": "object",
                "keys": {
                    "complexObject": {
                        "type": "object",
                        "keys": {
                            "stuff": {
                                "type": "object",
                                "keys": {
                                    "id": {
                                        "type": "string",
                                        "flags": {
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "token"
                                            }
                                        ]
                                    },
                                    "resourceName": {
                                        "type": "string",
                                        "flags": {
                                            "description": "Name of the product.",
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "trim",
                                                "args": {
                                                    "enabled": true
                                                }
                                            },
                                            {
                                                "name": "min",
                                                "args": {
                                                    "limit": 1
                                                }
                                            },
                                            {
                                                "name": "max",
                                                "args": {
                                                    "limit": 140
                                                }
                                            }
                                        ]
                                    },
                                    "take": {
                                        "type": "number",
                                        "flags": {
                                            "default": 25,
                                            "description": "Returns this many records. Used for pagination."
                                        },
                                        "rules": [
                                            {
                                                "name": "integer"
                                            },
                                            {
                                                "name": "min",
                                                "args": {
                                                    "limit": 1
                                                }
                                            },
                                            {
                                                "name": "max",
                                                "args": {
                                                    "limit": 50
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            "things": {
                                "type": "object",
                                "keys": {
                                    "description": {
                                        "type": "string",
                                        "flags": {
                                            "description": "Description of the product.",
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "trim",
                                                "args": {
                                                    "enabled": true
                                                }
                                            },
                                            {
                                                "name": "min",
                                                "args": {
                                                    "limit": 1
                                                }
                                            },
                                            {
                                                "name": "max",
                                                "args": {
                                                    "limit": 40960
                                                }
                                            }
                                        ]
                                    },
                                    "price": {
                                        "type": "number",
                                        "flags": {
                                            "description": "Price of the product.",
                                            "presence": "optional"
                                        },
                                        "rules": [
                                            {
                                                "name": "greater",
                                                "args": {
                                                    "limit": 0
                                                }
                                            },
                                            {
                                                "name": "precision",
                                                "args": {
                                                    "limit": 4
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            });

        });

        it('should handle older joi formats too', () => {
            const old_payload = {
                "type": "object",
                "children": {
                    "complexObject": {
                        "type": "object",
                        "children": {
                            "stuff": {
                                "type": "object",
                                "children": {
                                    "id": {
                                        "type": "string",
                                        "flags": {
                                            "presence": "optional"
                                        },
                                        "invalids": [
                                            ""
                                        ],
                                        "rules": [
                                            {
                                                "name": "token"
                                            }
                                        ]
                                    },
                                    "resourceName": {
                                        "type": "string",
                                        "flags": {
                                            "trim": true,
                                            "presence": "optional"
                                        },
                                        "description": "Name of the product.",
                                        "invalids": [
                                            ""
                                        ],
                                        "rules": [
                                            {
                                                "name": "trim"
                                            },
                                            {
                                                "name": "min",
                                                "arg": 1
                                            },
                                            {
                                                "name": "max",
                                                "arg": 140
                                            }
                                        ]
                                    },
                                    "take": {
                                        "type": "number",
                                        "flags": {
                                            "unsafe": false,
                                            "default": 25
                                        },
                                        "description": "Returns this many records. Used for pagination.",
                                        "invalids": [
                                            null,
                                            null
                                        ],
                                        "rules": [
                                            {
                                                "name": "integer"
                                            },
                                            {
                                                "name": "min",
                                                "arg": 1
                                            },
                                            {
                                                "name": "max",
                                                "arg": 50
                                            }
                                        ]
                                    },
                                    "secret": {
                                        "type": "string",
                                        "description": "Excluded",
                                        "invalids": [
                                            ""
                                        ]
                                    }
                                }
                            },
                            "things": {
                                "type": "object",
                                "children": {
                                    "description": {
                                        "type": "string",
                                        "flags": {
                                            "trim": true,
                                            "presence": "optional"
                                        },
                                        "description": "Description of the product.",
                                        "invalids": [
                                            ""
                                        ],
                                        "rules": [
                                            {
                                                "name": "trim"
                                            },
                                            {
                                                "name": "min",
                                                "arg": 1
                                            },
                                            {
                                                "name": "max",
                                                "arg": 40960
                                            }
                                        ]
                                    },
                                    "price": {
                                        "type": "number",
                                        "flags": {
                                            "unsafe": false,
                                            "precision": 4,
                                            "presence": "optional"
                                        },
                                        "description": "Price of the product.",
                                        "invalids": [
                                            null,
                                            null
                                        ],
                                        "rules": [
                                            {
                                                "name": "greater",
                                                "arg": 0
                                            },
                                            {
                                                "name": "precision",
                                                "arg": 4
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            };

            app.services.docs._removeExcludedFields(old_payload.children);

            // console.log(JSON.stringify(old_payload, null, 2));
            old_payload.should.deepEqual({
                "type": "object",
                "children": {
                    "complexObject": {
                        "type": "object",
                        "children": {
                            "stuff": {
                                "type": "object",
                                "children": {
                                    "id": {
                                        "type": "string",
                                        "flags": {
                                            "presence": "optional"
                                        },
                                        "invalids": [
                                            ""
                                        ],
                                        "rules": [
                                            {
                                                "name": "token"
                                            }
                                        ]
                                    },
                                    "resourceName": {
                                        "type": "string",
                                        "flags": {
                                            "trim": true,
                                            "presence": "optional"
                                        },
                                        "description": "Name of the product.",
                                        "invalids": [
                                            ""
                                        ],
                                        "rules": [
                                            {
                                                "name": "trim"
                                            },
                                            {
                                                "name": "min",
                                                "arg": 1
                                            },
                                            {
                                                "name": "max",
                                                "arg": 140
                                            }
                                        ]
                                    },
                                    "take": {
                                        "type": "number",
                                        "flags": {
                                            "unsafe": false,
                                            "default": 25
                                        },
                                        "description": "Returns this many records. Used for pagination.",
                                        "invalids": [
                                            null,
                                            null
                                        ],
                                        "rules": [
                                            {
                                                "name": "integer"
                                            },
                                            {
                                                "name": "min",
                                                "arg": 1
                                            },
                                            {
                                                "name": "max",
                                                "arg": 50
                                            }
                                        ]
                                    }
                                }
                            },
                            "things": {
                                "type": "object",
                                "children": {
                                    "description": {
                                        "type": "string",
                                        "flags": {
                                            "trim": true,
                                            "presence": "optional"
                                        },
                                        "description": "Description of the product.",
                                        "invalids": [
                                            ""
                                        ],
                                        "rules": [
                                            {
                                                "name": "trim"
                                            },
                                            {
                                                "name": "min",
                                                "arg": 1
                                            },
                                            {
                                                "name": "max",
                                                "arg": 40960
                                            }
                                        ]
                                    },
                                    "price": {
                                        "type": "number",
                                        "flags": {
                                            "unsafe": false,
                                            "precision": 4,
                                            "presence": "optional"
                                        },
                                        "description": "Price of the product.",
                                        "invalids": [
                                            null,
                                            null
                                        ],
                                        "rules": [
                                            {
                                                "name": "greater",
                                                "arg": 0
                                            },
                                            {
                                                "name": "precision",
                                                "arg": 4
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            })

        });

    });

});