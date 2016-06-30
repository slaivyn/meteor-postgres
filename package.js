Package.describe({
  name: 'slaivyn:postgres',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use('ecmascript');
  api.use('numtel:pg@1.0.2');
  api.mainModule('postgres-client.js', 'client');
  api.mainModule('postgres-server.js', 'server');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('slaivyn:postgres');
  api.mainModule('postgres-tests.js');
});