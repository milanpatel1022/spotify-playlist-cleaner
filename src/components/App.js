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

  /*
  When App Component is first loaded into DOM, useEffect is called (before 1st render)
    -> Check if we have a hash or if we have a token saved in local storage already
      -> If we have a token stored, set our token state variable
      -> If we don't, check if we have a hash
        -> If so, perform tasks on that hash (which is a string) to extract the token

  */
  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        .split("=")[1];

      window.location.hash = "";
      window.localStorage.setItem("token", token);
    }

    setToken(token);

    //use Axios to make GET request to Spotify's playlists endpoint
    const getPlaylists = async () => {
      const { data } = await axios.get(
        "https://api.spotify.com/v1/me/playlists",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(data);
      setPlaylists(data);
    };

    getPlaylists();
  }, []);

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
          <Playlist playlists={playlists} />
        </div>
      ) : null}
    </div>
  );
}

export default App;
