import { Outlet } from "react-router-dom";
import HeroHeader from "../components/HeroHeader";
import NavPills from "../components/NavPills";

import "../styles/layout.css";

export default function SiteLayout() {
  return (
    <div className="bg">
      <div className="container">
        <HeroHeader />
        <NavPills />
        <main className="page">
          <Outlet />
        </main>
      </div>
      <footer className="footer">
        <div className="container footerInner">
          <span>Feito com carinho 💙</span>
        </div>
      </footer>
    </div>
  );
}
