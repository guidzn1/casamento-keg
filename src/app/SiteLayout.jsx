import { useEffect } from "react"; // Importar useEffect
import { Outlet } from "react-router-dom";
import HeroHeader from "../components/HeroHeader";
import NavPills from "../components/NavPills";

import "../styles/layout.css";

export default function SiteLayout() {

  // Efeito para detectar o scroll
  useEffect(() => {
    const handleScroll = () => {
      // Se rolar mais que 50px, ativa o blur
      if (window.scrollY > 50) {
        document.body.classList.add("scrolled");
      } else {
        document.body.classList.remove("scrolled");
      }
    };

    // Adiciona o ouvinte
    window.addEventListener("scroll", handleScroll);

    // Limpa o ouvinte quando sair da página
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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