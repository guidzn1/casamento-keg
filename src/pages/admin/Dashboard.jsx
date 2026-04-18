import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Card from "../../components/Card";
import PrimaryButton from "../../components/PrimaryButton";
import { uploadGiftImage } from "../../lib/uploadGiftImage";
import { uploadPostImage } from "../../lib/uploadPostImage";

const TABS = [
  {
    key: "gifts",
    label: "Presentes",
    description: "Cadastre, edite e ative os presentes do site.",
  },
  {
    key: "posts",
    label: "Novidades",
    description: "Gerencie avisos, informações e links importantes.",
  },
  {
    key: "rsvps",
    label: "RSVP",
    description: "Veja confirmações, filtre respostas e exporte CSV.",
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("gifts");

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  const currentTab = TABS.find((tab) => tab.key === activeTab);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        display: "flex",
        justifyContent: "center",
        background:
          "linear-gradient(180deg, rgba(248,248,248,1) 0%, rgba(241,241,241,1) 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1180 }}>
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                Área administrativa
              </div>

              <h2 style={{ margin: 0, fontSize: 28 }}>Dashboard</h2>

              <p
                style={{
                  margin: "8px 0 0 0",
                  color: "var(--muted)",
                  lineHeight: 1.5,
                  maxWidth: 680,
                }}
              >
                Agora cada área fica separada em uma aba, para você acessar mais
                rápido sem precisar rolar a página toda.
              </p>
            </div>

            <PrimaryButton onClick={logout}>Sair</PrimaryButton>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...tabButtonStyle,
                  ...(activeTab === tab.key ? activeTabButtonStyle : {}),
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        <div style={{ height: 14 }} />

        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>{currentTab?.label}</h3>
              <p
                style={{
                  margin: "8px 0 0 0",
                  color: "var(--muted)",
                  fontSize: 14,
                }}
              >
                {currentTab?.description}
              </p>
            </div>
          </div>
        </Card>

        <div style={{ height: 14 }} />

        {activeTab === "gifts" && <GiftsManager />}
        {activeTab === "posts" && <PostsManager />}
        {activeTab === "rsvps" && <RsvpsManager />}
      </div>
    </div>
  );
}

