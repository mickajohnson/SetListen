app.controller('songController', ['$scope', 'songFactory', '$location', function ($scope, songFactory, $location) {
  $scope.selected = {};

  $scope.playlistURI = 'spotify:user:spotify:playlist:3rgsDhGHZxZ9sB9DQWQfuf';

  $scope.getIframeSrc = uri => { return `https://open.spotify.com/embed?uri=${uri}`; };

  $scope.ACCESS_TOKEN = getAcessToken($location.hash());

  $scope.searchArtist = artist => {
    if (artist.length < 1) {
      $scope.error = 'No artist entered';
    } else {
      songFactory.searchArtist(artist, (data) => {
        if (data.error) {
          $scope.error = 'Servers busy - try again in a second';
        } else {
          $scope.error = '';
          $scope.artistMatches = data.artists;
        }
          });
    }
      };

  $scope.searchSetLists = artist => {
    songFactory.searchSetLists(artist, (data) => {
      if (data.error) {
        $scope.error = 'Sorry, no setlist info on that artist found';
      } else {
        $scope.error = '';
        $scope.setlists = setlistSorter(data.data.data.setlists.setlist);
      }
    });
  };

  $scope.createPlaylist = (set) => {
    if ($scope.selected === undefined) {
      $scope.error = 'No setlist selected';
    } else {
      $scope.error = '';
      if ($scope.ACCESS_TOKEN) {
        songFactory.createPlaylist(set, $scope.ACCESS_TOKEN, (uri) => {
          $scope.playlistURI = uri;
        });
      } else {
        $scope.error = 'You need to sign in to Spotify';
      }
    }
  };
}]);

function getAcessToken(hash) {
  if (hash.substring(0, 6) === 'access') {
    return hash.substring(13, hash.search('&'));
  }
  return undefined;
}

function averageSetLength(sets) {
  let avg = 0;
  const buffer = 2;
  for (let i = 0; i < sets.length; i++) {
    avg += sets[i].set.length;
  }
  avg /= sets.length;
  return Math.ceil(avg) + buffer;
}

function setlistSorter(setlistData) {
  const averages = { songs: [], avgLength: 0 };
  const sortedSetlist = setlistData
  .filter(setlist => typeof setlist.sets.set === 'object' || Array.isArray(setlist.sets.set))
  .map(setlist => {
    const concert = {
      artist: setlist.artist['@name'],
      set: [],
      title: `${setlist['@eventDate']} - ${setlist.venue.city['@name']} - ${setlist.venue.city['@stateCode']}, ${setlist.artist['@name']}`
    };
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
  const averageSet = calcTypicalSet(averages, sortedSetlist);
  sortedSetlist.unshift({
    set: averageSet,
    title: `A Typical Recent ${sortedSetlist[1].artist} Set`,
    artist: sortedSetlist[1].artist
  });
  return sortedSetlist;
}

function calcTypicalSet(averages, setlists) {
  averages.avgLength = averageSetLength(setlists);
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
  return averageSet;
}
