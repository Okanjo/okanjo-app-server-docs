# Okanjo Server Documentation Generator

[![Node.js CI](https://github.com/Okanjo/okanjo-app-server-docs/actions/workflows/node.js.yml/badge.svg)](https://github.com/Okanjo/okanjo-app-server-docs/actions/workflows/node.js.yml)[![Coverage Status](https://coveralls.io/repos/github/Okanjo/okanjo-app-server-docs/badge.svg?branch=master)](https://coveralls.io/github/Okanjo/okanjo-app-server-docs?branch=master)

Super basic module to generate documentation in Markdown and JSON based on HAPI route tags. You could use this to generate an SDK!

## Installing

Add to your project like so: 

```sh
npm install okanjo-app-server-docs
```

Note: requires 
* [`okanjo-app`](https://github.com/okanjo/okanjo-app) module.
* [`okanjo-app-server`](https://github.com/okanjo/okanjo-app-server) module.

> Note: Use okanjo-app-server-docs@^1.x.x for OkanjoServer 1.x (Hapi 16 and below)

## Notable Changes

### v3.0.0
- Updated to support Hapi v20 / Joi v17
- Supports Okanjo-App-Server v3
- Supports Node v16


## Example Usage

You can see a basic demonstration by running:

```bash
node test-app/verify.js
```

and visiting:
* `http://localhost:3001/docs` – Rendered version using Flatdoc + Markdown
* `http://localhost:3001/docs/markdown` – Generated markdown
* `http://localhost:3001/docs/json` – Generated JSON

## `DocService(app, server)`
Creates a new instance of the documentation service.
* `app` – The OkanjoApp instance to bind to
* `server` – The OkanjoServer instance to bind to

### `service.getRouteTable()`
Gets the routing table as a serializable object. May include internal information that should not be publically exposed. Does not include ignored or excluded routes.

### `service.getPublicRouteTable()`
Gets only the publicly accessible route definitions. Uses service.getRouteTable for data, and formats for public consumption.

### `service.generateMarkdown(ignoreUnorganizedRoutes)`
Generates a markdown interpretation of the server routes.
* `ignoreUnorganizedRoutes` – Whether to include routes that have not been organized into resource groups. Useful to enable in development environments to identify new or missed routes, but disable in production to prevent leaking beta routes.

### `service.getDocsPageMarkupTemplate()`
Returns a sample HTML template that can be used to display the markdown publically.

## Extending and Contributing 

Our goal is quality-driven development. Please ensure that 100% of the code is covered with testing.

Before contributing pull requests, please ensure that changes are covered with unit tests, and that all are passing. 

### Testing

To run unit tests and code coverage:
```sh
npm run report
```

This will perform:
* Unit tests
* Code coverage report
* Code linting

Sometimes, that's overkill to quickly test a quick change. To run just the unit tests:
 
```sh
npm test
```

or if you have mocha installed globally, you may run `mocha test` instead.
