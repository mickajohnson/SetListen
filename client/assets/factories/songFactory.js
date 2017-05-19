app.factory('songFactory', ['$http', '$q', function ($http, $q) {
  const factory = {};
  // $http.defaults.headers.common.User_Agent = 'SetListen/0.0.1 ( mickalsipjohnson@gmail.com )'
  const SETLIST_API_KEY = 'b4e726a6-924e-4ec9-9888-11203c43cad3';
  const SPOTIFY_CLIENT_ID = '24b64d7417e944088e1870eb5a808ff8';
  const SPOTIFY_CLIENT_SECRET = '90a79e6163e54a3080820de8aa30549a';
  const REDIRECT_URI = 'http://localhost:2401/callback';

  factory.searchArtist = (artist, callback) => {
    $http.get(`https://musicbrainz.org/ws/2/artist/?query=artist:${artist}&fmt=json`)
    .then(({ data }) => {
      callback(data);
    })
    .catch(error => { console.log(error); callback({ error }); });
  };

  factory.searchSetLists = (artist, callback) => {
    $http.get(`https://api.setlist.fm/rest/0.1/artist/${artist}/setlists.json?`)
    .then((data) => callback({ data }))
    .catch(error => { console.log(error); callback({ error }); });
  };

  factory.createPlaylist = (set, accessToken, callback) => {
    $http({
      method: 'GET',
      url: 'https://api.spotify.com/v1/me',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }).then(data => {
      const userId = data.data.id;
      $http({
        method: 'POST',
        url: `https://api.spotify.com/v1/users/${userId}/playlists`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: { name: `${set.artist} - ${set.title}` }
      }).then(playlist => {
        const uri = playlist.data.uri;
        const playlistId = playlist.data.id;
        const promises = set.set
        .filter(setItem => setItem['@name'] !== '')
        .map(setItem => {
          const trackName = setItem['@name'];
          let trackArtist = set.artist;
          if (setItem.cover) {
            trackArtist = setItem.cover['@name'];
          }
          return $http({
            method: 'GET',
            url: `https://api.spotify.com/v1/search?query=${encodeURIComponent(trackName)}+${encodeURIComponent(trackArtist)}&type=track`,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            }
          });
        });

        $q.all(promises)
          .then(songs => {
            let spotifySongIds = songs
            .filter(song => song.data.tracks.items.length > 0)
            .map(song => {
              return `spotify:track:${song.data.tracks.items[0].id}`;
            });
            spotifySongIds = spotifySongIds.filter(element => { return element !== undefined; });
            $http({
              method: 'POST',
              url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              data: {
                uris: spotifySongIds
              }
            }).then(() => {
              callback(uri);
            });
        });
        });
      });
    };
  return factory;
}]);
