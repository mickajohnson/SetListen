const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request');
const favicon = require('serve-favicon');

const app = express();
const root = __dirname;
const SETLIST_API_KEY = 'b4e726a6-924e-4ec9-9888-11203c43cad3';

app.use(express.static(path.join(root, 'client')));
app.use(express.static(path.join(root, 'bower_components')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(favicon(path.join(root, 'favicon.ico')));

app.get('/callback', (req, res) => { res.redirect('/'); });

app.get('/artists/:artist', (req, res) => {
  const { artist } = req.params;
  const options = {
  url: `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist)}&fmt=json`,
  headers: {
    'User-Agent': 'SetListen/0.0.1 ( mickalsipjohnson@gmail.com )'
  },
  json: true
    };
  request(options, (error, response, body) => {
    if (response.statusCode === 503) {
      res.json({ error: 'Servers Busy' });
    } else if (response.statusCode === 200) {
      res.json({ artists: body.artists });
    } else {
      res.json({ error: 'Server Error' });
    }
});
});

app.get('/setlists/:artist', (req, res) => {
  const { artist } = req.params;
  const options = {
  url: `https://api.setlist.fm/rest/1.0/artist/${encodeURIComponent(artist)}/setlists`,
  json: true,
  headers: {
    'x-api-key': SETLIST_API_KEY,
    Accept: 'application/json'
  },
    };
  request(options, (error, response, body) => {
    if (response.statusCode === 503) {
      res.json({ error: 'Servers Busy' });
    } else if (response.statusCode === 200) {
      res.json({ setlists: body.setlist });
    } else {
      res.json({ error: 'Server Error' });
    }
});
});

app.listen(process.env.PORT || 2401, () => console.log('listening on port 2401'));
