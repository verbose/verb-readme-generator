'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('base:verb:generator');
var utils = require('./lib/utils');
var lint = require('./lib/lint');

module.exports = function(app, base) {
  app.extendWith(require('generate-defaults'));
  app.extendWith(require('verb-toc'));

  /**
   * Set options
   */

  app.option('engine.delims', ['{%', '%}']);
  app.option('toc.footer', '\n\n_(TOC generated by [verb](https://github.com/verbose/verb) using [markdown-toc](https://github.com/jonschlinkert/markdown-toc))_');

  /**
   * Middleware
   */

  app.task('middleware', { silent: true }, function(cb) {
    if (app.option('lint.reflinks')) {
      app.postRender(/\.md$/, require('./lib/reflinks')(app));
    }

    if (app.option('sections')) {
      app.onLoad(/\.md$/, require('./lib/sections')(app));
    }

    app.onLoad(/(verb|readme)\.md$/, lint.layout(app));
    app.on('readme-generator:end', function() {
      var warnings = app.get('cache.readmeWarnings');
      warnings.forEach(function(obj) {
        console.log(obj.filename + ' | ' + obj.message);
      });
    });
    cb();
  });

  /**
   * Load data to be passed to templates at render time
   */

  app.task('data', { silent: true }, function(cb) {
    debug('loading data');

    var runner = base.cache.data.runner;
    runner.url = runner.homepage;
    app.data({runner: runner});

    // this needs work, we need to also merge in globally persisted values
    var person = expandPerson(app.data('author'), app.cwd);
    app.data({author: person});

    // Create a license statement from license in from package.json
    app.data(formatLicense(app));
    debug('data finished');
    cb();
  });

  /**
   * Helpers
   */

  app.task('helpers', { silent: true }, function(cb) {
    debug('loading helpers');

    var opts = utils.extend({ verbose: true }, app.options);

    app.asyncHelper('related', utils.related(opts));
    app.asyncHelper('reflinks', utils.reflinks(opts));
    app.asyncHelper('pkg', function fn(name, prop, cb) {
      if (typeof prop === 'function') {
        cb = prop;
        prop = null;
      }

      var key = name + ':' + String(prop);
      if (fn[key]) {
        cb(null, fn[key]);
        return;
      }

      utils.getPkg(name, function(err, pkg) {
        if (err) return cb(err);
        var res = prop ? utils.get(pkg, prop) : pkg;
        fn[key] = res;
        cb(null, res);
      });
    });

    app.asyncHelper('read', function(fp, cb) {
      fs.read(fp, 'utf8', cb);
    });

    app.helper('apidocs', utils.apidocs());
    app.helper('date', utils.date);
    app.helper('copyright', utils.copyright({linkify: true}));

    app.helper('previous', function(increment, v) {
      var segs = String(v).split('.');
      var version = '';
      switch(increment) {
        case 'major':
          version = (segs[0] - 1) + '.0.0';
          break;
        case 'minor':
        default: {
          version = segs[0] + '.' + (segs[1] - 1) + '.0';
          break;
        }
      }
      return version;
    });

    app.helper('issue', function(options) {
      var opts = utils.extend({}, this.context, options);
      opts.owner = opts.owner || opts.author && opts.author.username;
      opts.repo = opts.name;
      return utils.issue(opts);
    });

    debug('helpers finished');
    cb();
  });

  /**
   * Load .verb.md
   */

  app.task('verbmd', { silent: true }, function(cb) {
    debug('loading .verb.md');

    if (app.docs.getView('.verb.md') || app.docs.getView('readme.md')) {
      cb();
      return;
    }

    // try to load .verb.md from user cwd
    if (fs.existsSync(path.resolve(app.cwd, '.verb.md'))) {
      app.doc('README.md', {contents: read(app, '.verb.md', app.cwd)});
      cb();
      return;
    }

    // if no .verb.md exists, offer to add one
    app.questions.set('verbmd', 'Can\'t find a .verb.md, want to add one?');
    app.ask('verbmd', { save: false }, function(err, answers) {
      if (err) {
        cb(err);
        return;
      }
      if (utils.isAffirmative(answers.verbmd)) {
        app.doc('.verb.md', {contents: read(app, 'readme/.verb.md')})
        app.toStream('docs')
          .pipe(app.dest(app.cwd))
          .on('end', cb);

      } else {
        cb();
      }

    });
  });

  /**
   * Templates
   */

  app.task('templates', { silent: true }, ['helpers', 'data', 'verbmd'], function(cb) {
    debug('loading templates');

    // load layout templates
    app.layouts('templates/layouts/*.md', { cwd: __dirname });

    // load include templates
    app.includes('templates/includes/*.md', { cwd: __dirname });
    app.includes(require('./templates/includes'));

    // load badges
    app.badges(require('./templates/badges'));

    // done
    debug('templates finished');
    cb();
  });

  /**
   * Readme task
   */

  app.task('readme', ['middleware', 'defaults', 'templates'], function() {
    debug('starting readme task');

    Object.defineProperty(app.cache.data, 'alias', {
      get: function() {
        return camelcase(app.toAlias(app.pkg.get('name')));
      }
    });

    var readme = app.pkg.get('verb.readme') || app.options.readme || '.verb.md';
    return app.src(readme, { cwd: app.cwd })
      .on('error', console.log)
      .pipe(app.renderFile('*', app.cache.data))
      .on('error', console.log)
      .pipe(app.pipeline(app.options.pipeline))
      .on('error', console.log)
      .pipe(app.dest(function(file) {
        file.basename = 'README.md';
        return app.options.dest || app.cwd;
      }));
  });

  /**
   * Default task
   */

  app.task('default', { silent: true }, ['readme'], function(cb) {
    this.on('finished', app.emit.bind(app, 'readme-generator:end'));
    cb();
  });
};

