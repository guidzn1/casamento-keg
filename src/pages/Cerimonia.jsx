import Card from "../components/Card";
import SectionTitle from "../components/SectionTitle";
import PrimaryButton from "../components/PrimaryButton";

export default function Cerimonia() {
  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 860, padding: "0 10px" }}>

        <SectionTitle>CERIMÔNIA</SectionTitle>

<Card>
  <div className="info-grid">
    <InfoRow label="Data" value="02 de maio de 2026" />
    <InfoRow label="Horário" value="17h00" />
    <InfoRow label="Local" value="Chácara Biaflora" />

    <InfoRow label="Endereço" value="Rodovia Pa 70 Km 6 SN Km 07 - Marabá-PA" />
  </div>

  <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
    <PrimaryButton
  onClick={() => window.open("https://share.google/8hjqlsvZyIfWMcXVf", "_blank")}
>
  Ver no mapa
</PrimaryButton>

  </div>
  <div className="mapBox">
  <iframe
    className="mapFrame"
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    src="https://www.google.com/maps?q=Ch%C3%A1cara%20Biaflora&output=embed"
    title="Mapa - Chácara Biaflora"
  />
</div>

</Card>
<p
  style={{
    marginTop: 18,
    textAlign: "center",
    fontSize: 13,
    color: "var(--muted)",
  }}
>
  Pedimos a gentileza de chegar com antecedência.
</p>



      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <strong style={{ fontSize: 15 }}>{value}</strong>
    </div>
  );
}
