import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Inter, Roboto and Roboto Mono fonts
const fontStylesheet = document.createElement('link');
fontStylesheet.rel = 'stylesheet';
fontStylesheet.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@300;400;500&family=Roboto+Mono&display=swap';
document.head.appendChild(fontStylesheet);

// Add FontAwesome
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(fontAwesome);

// Add title
const titleElement = document.createElement('title');
titleElement.textContent = 'FinTrack - Financial Portfolio Tracker';
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