/**
 * Read a template
 *
 * @param {Object} `verb`
 * @param {String} `fp`
 * @param {String} `cwd`
 * @return {String}
 */

function read(app, fp, cwd) {
  cwd = cwd || app.env.templates || path.join(__dirname, 'templates');
  return fs.readFileSync(path.resolve(cwd, fp));
}

/**
 * Add "Released under..." statement to license from
 * package.json.
 *
 * @param {Object} `verb`
 * @return {undefined}
 */

function formatLicense(app) {
  var license = app.data('license') || 'MIT';
  if (/Released/.test(license)) {
    return { license: license };
  }

  var fp = path.resolve(app.cwd, 'LICENSE');
  if (fs.existsSync(fp)) {
    var url = repoFile(app.data('repository'), 'LICENSE');
    license = '[' + license + ' license](' + url + ').';
  } else {
    license += ' license.';
  }
  return { license: 'Released under the ' + license };
}

/**
 * Format the github url for a filepath
 *
 * @param {String} `repo`
 * @param {String} `filename`
 * @return {String}
 */

function repoFile(repo, filename) {
  return 'https://github.com/' + repo + '/blob/master/' + filename;
}

/**
 * Expand person strings into objects
 */

function expandPerson(str, cwd) {
  var person = {};
  if (Array.isArray(str)) {
    str.forEach(function(val) {
      person = utils.extend({}, person, utils.parseAuthor(val));
    });
  } else if (typeof str === 'string') {
    person = utils.extend({}, person, utils.parseAuthor(str));
  } else if (str && typeof str === 'object') {
    person = utils.extend({}, person, str);
  }
  if (!person.username && person.url && /github\.com/.test(person.url)) {
    person.username = person.url.slice(person.url.lastIndexOf('/') + 1);
  }
  if (!person.username) {
    person.username = utils.gitUserName(cwd);
  }
  if (!person.twitter && person.username) {
    person.twitter = person.username;
  }
  return utils.omitEmpty(person);
}

/**
 * Camelcase the given string
 */

function camelcase(str) {
  if (str.length === 1) {
    return str.toLowerCase();
  }
  str = str.replace(/^[\W_]+|[\W_]+$/g, '').toLowerCase();
  return str.replace(/[\W_]+(\w|$)/g, function(_, ch) {
    return ch.toUpperCase();
  });
}

function filter(name) {
  return function(key, file) {
    return key === name || file.basename === name;
  };
}
