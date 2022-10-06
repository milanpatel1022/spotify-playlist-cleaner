import axios from "axios"; //axios will help us handle HTTP requests to Spotify API
import { useEffect, useState } from "react";

export function Playlist(props) {
  const token = props.token;
  const [playlists, setPlaylists] = useState([]); //state variable for the user's playlists

  return <h1>Playlists</h1>;
}
