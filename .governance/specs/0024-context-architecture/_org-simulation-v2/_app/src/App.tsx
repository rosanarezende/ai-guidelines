import { NavLink, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home.tsx";

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">⬡ Org · governança</div>
        <nav className="topnav">
          <NavLink to="/" end>
            Início
          </NavLink>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<p className="muted">página não encontrada</p>} />
        </Routes>
      </main>
    </div>
  );
}
