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
    const baseUrl = `http://localhost:${config.webServer.port}/`;


    // Start the web server
    before((done) => {
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
        }, (err) => {
            should(err).not.be.ok();

            server.start((err) => {
                should(err).not.be.ok();
                done();
            });
        });

        // Assign the server
        app.services.docs.server = server;
    });

    // Stop the web server
    after((done) => {
        server.stop(() => {
            done();
        });
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

});