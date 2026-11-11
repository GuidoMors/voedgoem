import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./games/blokus/styles.css";
import "./games/codenames/styles.css";
import "./games/dworf/styles.css";
import "./games/kin/styles.css";
import "./games/pass-time/styles.css";
import "./games/tetris/styles.css";
import "./games/thirtyone/styles.css";
import "./games/werewolves/styles.css";
import "./games/wordle-pvp/styles.css";
import "./games/waar-ligt-dat-land/styles.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
