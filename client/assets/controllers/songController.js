app.controller('songController', ['$scope', 'songFactory', '$location', function ($scope, songFactory, $location) {
  $scope.selectedSetlist = undefined;

  $scope.playlistURI = 'spotify:user:spotify:playlist:3rgsDhGHZxZ9sB9DQWQfuf';

  $scope.getIframeSrc = uri => { return `https://open.spotify.com/embed?uri=${uri}`; };

  $scope.ACCESS_TOKEN = getAcessToken($location.hash());

  $scope.error = ' ';

  if ($scope.ACCESS_TOKEN) {
    $scope.searchable = true;
  } else {
    $scope.searchable = false;
  }

  $scope.selectedArtist = '1';

  $scope.searchArtist = artist => {
    $scope.displayStart = 0;
    if (artist.length < 1) {
      $scope.error = 'No artist entered';
    } else {
      $scope.error = ' ';
      songFactory.searchArtist(artist, (data) => {
        if (data.error) {
          $scope.error = 'Servers busy - try again in a second';
        } else {
          $scope.error = ' ';
          $scope.artistMatches = data.artists;
          $scope.displayedArtists = data.artists.slice(0, 3);
          $scope.displayStart = 3;
        }
          });
    }
      };

  $scope.changeDisplayed = () => {
    $scope.displayedArtists = $scope.artistMatches.slice($scope.displayStart, $scope.displayStart + 3);
    if ($scope.displayStart + 3 >= $scope.artistMatches.length) {
      $scope.displayStart = 0;
    } else {
        $scope.displayStart += 3;
    }
  };

  $scope.changeColor = () => {
    angular.element(document.querySelector('#hello')).removeClass('green').addClass('red')
  }

  $scope.searchSetLists = artist => {
    $scope.selectedArtist = artist;
    songFactory.searchSetLists(artist, (data) => {
      $scope.error = ' ';
      if (data.error) {
        $scope.error = 'Sorry, no setlist info on that artist found';
      } else {
        $scope.setlists = setlistSorter(data.setlists.setlist);
        if (!$scope.setlists) {
          $scope.error = 'Sorry, no setlist info on that artist found';
        }
      }
    });
  };

  $scope.setSelectedSetlist = setNumber => {
    if (setNumber !== $scope.selectedSetlist) {
      $scope.playlistURI = 'spotify:user:spotify:playlist:3rgsDhGHZxZ9sB9DQWQfuf';
      $scope.selectedSetlist = setNumber;
    }
  };

  $scope.createPlaylist = set => {
    if ($scope.selectedSetlist === undefined) {
      $scope.error = 'No setlist selected';
    } else {
      $scope.error = ' ';
      if ($scope.ACCESS_TOKEN) {
        songFactory.createPlaylist(set, $scope.ACCESS_TOKEN, (res) => {
          if (typeof res === 'string') {
            $scope.playlistURI = res;
          } else {
            $scope.error = 'You need to log back in to Spotify';
          }
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
    if (Array.isArray(sets[i].set)) {
      avg += sets[i].set.length;
    }
  }
  avg /= sets.length;
  return Math.ceil(avg) + buffer;
}

function setlistSorter(setlistData) {
  const averages = { songs: [], avgLength: 0 };
  let sortedSetlist = setlistData
  .filter(setlist => typeof setlist.sets.set === 'object' || Array.isArray(setlist.sets.set));
  if (sortedSetlist.length === 0) {
    return false;
  }
  sortedSetlist = sortedSetlist.map(setlist => {
    const concert = {
      artist: setlist.artist['@name'],
      set: [],
      title: `${setlist['@eventDate']} - ${setlist.venue.city['@name']} - ${setlist.venue.city['@stateCode']}`
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
