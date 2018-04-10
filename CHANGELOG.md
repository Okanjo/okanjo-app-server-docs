# Changelog

## v1.1.0
v1.1.0 – Supports documentation of complex objects
 * getPublicRouteTable
   * Added `children` to json spec (recursive list of child properties)
   * Added `default` value to json spec if property has one
 * generateMarkdown
   * Added support for rendering recursive property children
 * getDocsPageMarkupTemplate
   * Added `options` param, currently to override CDN location using `cdn` param
 * Updated test site and unit tests to support changes
 * Incremented to version v1.1.0
 * Updated travis build for docs maintenance
 
## v1.0.0
 * Initial Github release