app.controller('songController', ['$scope', 'songFactory', '$location', function ($scope, songFactory, $location) {

  $scope.selected = {};

  $scope.playlistURI = 'spotify:user:spotify:playlist:3rgsDhGHZxZ9sB9DQWQfuf';

  $scope.getIframeSrc = uri => {
    return `https://open.spotify.com/embed?uri=${uri}`
  }

  const hashValue = $location.hash()

  function AverageSetLength(sets) {
    let avg = 0;
    const buffer = 2;
    for (let i = 0; i < sets.length; i++) {
      avg += sets[i].set.length;
    }
    avg /= sets.length;
    return Math.ceil(avg) + buffer;
  }

  $scope.search = artist => {
    songFactory.searchArtist(artist, (data) => {
      if (data.error) {
        $scope.error = 'Servers busy - try again in a second';
      } else {
        $scope.error = ''
        $scope.artistMatches =  data.artists
      }
        });
      };

  $scope.searchSetLists = artist => {
    songFactory.searchSetLists(artist, (data) => {
      const averages = { songs: [], avgLength: 0 }
      $scope.setlists = data.data.data.setlists.setlist
      .filter(setlist => typeof setlist.sets.set === 'object' || Array.isArray(setlist.sets.set))
      .map(setlist => {
        const concert = {
          date: setlist['@eventDate'],
          venue: setlist.venue['@name'],
          city: setlist.venue.city['@name'],
          state: setlist.venue.city['@stateCode'],
          artist: setlist.artist['@name'],
          set: []
        };
        concert.title = `${concert.date} - ${concert.venue} - ${concert.city}, ${concert.state}`;
        if (Array.isArray(setlist.sets.set)) {
          for (let i = 0; i < setlist.sets.set.length; i++) {
            concert.set = concert.set.concat(setlist.sets.set[i].song);
          }
        } else if (typeof setlist.sets.set === 'object') {
          concert.set = setlist.sets.set.song;
        }
        for (let i = 0; i < concert.set.length; i++) {
          const found = averages.songs.findIndex(song => {
            return song['@name'] === concert.set[i]['@name'];
          });
          if (found !== -1) {
            averages.songs[found].occurrence += 1;
            averages.songs[found].avgPlace.push(i);
          } else {
            concert.set[i].occurrence = 1;
            concert.set[i].avgPlace = [i];
            averages.songs.push(concert.set[i]);
          }
        }
        return concert;
      });
      averages.avgLength = AverageSetLength($scope.setlists);
      averages.songs.sort((a, b) => {
        if (a.occurrence < b.occurrence) {
          return 1;
        }
        if (a.occurrence > b.occurrence) {
          return -1;
        }
        return 0;
      });
      let averageSet = averages.songs.slice(0, averages.avgLength);
      averageSet = averageSet.map(song => {
        song.avgPlace = song.avgPlace.reduce((total, place) => { return total + place; });
        song.avgPlace /= song.occurrence;
        return song;
      });
      averageSet.sort((a, b) => {
        if (a.avgPlace > b.avgPlace) {
          return 1;
        }
        if (a.avgPlace < b.avgPlace) {
          return -1;
        }
        return 0;
      });
      $scope.setlists.unshift({ set: averageSet, title: `A Typical Recent ${$scope.setlists[1].artist} Set` });
    });
  };

  $scope.createPlaylist = (set) => {
    songFactory.createPlaylist(set, $scope.ACCESS_TOKEN, (uri) => {
      $scope.playlistURI = uri;
    });
  };
}]);
