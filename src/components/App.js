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

  const [username, setUsername] = useState("Your"); //When displaying their playlists, we want to use their name

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
          setToken(""); //reset token so that user is forced to login again.
        });
    };

    const getUsername = async () => {
      const { data } = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsername(data.display_name);
    };

    if (token) {
      getPlaylists();
    }
    if (token) {
      getUsername();
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

  return (
    <div className="App">
      <div className="header">
        <h1>Friendlier</h1>
        <h2>An easy way to create clean versions of your Spotify playlists.</h2>
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
        <div className="body">
          <div className="playlistTable">
            <Playlist playlists={playlists} username={username} />
          </div>
          <div className="convert">
            <button className="button clean">Clean Playlist</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
