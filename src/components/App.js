import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios"; //axios will help us handle HTTP requests to Spotify API
import { Playlist } from "./Playlists";

function App() {
  /*Info needed to authenticate with Spotify
    -> Endpoint, Client ID, Redirect URI once authenticated, Response type, what scopes our app wants authorization for
  */
  const CLIENT_ID = "a95ddc783a0549ab9f1b71bcd94692db";
  const REDIRECT_URI = "http://localhost:3000";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";
  const SCOPE =
    "playlist-read-private playlist-modify-private playlist-modify-public user-read-private";

  const [token, setToken] = useState(""); //state variable for the token

  const [playlists, setPlaylists] = useState([]); //state variable for the user's playlists

  const [selectedPlaylist, setSelectedPlaylist] = useState([]); //if user has made a selection

  const [tracks, setTracks] = useState([]); //when nonempty, we know we can begin cleaning tracks

  const [inProgress, setInProgress] = useState(false); //lets us know if we are cleaning tracks and need to display progress bar

  const [progress, setProgress] = useState(0); //our progress bar needs to know the actual progress to output correctly

  //useEffect is called on the 1st render and after Spotify redirects user back to our app (causes a refresh)
  useEffect(() => {
    // console.log(selectedPlaylist);

    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");
    console.log(token);
    //if user is not already logged in, use the hash to extract the token
    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        .split("=")[1];

      window.location.hash = "";
      window.localStorage.setItem("token", token);
    }

    //if the user is logged in, use Axios to make GET requests to playlists and user endpoint
    const getPlaylists = async () => {
      await axios
        .get("https://api.spotify.com/v1/me/playlists", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => setPlaylists(response.data.items))
        .catch(function (error) {
          //the token may be expired (causing axios 401 error) and the user may need to relogin.
          console.log(error);
          window.localStorage.removeItem("token"); //remove from localstorage so expired token isn't reused
          setToken(""); //reset token so that user is forced to login again.
        });
    };

    if (token) {
      getPlaylists();
    }

    setToken(token); //update token state so we know user is logged in
  }, []);

  //update token state to empty and remove token from the user's browser
  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  //when the user logs in, send them to Spotify to authenticate
  const authenticate = () => {
    window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;
  };

  //update state when user selects a playlist
  const handleRowSelected = (state) => {
    setSelectedPlaylist(state.selectedRows);
    // console.log(state.selectedRows);
  };

  //we have the list of tracks. now we need to find the clean version of each one.
  const cleanTracks = async () => {
    // console.log("in clean tracks");
    const cleanedTracks = [];
    const uncleanableTracks = []; //songs where no clean versions were found

    setProgress(0);

    //loop through each track
    for (let i = 0; i < tracks.length; i++) {
      setProgress(Math.round((i / tracks.length) * 100));
      const track = tracks[i].track;

      //if the track is already clean, we don't need to look for the clean version
      if (track.explicit === false) {
        cleanedTracks.push(track.name);
        continue;
      }

      const trackName = track.name;
      const artists = new Set();

      //determine artists for each track
      for (let j = 0; j < track.artists.length; j++) {
        artists.add(track.artists[j].name);
      }

      //if there are multiple artists, we need to comma separate them for the query
      let artistQuery = Array.from(artists).join(", ");

      // console.log(artistQuery);

      //now we can query Spotify's search endpoint using the track and artist names
      let search = `${trackName} ${artistQuery}`;
      let query = `q=${encodeURIComponent(search)}&type=track&limit=8`;
      // console.log(query);

      await axios
        .get(`https://api.spotify.com/v1/search?${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          const result = response.data.tracks.items;
          // console.log(trackName, result);

          //using response from API, determine if clean version of song can be found
          let found = false;
          for (let i = 0; i < result.length; i++) {
            if (result[i].explicit === true) {
              //immediately skip if song is explicit
              continue;
            }

            if (result[i].name !== trackName) {
              //immediately skip if song names do not match
              continue;
            }

            //determine the artists for the current song
            const resArtists = new Set();
            for (let j = 0; j < result[i].artists.length; j++) {
              resArtists.add(result[i].artists[j].name);
            }

            let match = true; //boolean that tells us if all the artists match

            //if an artist from original song is not in resArtists, then set flag and break
            for (const a of artists) {
              if (resArtists.has(a) === false) {
                match = false;
                break;
              }
            }

            if (match === false) {
              continue;
            }

            //if we have gotten to this point, we have found the clean version of the same song
            cleanedTracks.push(result[i].name);
            found = true;
            break; //we don't need to keep looking through results. we can break early.
          }

          //if we have exited the for loop and didn't find a clean version, add the track to the uncleanable list
          if (found === false) {
            uncleanableTracks.push(trackName);
          }
        });
    }
    setProgress(100);
    setInProgress(false);

    console.log("cleaned tracks", cleanedTracks);
    console.log("uncleanable tracks", uncleanableTracks);
  };

  //when users select a playlist and choose to clean it, we need to get each track from the playlist
  const getTracks = async () => {
    //button won't work unless they select a playlist, so this is just a precaution
    if (selectedPlaylist.length === 0) {
      console.log("no playlist selected");
      return;
    }

    //when we begin cleaning playlist, we need to display the progress bar

    //get all the tracks from the playlist they want to clean
    await axios
      .get(
        `https://api.spotify.com/v1/playlists/${selectedPlaylist[0].id}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        setTracks(response.data.items);
      });
  };

  //this useEffect will run on first render, but we make sure it doesn't do anything.
  //how? by making sure a playlist was selected to clean. if there wasn't a selection, nothing will happen.
  useEffect(() => {
    //need to consider trying to clean empty playlist
    if (selectedPlaylist.length !== 0) {
      cleanTracks();
      setInProgress(true);
    }
  }, [tracks]);

  return (
    <div className="App">
      <div className="header">
        <h1>Friendlier</h1>
        <h2>An easy way to clean your Spotify playlists.</h2>
        {!token ? (
          <button onClick={authenticate} className="button">
            LOGIN TO SPOTIFY
          </button>
        ) : (
          <button className="button" onClick={logout}>
            LOGOUT
          </button>
        )}
      </div>
      {token ? (
        <div className="frost">
          <div className="body">
            <div className="playlistTable">
              <Playlist
                playlists={playlists}
                handleRowSelected={handleRowSelected}
              />
            </div>
            <div className="convert">
              <button
                className={`button ${
                  selectedPlaylist.length === 0 ? "notSelected" : "selected"
                }`}
                onClick={getTracks}
              >
                {selectedPlaylist.length === 0
                  ? "Select Playlist"
                  : "Clean Playlist!"}
              </button>
              <div className="showProgress">
                {inProgress ? (
                  <div className="progress">
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                      aria-valuenow="0"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                ) : null}
                {progress === 100 ? "Playlist Cleaned!" : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
