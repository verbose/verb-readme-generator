'use strict';

var includes = {

  /**
   * Usage
   */

  'usage': [
    '```js',
    '// node.js',
    'var {%= alias %} = require(\'{%= pkg.name %}\');',
    '// es6',
    'import {%= alias %} from \'{%= pkg.name %}\';',
    '```'
  ].join('\n'),

  /**
   * Install
   */

  'install': [
    'Install with [npm](https://www.npmjs.com/):',
    '',
    '```sh',
    '$ npm install {%= pkg.name %}',
    '```'
  ].join('\n'),

  'install-npm': [
    'Install with [npm](https://www.npmjs.com/):',
    '',
    '```sh',
    '$ npm install{%= (typeof save !== "undefined" && save === true ? " --save" : "") %} {%= pkg.name %}',
    '```'
  ].join('\n'),

  'install-yarn': [
    'Install with [yarn](https://yarnpkg.com):',
    '',
    '```sh',
    '$ yarn add{%= (typeof save === "undefined" || save === false ? " -D" : "") %} {%= pkg.name %}',
    '```'

  ].join('\n'),

  'install-global': [
    'Install globally with [npm](https://www.npmjs.com/)',
    '',
    '```sh',
    '$ npm install --global {%= pkg.name %}',
    '```'
  ].join('\n'),

  'install-dev': [
    'Install as a `devDependency` with [npm](https://www.npmjs.com/):',
    '',
    '```sh',
    '$ npm install --save-dev {%= pkg.name %}',
    '```'
  ].join('\n'),

  'install-bower': [
    'Install with [bower](https://bower.io/)',
    '',
    '```sh',
    '$ bower install {%= pkg.name %}{%= save === true ? " --save" : "" %}',
    '```'
  ].join('\n'),

  /**
   * Related
   */

  'highlight': [
    '{% if (verb.related && verb.related.highlight) { %}',
    'You might also be interested in [{%= verb.related.highlight %}]({%= getPkg(verb.related.highlight, "homepage") %}).',
    '{% } %}',
    ''
  ].join('\n'),

  'related-list': [
    '{% if (verb.related && verb.related.list && verb.related.list.length) { %}',
    '{%= verb.related.description || "You might also be interested in these projects:" %} ',
    '',
    '{%= related(verb.related.list) %}  ',
    '{% } %}'
  ].join('\n'),

  /**
   * Upgrading
   */

  'upgrading': [
    '**Clear your cache and re-install**',
    '',
    'If you\'re currently running {%= pkg.name %} v{%= previous("minor", version) %} or lower, please do the following to clear out old versions of {%= pkg.name %}, so that the latest version of {%= pkg.name %} will install properly:',
    '',
    '```bash',
    '$ npm cache clean && npm i -g {%= pkg.name %}',
    '```'
  ].join('\n'),

  /**
   * Tests
   */

  'coverage': [
    '## Code coverage',
    'As of {%= date() %}',
    '{%= coverage("coverage/summary.txt") %}'
  ].join('\n'),

  'tests': [
    'Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:',
    '',
    '```sh',
    '$ npm install && npm test',
    '```'
  ].join('\n'),

  /**
   * Build docs
   */

  'build-docs': [
    '_(This project\'s readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don\'t edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_',
    '',
    'To generate the readme, run the following command:',
    '',
    '```sh',
    '$ npm install -g verbose/verb#dev verb-generate-readme && verb',
    '```'
  ].join('\n'),

  /**
   * Authors
   */

  'author': [
    '**{%= author.name %}**',
    '+ [GitHub Profile](https://github.com/{%= author.username %})',
    '+ [Twitter Profile](https://twitter.com/{%= author.twitter %})',
    '{% if (author.linkedin) { %}+ [LinkedIn Profile](https://linkedin.com/in/{%= author.linkedin %}){% } %}',
    '{% if (author.stackoverflow) { %}+ [StackOverflow Profile](https://stackoverflow.com/users/{%= author.stackoverflow %}){% } %}',
  ].join('\n'),

  'authors': [
    '{% authors.forEach(function(author) { %}',
    '{%= include("author", { author: author }) %}',
    '{% }) %}'
  ].join('\n'),

  'footer': '_This file was generated by [{%= runner.name %}]({%= runner.homepage %}), v{%= runner.version %}, on {%= date() %}._'
};

includes['running-tests'] = includes['tests'];
includes['generate-docs'] = includes['build-docs'];
includes.upgrade = includes.upgrading;

module.exports = includes;