/* ============================
   PRESENTES (gifts)
============================ */
function GiftsManager() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGiftForm());

  const sorted = useMemo(() => {
    return [...gifts].sort((a, b) =>
      (b.created_at || "").localeCompare(a.created_at || "")
    );
  }, [gifts]);

  useEffect(() => {
    fetchGifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchGifts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError("Não foi possível carregar os presentes.");
    setGifts(data || []);
    setLoading(false);
  }

  function startCreateGift() {
    setEditing(null);
    setForm(emptyGiftForm());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditGift(gift) {
    setEditing(gift);
    setForm({
      title: gift.title || "",
      description: gift.description || "",
      price: ((gift.price_cents || 0) / 100).toFixed(2).replace(".", ","),
      mp_link: gift.mp_link || "",
      is_active: !!gift.is_active,
      image_url: gift.image_url || "",
      image_file: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveGift(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const title = form.title.trim();
      if (!title) throw new Error("Título é obrigatório.");

      const priceCents = parsePriceToCents(form.price);
      if (priceCents <= 0) throw new Error("Preço inválido.");

      if (!form.mp_link?.trim()) {
        throw new Error("Link do Mercado Pago é obrigatório.");
      }

      let imageUrl = form.image_url?.trim() || null;
      if (form.image_file) {
        const { publicUrl } = await uploadGiftImage(form.image_file);
        imageUrl = publicUrl;
      }

      const payload = {
        title,
        description: form.description?.trim() || null,
        price_cents: priceCents,
        mp_link: form.mp_link.trim(),
        image_url: imageUrl,
        is_active: !!form.is_active,
      };

      if (editing?.id) {
        const { error } = await supabase
          .from("gifts")
          .update(payload)
          .eq("id", editing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("gifts").insert(payload);
        if (error) throw error;
      }

      await fetchGifts();
      setEditing(null);
      setForm(emptyGiftForm());
    } catch (err) {
      setError(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(gift) {
    const { error } = await supabase
      .from("gifts")
      .update({ is_active: !gift.is_active })
      .eq("id", gift.id);

    if (error) {
      setError("Não foi possível atualizar o status.");
      return;
    }

    setGifts((prev) =>
      prev.map((g) =>
        g.id === gift.id ? { ...g, is_active: !g.is_active } : g
      )
    );
  }

  async function deleteGift(gift) {
    const ok = confirm(`Excluir "${gift.title}"?`);
    if (!ok) return;

    const { error } = await supabase.from("gifts").delete().eq("id", gift.id);
    if (error) {
      setError("Não foi possível excluir.");
      return;
    }

    setGifts((prev) => prev.filter((g) => g.id !== gift.id));
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
        alignItems: "start",
      }}
    >
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              {editing ? "Editar presente" : "Cadastrar presente"}
            </h3>
            <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
              Preencha os dados do presente e salve.
            </p>
          </div>

          <button type="button" style={secondaryBtn} onClick={startCreateGift}>
            Novo presente
          </button>
        </div>

        <form onSubmit={saveGift} style={{ marginTop: 14 }}>
          <Field label="Título">
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              style={inputStyle}
              placeholder="Ex: Airfryer"
              required
            />
          </Field>

          <Field label="Descrição (curta)">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              placeholder="Ex: Para nossas receitas do dia a dia"
            />
          </Field>

          <Field label="Preço (R$)">
            <input
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              style={inputStyle}
              placeholder="Ex: 399,90"
              required
            />
          </Field>

          <Field label="Link Mercado Pago">
            <input
              value={form.mp_link}
              onChange={(e) => setForm((p) => ({ ...p, mp_link: e.target.value }))}
              style={inputStyle}
              placeholder="Cole o link do checkout"
              required
            />
          </Field>

          <div style={{ marginTop: 12 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "var(--text)",
              }}
            >
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, is_active: e.target.checked }))
                }
              />
              Ativo no site
            </label>
          </div>

          <Field label="Imagem (upload)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((p) => ({ ...p, image_file: e.target.files?.[0] || null }))
              }
            />
          </Field>

          <Field label="OU URL da imagem">
            <input
              value={form.image_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, image_url: e.target.value }))
              }
              style={inputStyle}
              placeholder="https://..."
            />
          </Field>

          {error && (
            <div style={{ color: "red", marginTop: 12, fontSize: 13 }}>{error}</div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrimaryButton>{saving ? "Salvando..." : "Salvar"}</PrimaryButton>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyGiftForm());
                }}
                style={secondaryBtn}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Presentes cadastrados</h3>
            <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
              Total: <strong>{sorted.length}</strong>
            </p>
          </div>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && sorted.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Nenhum presente cadastrado ainda.</p>
        )}

        {!loading &&
          sorted.map((g) => (
            <div
              key={g.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                background: "rgba(255,255,255,.78)",
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "start",
                }}
              >
                <div>
                  <strong style={{ fontSize: 16 }}>{g.title}</strong>

                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      marginTop: 6,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      {(g.price_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                    <span>•</span>
                    <span>{g.is_active ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={secondaryBtn}
                    onClick={() => startEditGift(g)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    style={secondaryBtn}
                    onClick={() => toggleActive(g)}
                  >
                    {g.is_active ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    style={dangerBtn}
                    onClick={() => deleteGift(g)}
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {g.description && (
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                  {g.description}
                </div>
              )}

              {g.mp_link && (
                <a
                  href={g.mp_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Abrir link Mercado Pago
                </a>
              )}
            </div>
          ))}
      </Card>
    </div>
  );
}

/* ============================
   NOVIDADES (posts)
============================ */
function PostsManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPostForm());

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError("Não foi possível carregar as novidades.");
    setPosts(data || []);
    setLoading(false);
  }

  function startCreatePost() {
    setEditing(null);
    setForm(emptyPostForm());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditPost(p) {
    setEditing(p);
    setForm({
      title: p.title || "",
      content: p.content || "",
      cover_url: p.cover_url || "",
      link_url: p.link_url || "",
      is_published: !!p.is_published,
      image_file: null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePost(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const title = form.title.trim();
      const content = form.content.trim();

      if (!title) throw new Error("Título é obrigatório.");
      if (!content) throw new Error("Conteúdo é obrigatório.");

      let coverUrl = form.cover_url?.trim() || null;

      if (form.image_file) {
        const { publicUrl } = await uploadPostImage(form.image_file);
        coverUrl = publicUrl;
      }

      const payload = {
        title,
        content,
        cover_url: coverUrl,
        link_url: form.link_url?.trim() || null,
        is_published: !!form.is_published,
        published_at: form.is_published ? new Date().toISOString() : null,
      };

      if (editing?.id) {
        if (editing.is_published && payload.is_published) {
          delete payload.published_at;
        }

        const { error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", editing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("posts").insert(payload);
        if (error) throw error;
      }

      await fetchPosts();
      setEditing(null);
      setForm(emptyPostForm());
    } catch (err) {
      setError(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(p) {
    const next = !p.is_published;

    const { error } = await supabase
      .from("posts")
      .update({
        is_published: next,
        published_at: next ? new Date().toISOString() : null,
      })
      .eq("id", p.id);

    if (error) {
      setError("Erro ao atualizar.");
      return;
    }

    setPosts((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? {
              ...x,
              is_published: next,
              published_at: next ? new Date().toISOString() : null,
            }
          : x
      )
    );
  }

  async function deletePost(p) {
    const ok = confirm(`Excluir "${p.title}"?`);
    if (!ok) return;

    const { error } = await supabase.from("posts").delete().eq("id", p.id);

    if (error) {
      setError("Erro ao excluir.");
      return;
    }

    setPosts((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
        alignItems: "start",
      }}
    >
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              {editing ? "Editar novidade" : "Nova novidade"}
            </h3>
            <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
              Adicione título, conteúdo, imagem e link.
            </p>
          </div>

          <button type="button" style={secondaryBtn} onClick={startCreatePost}>
            Nova novidade
          </button>
        </div>

        <form onSubmit={savePost} style={{ marginTop: 14 }}>
          <Field label="Título">
            <input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Conteúdo">
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((p) => ({ ...p, content: e.target.value }))
              }
              style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
              required
            />
          </Field>

          <Field label="Link (opcional)">
            <input
              value={form.link_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, link_url: e.target.value }))
              }
              style={inputStyle}
              placeholder="https://..."
            />
          </Field>

          <Field label="Imagem (upload)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  image_file: e.target.files?.[0] || null,
                }))
              }
            />
          </Field>

          <Field label="OU URL da imagem">
            <input
              value={form.cover_url}
              onChange={(e) =>
                setForm((p) => ({ ...p, cover_url: e.target.value }))
              }
              style={inputStyle}
              placeholder="https://..."
            />
          </Field>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    is_published: e.target.checked,
                  }))
                }
              />
              Publicado
            </label>
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrimaryButton>{saving ? "Salvando..." : "Salvar"}</PrimaryButton>

            {editing && (
              <button
                type="button"
                style={secondaryBtn}
                onClick={() => {
                  setEditing(null);
                  setForm(emptyPostForm());
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Novidades cadastradas</h3>
          <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
            Total: <strong>{posts.length}</strong>
          </p>
        </div>

        {loading && <p>Carregando...</p>}

        {!loading && posts.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Nenhuma novidade cadastrada ainda.</p>
        )}

        {!loading &&
          posts.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                background: "rgba(255,255,255,.78)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "start",
                }}
              >
                <div style={{ maxWidth: 650 }}>
                  <strong style={{ fontSize: 16 }}>{p.title}</strong>

                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                    {p.is_published ? "Publicado" : "Oculto"}
                    {p.published_at
                      ? ` • ${new Date(p.published_at).toLocaleString("pt-BR")}`
                      : ""}
                  </div>

                  {p.content && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: "var(--muted)",
                      }}
                    >
                      {truncate(p.content, 180)}
                    </div>
                  )}

                  {p.link_url && (
                    <a
                      href={p.link_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 10,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Abrir link
                    </a>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" style={secondaryBtn} onClick={() => startEditPost(p)}>
                    Editar
                  </button>

                  <button type="button" style={secondaryBtn} onClick={() => togglePublish(p)}>
                    {p.is_published ? "Ocultar" : "Publicar"}
                  </button>

                  <button type="button" style={dangerBtn} onClick={() => deletePost(p)}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
      </Card>
    </div>
  );
}

/* ============================
   RSVP (rsvps)
============================ */
function RsvpsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchRsvps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceFilter, statusFilter]);

  async function fetchRsvps() {
    setLoading(true);
    setError("");

    let q = supabase
      .from("rsvps")
      .select("*")
      .order("created_at", { ascending: false });

    if (attendanceFilter !== "all") q = q.eq("attendance", attendanceFilter);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);

    const { data, error } = await q;

    if (error) setError("Não foi possível carregar as confirmações.");
    setItems(data || []);
    setLoading(false);
  }

  async function updateStatus(id, nextStatus) {
    const payload =
      nextStatus === "attended"
        ? { status: "attended", attended_at: new Date().toISOString() }
        : { status: nextStatus, attended_at: null };

    const { error } = await supabase
      .from("rsvps")
      .update(payload)
      .eq("id", id);

    if (error) {
      alert("Não foi possível atualizar o status.");
      return;
    }

    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)));
  }

  async function removeItem(id) {
    const ok = confirm("Excluir esta confirmação?");
    if (!ok) return;

    const { error } = await supabase.from("rsvps").delete().eq("id", id);
    if (error) {
      alert("Não foi possível excluir.");
      return;
    }

    setItems((p) => p.filter((x) => x.id !== id));
  }

  function statusLabel(s) {
    if (s === "pending") return "Pendente";
    if (s === "confirmed") return "Confirmado";
    if (s === "attended") return "Compareceu";
    if (s === "declined") return "Não vai";
    return s || "-";
  }

  function toBRWhatsAppNumber(phoneDigits) {
    const digits = String(phoneDigits || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("55")) return digits;
    return "55" + digits;
  }

  function buildWhatsAppMessage(row) {
    const name = row?.full_name ? row.full_name.split(" ")[0] : "";
    const status = row?.status || "pending";

    if (status === "pending") {
      return `Olá, ${name}! 😊\n\nSó confirmando sua presença no casamento:\n✅ Você confirma presença?\n\nSe precisar ajustar acompanhantes/quantidade, me avisa por aqui.`;
    }
    if (status === "confirmed") {
      return `Olá, ${name}! 😊\n\nPassando para confirmar: está tudo certo com sua presença no casamento. 🙌\n\nQualquer ajuste, me avisa por aqui.`;
    }
    if (status === "declined") {
      return `Olá, ${name}! 😊\n\nTudo bem! Obrigado por avisar que não vai conseguir ir. 💙\n\nSe mudar algo, pode falar comigo.`;
    }
    if (status === "attended") {
      return `Olá, ${name}! 😊\n\nObrigado por ter ido ao casamento! 💙\n\nFoi muito especial ter você com a gente.`;
    }
    return `Olá, ${name}! 😊`;
  }

  function openWhatsApp(row) {
    const num = toBRWhatsAppNumber(row?.phone);
    if (!num) {
      alert("Esse RSVP não tem telefone.");
      return;
    }
    const msg = buildWhatsAppMessage(row);
    const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  async function copyPhone(phoneDigits) {
    const digits = String(phoneDigits || "").replace(/\D/g, "");
    if (!digits) {
      alert("Sem telefone para copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(digits);
      alert("Telefone copiado!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = digits;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Telefone copiado!");
    }
  }

  function exportCSV() {
    const header = [
      "Data",
      "Nome",
      "Telefone",
      "Vai",
      "Status",
      "Pessoas",
      "Acompanhantes",
      "Mensagem",
      "Compareceu em",
    ];

    const rows = items.map((x) => [
      x.created_at ? new Date(x.created_at).toLocaleString("pt-BR") : "",
      x.full_name || "",
      x.phone || "",
      x.attendance === "yes" ? "Sim" : "Não",
      statusLabel(x.status),
      String(x.guests_count || 0),
      (x.guests_names || "").replace(/\n/g, " "),
      (x.message || "").replace(/\n/g, " "),
      x.attended_at ? new Date(x.attended_at).toLocaleString("pt-BR") : "",
    ]);

    const csv = [header, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const totalPeople = items.reduce((acc, x) => acc + (x.guests_count || 0), 0);

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>Confirmações (RSVP)</h3>
          <p style={{ margin: "8px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
            Registros: <strong>{items.length}</strong> • Pessoas:{" "}
            <strong>{totalPeople}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            className="select"
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="all">Vai/Não vai: Todas</option>
            <option value="yes">Somente “Sim”</option>
            <option value="no">Somente “Não”</option>
          </select>

          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="all">Status: Todos</option>
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmado</option>
            <option value="attended">Compareceu</option>
            <option value="declined">Não vai</option>
          </select>

          <button type="button" style={secondaryBtn} onClick={exportCSV}>
            Exportar CSV
          </button>
        </div>
      </div>

      {loading && <p style={{ marginTop: 14 }}>Carregando...</p>}
      {error && <p style={{ color: "red", marginTop: 14 }}>{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={{ color: "var(--muted)", marginTop: 14 }}>
          Nenhuma confirmação ainda.
        </p>
      )}

      {!loading &&
        !error &&
        items.map((x) => (
          <div
            key={x.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: 14,
              marginTop: 12,
              background: "rgba(255,255,255,.78)",
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: 16 }}>{x.full_name}</strong>{" "}
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  • {x.attendance === "yes" ? "Vai" : "Não vai"} •{" "}
                  {statusLabel(x.status)}
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={secondaryBtn}
                  onClick={() => updateStatus(x.id, "pending")}
                >
                  Pendente
                </button>

                <button
                  type="button"
                  style={secondaryBtn}
                  onClick={() => updateStatus(x.id, "confirmed")}
                >
                  Confirmar
                </button>

                <button
                  type="button"
                  style={secondaryBtn}
                  onClick={() => updateStatus(x.id, "attended")}
                >
                  Compareceu
                </button>

                {x.phone && (
                  <button
                    type="button"
                    style={secondaryBtn}
                    onClick={() => openWhatsApp(x)}
                  >
                    WhatsApp
                  </button>
                )}

                {x.phone && (
                  <button
                    type="button"
                    style={secondaryBtn}
                    onClick={() => copyPhone(x.phone)}
                  >
                    Copiar tel
                  </button>
                )}

                <button
                  type="button"
                  style={dangerBtn}
                  onClick={() => removeItem(x.id)}
                >
                  Excluir
                </button>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Pessoas: <strong>{x.guests_count}</strong>
              {x.phone ? (
                <>
                  {" "}
                  • Tel: <strong>{x.phone}</strong>
                </>
              ) : null}
            </div>

            {x.guests_names && (
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                Acompanhantes: {x.guests_names}
              </div>
            )}

            {x.message && (
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong>Mensagem:</strong> {x.message}
              </div>
            )}

            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {x.created_at ? new Date(x.created_at).toLocaleString("pt-BR") : ""}
              {x.attended_at
                ? ` • Compareceu em: ${new Date(x.attended_at).toLocaleString("pt-BR")}`
                : ""}
            </div>
          </div>
        ))}
    </Card>
  );
}

/* ============================
   Helpers / Styles
============================ */
function Field({ label, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontSize: 13,
          marginBottom: 6,
          color: "var(--muted)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function emptyGiftForm() {
  return {
    title: "",
    description: "",
    price: "",
    mp_link: "",
    is_active: true,
    image_url: "",
    image_file: null,
  };
}

function emptyPostForm() {
  return {
    title: "",
    content: "",
    cover_url: "",
    link_url: "",
    is_published: true,
    image_file: null,
  };
}

function truncate(text, max) {
  const t = String(text || "");
  if (t.length <= max) return t;
  return t.slice(0, max) + "…";
}

function parsePriceToCents(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  fontSize: 14,
  background: "rgba(255,255,255,.92)",
  outline: "none",
  boxSizing: "border-box",
};

const tabButtonStyle = {
  padding: "11px 16px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,.7)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
};

const activeTabButtonStyle = {
  background: "var(--text)",
  color: "#fff",
  border: "1px solid var(--text)",
};

const secondaryBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,.92)",
  cursor: "pointer",
  fontWeight: 600,
};

const dangerBtn = {
  ...secondaryBtn,
  border: "1px solid rgba(255,0,0,.25)",
  color: "#a11",
};

const filterSelectStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,.92)",
  fontSize: 14,
};