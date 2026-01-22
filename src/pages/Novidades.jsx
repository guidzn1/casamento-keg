import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Card from "../components/Card";

export default function Novidades() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError("Não foi possível carregar as novidades.");
      setPosts([]);
    } else {
      setPosts(data || []);
    }

    setLoading(false);
  }

  const list = useMemo(() => posts || [], [posts]);

  return (
    <div style={{ padding: "18px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h2 style={{ margin: "0 0 10px 0", textAlign: "center", letterSpacing: 3 }}>
          NOVIDADES
        </h2>

        <p style={{ margin: "0 0 18px 0", textAlign: "center", color: "var(--muted)" }}>
          Dicas e informações que vamos atualizando com o tempo (hospedagem, salão, etc).
        </p>

        {loading && <p style={{ textAlign: "center" }}>Carregando...</p>}
        {error && <p style={{ textAlign: "center", color: "red" }}>{error}</p>}

        {!loading && !error && list.length === 0 && (
          <Card>
            <p style={{ margin: 0, textAlign: "center", color: "var(--muted)" }}>
              Ainda não publicamos novidades. Volte em breve 🙂
            </p>
          </Card>
        )}

        {!loading &&
          !error &&
          list.map((p) => (
            <Card key={p.id} style={{ marginBottom: 12 }}>
              {p.cover_url ? (
                <img
                  src={p.cover_url}
                  alt={p.title}
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                />
              ) : null}

              <h3 style={{ margin: 0 }}>{p.title}</h3>

              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                {formatPostDate(p)}
              </div>

              <div style={{ height: 10 }} />

              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 14 }}>
                {p.content}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

function formatPostDate(p) {
  const raw = p.published_at || p.created_at;
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleString("pt-BR");
  } catch {
    return "";
  }
}
