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

  //useEffect is called on the 1st render and after Spotify redirects user back to our app (causes a refresh)
  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

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

    //if the user is logged in, use Axios to make GET request to Spotify's playlists endpoint
    if (token) {
      const getPlaylists = async () => {
        const { data } = await axios.get(
          "https://api.spotify.com/v1/me/playlists",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPlaylists(data.items); //update playlists state
      };
      getPlaylists();
    }
    setToken(token); //update token state so we know user is logged in
  }, []);

  //update token state to empty and remove token from the user's browser
  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  return (
    <div className="App">
      <div className="header">
        <h1>Friendlier</h1>
        <h2>An easy way to create clean versions of your Spotify playlists.</h2>
        {!token ? (
          <a
            href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`}
            className="button"
          >
            LOGIN TO SPOTIFY
          </a>
        ) : (
          <button className="button" onClick={logout}>
            LOGOUT
          </button>
        )}
      </div>
      {token ? (
        <div className="body">
          <div className="playlistTable">
            <Playlist playlists={playlists} />
          </div>
          <div className="convert">
            <button>Convert</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
