import DataTable from "react-data-table-component";
import "./Playlists.css";

export function Playlist(props) {
  //columns for our Playlist Table
  const columns = [
    {
      name: "Your Playlists",
      cell: (row) => {
        return (
          <a
            style={{
              textDecoration: "none",
              textAlign: "left",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              color: "black",
            }}
            target="_blank"
            href={row.external_urls.spotify}
          >
            {row.name}
          </a>
        );
      },
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
    <div>
      <div className="tableHeader">
        <img className="spotify_icon" src="../spotify_icon.png"></img>
        <div> Your Playlists</div>
      </div>

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
        noTableHead={true}
      />
    </div>
  );
}
