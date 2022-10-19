import axios from "axios"; //axios will help us handle HTTP requests to Spotify API
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";

export function Playlist(props) {
  // const token = props.token;
  const username = props.username;

  const columns = [
    {
      //if they don't have a username, just replace it with "Your"
      // name: username !== null ? `${username}'s Playlists` : "Your",
      name: "Your Playlists",
      selector: (row) => row.name,
    },
  ];

  const data = props.playlists;

  const customStyles = {
    table: {
      style: {
        border: "solid black 2px",
        width: "295px",
      },
    },
    head: {
      style: {
        color: "#1DB954",
        fontSize: "80%",
        fontWeight: "bold",
        borderBottom: "solid black 2px",
        justifyContent: "center",
        alignItems: "center",
      },
    },
    rows: {
      style: {
        fontSize: "70%",
      },
    },
    pagination: {
      style: {
        border: "solid black 2px",
        borderTop: "none",
      },
    },
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      selectableRows //need to add styling to these so they stay in div. they are going off screen.
      selectableRowsSingle
      pagination
      paginationComponentOptions={{ noRowsPerPage: true }}
      paginationRowsPerPageOptions={[10]}
      customStyles={customStyles}
    />
  );
}
