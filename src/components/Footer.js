import "./Footer.css";
import { useState } from "react";
import { MyVerticallyCenteredModal } from "./Modal";

export function Footer(props) {
  const [modalShow, setModalShow] = useState(false);

  return (
    <div className="footer">
      <div className="footer-items">
        <a
          href="https://github.com/milanpatel1022/spotify-playlist-cleaner"
          target="_blank"
        >
          <img src="/gitlogo.png"></img>
        </a>

        <button className="faq" onClick={() => setModalShow(true)}>
          FAQ
        </button>
        <MyVerticallyCenteredModal
          show={modalShow}
          onHide={() => setModalShow(false)}
        />
      </div>
    </div>
  );
}
