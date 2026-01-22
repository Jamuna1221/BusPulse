import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


const LOADER_MIN_TIME = 1000; // 1 second
const loaderStart = Date.now();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


window.addEventListener("load", () => {
  const loader = document.getElementById("initial-loader");
  if (!loader) return;

  const elapsed = Date.now() - loaderStart;
  const remaining = Math.max(0, LOADER_MIN_TIME - elapsed);

  //  Enforce minimum visible time
  setTimeout(() => {
    loader.classList.add("fade-out");

    //  Remove after fade animation
    setTimeout(() => {
      loader.remove();
    }, 500); // must match CSS transition
  }, remaining);
});
