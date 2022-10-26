import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios"; //axios will help us handle HTTP requests to Spotify API
import { Playlist } from "./Playlists";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { Footer } from "./Footer";

function App() {
  /*Info needed to authenticate with Spotify
    -> Endpoint, Client ID, Redirect URI once authenticated, Response type, what scopes our app wants authorization for
  */
  const CLIENT_ID = "a95ddc783a0549ab9f1b71bcd94692db";
  // const REDIRECT_URI = "https://main.d171gbcw9k44vf.amplifyapp.com/"; //production
  const REDIRECT_URI = "http://localhost:3000"; //development
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";
  const SCOPE =
    "playlist-read-private playlist-modify-public playlist-modify-private";

  const [token, setToken] = useState(""); //state variable for the token

  const [playlists, setPlaylists] = useState([]); //state variable for the user's playlists

  const [userID, setUserID] = useState(""); //state variable for user ID (will need ID to create playlists for them)

  const [selectedPlaylist, setSelectedPlaylist] = useState([]); //if user has made a selection

  const [tracks, setTracks] = useState([]); //when nonempty, we know we can begin cleaning tracks

  const [inProgress, setInProgress] = useState(false); //lets us know if we are cleaning tracks and need to display progress bar

  const [progress, setProgress] = useState(0); //our progress bar needs to know the actual progress to output correctly

  const [cleanPlaylist, setCleanPlaylist] = useState({ name: "", link: "" }); //display playlist in summary

  const [dirtyPlaylist, setDirtyPlaylist] = useState({ name: "", link: "" }); //display dirty playlist in summary

  //if the user is logged in, use Axios to make GET requests to playlists and user endpoint
  const getPlaylists = async (offset, token) => {
    let response = await axios
      .get(
        `https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .catch(function (error) {
        //the token may be expired (causing axios 401 error) and the user may need to relogin.
        if (error.response.status === 401) {
          window.localStorage.removeItem("token"); //remove from localstorage so expired token isn't reused
          setToken(""); //reset token so that user is forced to login again.
        } else if (error.response.status === 403) {
          console.log("bad oauth request. reauth won't help");
        }
      });
    return response.data.items;
  };

  //useEffect is called on the 1st render and after Spotify redirects user back to our app (causes a refresh)
  useEffect(() => {
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

    const getUserInfo = async () => {
      await axios
        .get("https://api.spotify.com/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => setUserID(response.data.id))
        .catch(function (error) {
          if (error.response.status === 401) {
            window.localStorage.removeItem("token"); //remove from localstorage so expired token isn't reused
            setToken(""); //reset token so that user is forced to login again.
          } else if (error.response.status === 403) {
            console.log("bad oauth request. reauth won't help");
          }
        });
    };

    //Spotify API only lets you get up to 50 playlists of a user. We may need to make multiple calls if they have more
    const get_all_playlists = async () => {
      if (token) {
        let offset = 0;
        let all_playlists = [];
        while (true) {
          let current_playlists = await getPlaylists(offset, token);
          all_playlists.push(...current_playlists);
          if (current_playlists.length !== 50) {
            break;
          }
          offset += 50;
        }
        setPlaylists(all_playlists);
      }
    };

    get_all_playlists();

    if (token) {
      getUserInfo();
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

  const addSongsToPlaylist = async (created_playlist, uris) => {
    await axios
      .post(
        `https://api.spotify.com/v1/playlists/${created_playlist.id}/tracks`,
        { uris: uris },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .catch(function (error) {
        if (error.response.status === 401) {
          window.localStorage.removeItem("token"); //remove from localstorage so expired token isn't reused
          setToken(""); //reset token so that user is forced to login again.
        } else if (error.response.status === 403) {
          console.log("bad oauth request. reauth won't help");
        }
      });
  };

  const createPlaylist = async (playlist_name) => {
    let response = await axios
      .post(
        `https://api.spotify.com/v1/users/${userID}/playlists`,
        { name: playlist_name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .catch(function (error) {
        if (error.response.status === 401) {
          window.localStorage.removeItem("token"); //remove from localstorage so expired token isn't reused
          setToken(""); //reset token so that user is forced to login again.
        } else if (error.response.status === 403) {
          console.log("bad oauth request. reauth won't help");
        }
      });
    return response.data;
  };

  //we have the list of tracks. now we need to find the clean version of each one.
  const cleanTracks = async () => {
    const cleanedTracks = [];
    const uncleanableTracks = []; //songs where no clean versions were found

    setProgress(0);

    //create the new playlist
    let old_playlist_name = selectedPlaylist[0].name;

    //Spotify playlist names have character limit of 200.
    //Since we want to append "(clean)" to the end of it, we need to make sure there is enough space
    if (old_playlist_name.length > 192) {
      old_playlist_name = old_playlist_name.slice(0, 192);
    }
    console.log(old_playlist_name.length);
    let playlist_name = `${old_playlist_name} (clean)`;
    let created_playlist = await createPlaylist(playlist_name); //we will assign it to ID returned in response

    //loop through each track. try to find the clean version. add it to the new playlist.
    for (let i = 0; i < tracks.length; i++) {
      setProgress(Math.round((i / tracks.length) * 100));
      const track = tracks[i].track;

      //if the track is already clean, we don't need to look for the clean version
      if (track.explicit === false) {
        cleanedTracks.push(track.uri);
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

      //now we can query Spotify's search endpoint using the track and artist names
      let search = `${trackName} ${artistQuery}`;
      let query = `q=${encodeURIComponent(search)}&type=track&limit=8`;

      await axios
        .get(`https://api.spotify.com/v1/search?${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          const result = response.data.tracks.items;

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
            //add clean song to new playlist

            cleanedTracks.push(result[i].uri);
            found = true;
            break; //we don't need to keep looking through results. we can break early.
          }

          //if we have exited the for loop and didn't find a clean version, add the track to the uncleanable list
          if (found === false) {
            uncleanableTracks.push(track.uri);
          }
        })
        .catch(function (error) {
          if (error.response.status === 401) {
            window.localStorage.removeItem("token"); //remove from localstorage so expired token isn't reused
            setToken(""); //reset token so that user is forced to login again.
          } else if (error.response.status === 403) {
            console.log("bad oauth request. reauth won't help");
          }
        });
    }

    //Spotify API only allows 100 songs to be added per request, so we need to make multiple if needed
    let requestsNeeded = Math.ceil(cleanedTracks.length / 100);
    for (let i = 0; i < requestsNeeded; i++) {
      let offset = i * 100;
      addSongsToPlaylist(
        created_playlist,
        cleanedTracks.slice(offset, offset + 100)
      );
    }
    setCleanPlaylist({
      name: created_playlist.name,
      link: created_playlist.external_urls.spotify,
    }); //name and link to new playlist we have created

    //if there were uncleanable tracks, create a playlist for those
    if (uncleanableTracks.length > 0) {
      let old_playlist_name = selectedPlaylist[0].name;

      if (old_playlist_name.length > 192) {
        old_playlist_name = old_playlist_name.slice(0, 192);
      }
      console.log(old_playlist_name.length);
      let playlist_name = `${old_playlist_name} (dirty)`;
      let created_playlist = await createPlaylist(playlist_name);
      let requestsNeeded = Math.ceil(uncleanableTracks.length / 100);
      for (let i = 0; i < requestsNeeded; i++) {
        let offset = i * 100;
        addSongsToPlaylist(
          created_playlist,
          uncleanableTracks.slice(offset, offset + 100)
        );
      }
      setDirtyPlaylist({
        name: playlist_name,
        link: created_playlist.external_urls.spotify,
      }); //name and link to new playlist we have created
    }

    setProgress(100); //done cleaning
    setInProgress(false); //no need to show progress bar anymore
    setSelectedPlaylist([]); //reset states
    setTracks([]); //reset states

    console.log("cleaned tracks", cleanedTracks);
    console.log("uncleanable tracks", uncleanableTracks);
  };

  //when user selects a playlist and chooses to clean it, we need to get each track from the playlist
  const getTracks = async () => {
    //button won't work unless they select a playlist, so this is just a precaution
    if (selectedPlaylist.length === 0) {
      console.log("no playlist selected");
      return;
    }

    //reset dirty state just in case from previous clean
    setDirtyPlaylist({ name: "", link: "" });

    //API only returns 100 songs max per request. Some playlists can have more than 100 songs.
    //So, we may need to make multiple requests. (Number of tracks in playlist / 100) rounded up is how many calls.
    //Use an offset of 100 for each consecutive call.

    let numTracks = selectedPlaylist[0].tracks.total;

    let requestsNeeded = Math.ceil(numTracks / 100);

    let trackList = [];

    for (let i = 0; i < requestsNeeded; i++) {
      let offset = i * 100;
      //get all the tracks from the playlist they want to clean
      await axios
        .get(
          `https://api.spotify.com/v1/playlists/${selectedPlaylist[0].id}/tracks?offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          trackList.push(...response.data.items);
        })
        .catch(function (error) {
          if (error.response.status === 401) {
            window.localStorage.removeItem("token"); //remove from localstorage so expired token isn't reused
            setToken(""); //reset token so that user is forced to login again.
          } else if (error.response.status === 403) {
            console.log("bad oauth request. reauth won't help");
          }
        });
    }
    setTracks(trackList);
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

  const popover = (
    <Popover id="popover-basic">
      <Popover.Body>
        A clean version of your playlist has been created!
        <a
          style={{ textDecoration: "none", color: "#1DB954" }}
          href={cleanPlaylist.link}
          target="_blank"
        >
          {" "}
          {cleanPlaylist.name}
        </a>
        {dirtyPlaylist.name !== "" ? (
          <div>
            <p></p>
            Songs whose clean versions were not found have been stored in the
            following playlist:
            <a
              style={{ textDecoration: "none", color: "#1DB954" }}
              href={dirtyPlaylist.link}
              target="_blank"
            >
              {" "}
              {dirtyPlaylist.name}
            </a>
          </div>
        ) : null}
      </Popover.Body>
    </Popover>
  );

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
                {progress === 100 ? (
                  <div className="completed">
                    <div className="message">Playlist Cleaned!</div>
                    <OverlayTrigger
                      trigger="click"
                      placement="bottom"
                      overlay={popover}
                    >
                      <button className="button">Summary</button>
                    </OverlayTrigger>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}

export default App;
