import { useEffect, useMemo, useState } from "react";
import SectionTitle from "../components/SectionTitle";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { supabase } from "../lib/supabaseClient";

export default function Presentes() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("az");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const { data, error } = await supabase
          .from("gifts")
          .select("id,title,description,price_cents,image_url,mp_link,is_active,created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        console.log("gifts data:", data);
        console.log("gifts error:", error);

        if (!alive) return;

        if (error) {
          setError(error.message || "Erro ao carregar presentes.");
          setGifts([]);
          return;
        }

        setGifts(data || []);
      } catch (e) {
        console.error("fetch gifts exception:", e);
        if (!alive) return;
        setError("Falha inesperada ao carregar presentes.");
        setGifts([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const sortedGifts = useMemo(() => {
    const arr = [...gifts];

    if (sort === "az") arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sort === "priceAsc") arr.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
    if (sort === "priceDesc") arr.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));

    return arr;
  }, [gifts, sort]);

  function openMercadoPago(gift) {
    if (!gift?.mp_link) {
      alert("Link de pagamento indisponível para este presente.");
      return;
    }
    window.open(gift.mp_link, "_blank");
  }

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 860, padding: "0 10px" }}>
        <SectionTitle>LISTA DE PRESENTES</SectionTitle>

        <div className="giftsToolbar">
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Escolha um presente e finalize pelo Mercado Pago 💙
          </div>

          <select
            className="select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="az">Ordenar: A–Z</option>
            <option value="priceAsc">Menor preço</option>
            <option value="priceDesc">Maior preço</option>
          </select>
        </div>

        {loading && (
          <p style={{ textAlign: "center", marginTop: 20 }}>
            Carregando presentes...
          </p>
        )}

        {!loading && error && (
          <Card>
            <p style={{ textAlign: "center", color: "red", margin: 0 }}>
              {error}
            </p>
            <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 10, fontSize: 13 }}>
              Abra o Console (F12) e confira <strong>gifts error</strong>.
              Se aparecer “permission denied”, é policy/RLS.
            </p>
          </Card>
        )}

        {!loading && !error && sortedGifts.length === 0 && (
          <Card>
            <p style={{ textAlign: "center", margin: 0 }}>
              Nenhum presente disponível no momento.
            </p>
          </Card>
        )}

        <div className="giftsGrid">
          {!loading &&
            !error &&
            sortedGifts.map((gift) => {
              const price = (gift.price_cents || 0) / 100;

              return (
                <Card key={gift.id}>
                  <div className="giftCard">
                    <img
                      className="giftImage"
                      src={gift.image_url || "/gifts/placeholder.jpg"}
                      alt={gift.title}
                      onError={(e) => {
                        e.currentTarget.src = "/gifts/placeholder.jpg";
                      }}
                    />

                    <h3 className="giftTitle">{gift.title}</h3>

                    {gift.description && (
                      <p className="giftDesc">{gift.description}</p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="giftPrice">
                        {price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>

                      <PrimaryButton onClick={() => openMercadoPago(gift)}>
                        Presentear
                      </PrimaryButton>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
