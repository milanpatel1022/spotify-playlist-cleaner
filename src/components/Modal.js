import Modal from "react-bootstrap/Modal";
import "./Modal.css";

export function MyVerticallyCenteredModal(props) {
  return (
    <Modal {...props} aria-labelledby="contained-modal-title-vcenter" centered>
      <Modal.Header closeButton>
        <Modal.Title className="title" id="contained-modal-title-vcenter">
          FAQ
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>What does this application do?</h5>
        <p>
          It allows users to create clean versions of their Spotify playlists in
          a few clicks, drastically saving them time.
        </p>
        <h5>What exactly is a clean version of a playlist?</h5>
        <p>
          A playlist with no explicit tracks. All tracks from the selected
          playlist will only have their clean versions included in the new
          playlist.
        </p>
        <h5>What if a track has no clean version?</h5>
        <p>
          It will not be included in the clean playlist. Instead, another
          playlist consisting of these "uncleanable" tracks will be created so
          the user can quickly decide what to do with them.
        </p>
      </Modal.Body>
    </Modal>
  );
}
