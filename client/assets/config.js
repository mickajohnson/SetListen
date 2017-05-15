var app = angular.module("app", ["ngRoute"]);
app.config(function ($routeProvider, $httpProvider, $sceDelegateProvider) {
  $routeProvider
  .when('/', {
    templateUrl: "partials/songs.html",
    controller: "songController"
  })
  .otherwise({
    redirectTo: '/'
  })

  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

  $sceDelegateProvider.resourceUrlWhitelist([
  'self',
  'https://open.spotify.com/**']);
})
