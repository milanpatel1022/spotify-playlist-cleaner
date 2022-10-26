import { useState } from "react";
import DataTable from "react-data-table-component";

export function Playlist(props) {
  //columns for our Playlist Table
  const columns = [
    {
      //if they don't have a username, just replace it with "Your"
      // name: username !== null ? `${username}'s Playlists` : "Your",
      name: "Your Playlists",
      selector: (row) => row.name,
    },
  ];

  //rows for our Playlist Table
  const data = props.playlists;

  //Custom styles for our Playlist Table
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
      noDataComponent="You do not have access to this app."
      selectableRows //need to add styling to these so they stay in div. they are going off screen.
      selectableRowsSingle
      selectableRowsComponentProps={{ type: "radio" }}
      onSelectedRowsChange={props.handleRowSelected}
      pagination
      paginationComponentOptions={{ noRowsPerPage: true }}
      paginationRowsPerPageOptions={[10]}
      customStyles={customStyles}
    />
  );
}
