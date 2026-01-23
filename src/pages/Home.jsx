import Card from "../components/Card";
import SectionTitle from "../components/SectionTitle";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import Countdown from "../components/Countdown";


export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 860, padding: "0 10px" }}>
        
        <Card>
  <SectionTitle>SEJAM BEM-VINDOS</SectionTitle>
  <Countdown date="2026-05-02T17:00:00" />


  <p
    style={{
      color: "var(--muted)",
      fontSize: 14,
      textAlign: "center",
      maxWidth: 520,
      margin: "0 auto",
      lineHeight: 1.6,
    }}
  >
    Criamos este espaço para compartilhar com você todos os detalhes
    do nosso grande dia. Aqui você encontrará informações sobre a cerimônia,
    novidades importantes. confirmar presença e nossa lista de presentes.
  </p>

  <div
    style={{
      marginTop: 26,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      alignItems: "center",
    }}
  >
    <PrimaryButton onClick={() => navigate("/cerimonia")}>
      Cerimônia
    </PrimaryButton>

    <PrimaryButton onClick={() => navigate("/presentes")}>
      Lista de presentes
    </PrimaryButton>

    <PrimaryButton onClick={() => navigate("/rsvp")}>
      Confirmar presença
    </PrimaryButton>
  </div>
</Card>


      </div>
    </div>
  );
}
{/* Countdown virá aqui */}
