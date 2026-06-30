import { NavLink, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home.tsx";
import { IntentGraph } from "./pages/IntentGraph.tsx";
import { ProposalGraph } from "./pages/ProposalGraph.tsx";
import { IntentDetail } from "./pages/IntentDetail.tsx";
import { ProposalDetail } from "./pages/ProposalDetail.tsx";
import { IntentForm } from "./pages/IntentForm.tsx";
import { ProposalForm } from "./pages/ProposalForm.tsx";
import { RegisterForm } from "./pages/RegisterForm.tsx";
import { RegisterDetail } from "./pages/RegisterDetail.tsx";
import { TriageDashboard } from "./pages/TriageDashboard.tsx";
import { TriageDetail } from "./pages/TriageDetail.tsx";

export function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">⬡ Org · governança</div>
        <nav className="topnav">
          <NavLink to="/" end>
            Início
          </NavLink>
          <NavLink to="/triagem" end>
            Triagem
          </NavLink>
          <NavLink to="/grafo/intents">Grafo · intents</NavLink>
          <NavLink to="/grafo/proposals">Grafo · proposals</NavLink>
        </nav>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* candidata (negócio → triagem) */}
          <Route path="/register/novo" element={<RegisterForm />} />
          <Route path="/register/:id/editar" element={<RegisterForm />} />
          <Route path="/register/:id" element={<RegisterDetail />} />
          <Route path="/triagem" element={<TriageDashboard />} />
          <Route path="/triagem/:id" element={<TriageDetail />} />
          {/* intent ativada */}
          <Route path="/intent/:id/editar" element={<IntentForm />} />
          <Route path="/intent/:id" element={<IntentDetail />} />
          {/* grafos + intake */}
          <Route path="/grafo/intents" element={<IntentGraph />} />
          <Route path="/grafo/proposals" element={<ProposalGraph />} />
          <Route path="/proposal/nova" element={<ProposalForm />} />
          <Route path="/proposal/:id/editar" element={<ProposalForm />} />
          <Route path="/proposal/:id" element={<ProposalDetail />} />
          <Route path="*" element={<p className="muted">página não encontrada</p>} />
        </Routes>
      </main>
    </div>
  );
}
