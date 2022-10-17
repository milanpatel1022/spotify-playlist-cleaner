import axios from "axios"; //axios will help us handle HTTP requests to Spotify API
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";

export function Playlist(props) {
  // const token = props.token;

  const columns = [
    {
      name: "Your Playlists",
      selector: (row) => row.name,
    },
  ];

  const data = props.playlists;

  console.log("hi", data);

  return (
    <DataTable
      columns={columns}
      data={data}
      selectableRows
      pagination
      paginationComponentOptions={{ noRowsPerPage: true }}
      paginationRowsPerPageOptions={[10]}
    />
  );
}

/*
      {playlists.map(function (item, i) {
        return <option key={i}>Test</option>;
      })}
*/
