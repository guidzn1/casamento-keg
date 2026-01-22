import PrimaryButton from "./PrimaryButton";

export default function GiftModal({ gift, onClose }) {
  if (!gift) return null;

  const priceBRL = gift.price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const pixText = `Chave PIX: ${gift.pixKey}\nValor: ${priceBRL}\nMensagem: ${gift.pixMessage}`;

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixText);
      alert("Copiado! Agora é só colar no seu app do banco.");
    } catch {
      alert("Não consegui copiar automaticamente. Copie manualmente.");
    }
  }

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalBox" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <h3 className="modalTitle">{gift.title}</h3>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
              Valor sugerido: <strong>{priceBRL}</strong>
            </div>
          </div>

          <button className="closeBtn" onClick={onClose}>Fechar</button>
        </div>

        <div style={{ marginTop: 14, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          Use a chave PIX abaixo e, se possível, coloque a mensagem para identificarmos o presente.
        </div>

        <div style={{
          marginTop: 12,
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 12,
          background: "rgba(255,255,255,.8)",
          fontSize: 13,
          whiteSpace: "pre-wrap"
        }}>
          <strong>Chave PIX:</strong> {gift.pixKey}<br />
          <strong>Mensagem:</strong> {gift.pixMessage}
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <PrimaryButton onClick={copyPix}>Copiar dados do PIX</PrimaryButton>

          {!!gift.mpLink && (
            <PrimaryButton onClick={() => window.open(gift.mp_link, "_blank")}>
  Pagar no Mercado Pago
</PrimaryButton>

          )}
        </div>
      </div>
    </div>
  );
}
