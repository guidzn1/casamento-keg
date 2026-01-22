import PrimaryButton from "./PrimaryButton";
import Card from "./Card";

export default function GiftCard({ gift, onGift }) {
  return (
    <Card>
      <div className="giftCard">
        <img className="giftImage" src={gift.image} alt={gift.title} />

        <h3 className="giftTitle">{gift.title}</h3>
        <p className="giftDesc">{gift.description}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="giftPrice">
            {gift.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>

          <PrimaryButton
        onClick={() => {
         if (!gift.mp_link) {
      alert("Link de pagamento indisponível.");
      return;
       }
    onGift(gift);
       }}
>
  Presentear
</PrimaryButton>

        </div>
      </div>
    </Card>
  );
}
