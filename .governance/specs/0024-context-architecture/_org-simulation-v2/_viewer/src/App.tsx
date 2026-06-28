import { NavLink, Route, Routes } from "react-router-dom";
import { LABEL, LABEL_PLURAL } from "./labels";
import { Home } from "./pages/Home";
import { RegisterIntent } from "./pages/RegisterIntent";
import { IntentDetail } from "./pages/IntentDetail";
import { WorkDetail } from "./pages/WorkDetail";
import { Board } from "./pages/Board";
import { Proposals } from "./pages/Proposals";
import { RegisterProposal } from "./pages/RegisterProposal";
import { useIntents } from "./store";

export function App() {
  const { error, reload } = useIntents();
  return (
    <div className="wrap">
      <nav className="nav">
        <NavLink to="/" end>
          {LABEL_PLURAL}
        </NavLink>
        <NavLink to="/novo">Cadastrar {LABEL.toLowerCase()}</NavLink>
        <NavLink to="/propostas">Propostas</NavLink>
        <NavLink to="/board">Board (derivado)</NavLink>
      </nav>
      {error && (
        <div className="err">
          Sem conexão com a API ({error}). Rode o backend: <code>npm run api</code> (ou{" "}
          <code>npm run dev:all</code>).{" "}
          <button className="btn" onClick={reload}>
            tentar de novo
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novo" element={<RegisterIntent />} />
        <Route path="/intent/:id" element={<IntentDetail />} />
        <Route path="/work/:id" element={<WorkDetail />} />
        <Route path="/propostas" element={<Proposals />} />
        <Route path="/propostas/nova" element={<RegisterProposal />} />
        <Route path="/board" element={<Board />} />
      </Routes>
    </div>
  );
}
