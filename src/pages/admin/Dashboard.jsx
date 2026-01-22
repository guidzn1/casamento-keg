import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Card from "../../components/Card";
import PrimaryButton from "../../components/PrimaryButton";
import { uploadGiftImage } from "../../lib/uploadGiftImage";

export default function AdminDashboard() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  return (
    <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 960 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>Dashboard Admin</h2>
          <PrimaryButton onClick={logout}>Sair</PrimaryButton>
        </div>

        {/* ✅ PRESENTES */}
        <GiftsManager />

        {/* ✅ RSVP (com status + CSV + WhatsApp + Copiar telefone) */}
        <RsvpsManager />
      </div>
    </div>
  );
}

function GiftsManager() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

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

  function startCreate() {
    setEditing(null);
    setForm(emptyForm());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(gift) {
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

      if (!form.mp_link?.trim())
        throw new Error("Link do Mercado Pago é obrigatório.");

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
      setForm(emptyForm());
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
    <div>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ margin: 0 }}>
            {editing ? "Editar presente" : "Cadastrar presente"}
          </h3>
          <PrimaryButton onClick={startCreate}>Novo presente</PrimaryButton>
        </div>

        <form onSubmit={saveGift} style={{ marginTop: 14 }}>
          <Field label="Título">
            <input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
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
              style={{ ...inputStyle, minHeight: 80 }}
              placeholder="Ex: Para nossas receitas do dia a dia"
            />
          </Field>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "1fr",
              marginTop: 12,
            }}
          >
            <Field label="Preço (R$)">
              <input
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: e.target.value }))
                }
                style={inputStyle}
                placeholder="Ex: 399,90"
                required
              />
            </Field>

            <Field label="Link Mercado Pago (checkout)">
              <input
                value={form.mp_link}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mp_link: e.target.value }))
                }
                style={inputStyle}
                placeholder="Cole o link do Mercado Pago aqui"
                required
              />
            </Field>
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, is_active: e.target.checked }))
                }
              />
              Ativo (aparece no site)
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <Field label="Imagem (opcional)">
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
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}
              >
                Se você não enviar arquivo, pode colar uma URL abaixo (opcional).
              </div>
              <input
                value={form.image_url}
                onChange={(e) =>
                  setForm((p) => ({ ...p, image_url: e.target.value }))
                }
                style={{ ...inputStyle, marginTop: 10 }}
                placeholder="URL da imagem (opcional)"
              />
            </Field>
          </div>

          {error && (
            <div style={{ color: "red", marginTop: 12, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <PrimaryButton>{saving ? "Salvando..." : "Salvar"}</PrimaryButton>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm());
                }}
                style={secondaryBtn}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <div style={{ height: 14 }} />

      <Card>
        <h3 style={{ marginTop: 0 }}>Presentes cadastrados</h3>

        {loading && <p>Carregando...</p>}

        {!loading && sorted.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            Nenhum presente cadastrado ainda.
          </p>
        )}

        {!loading &&
          sorted.map((g) => (
            <div
              key={g.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                background: "rgba(255,255,255,.75)",
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
                }}
              >
                <div>
                  <strong>{g.title}</strong>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--muted)",
                      marginTop: 4,
                    }}
                  >
                    {(g.price_cents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    • {g.is_active ? "Ativo" : "Inativo"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={secondaryBtn}
                    onClick={() => startEdit(g)}
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
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {g.description}
                </div>
              )}

              {g.mp_link && (
                <a
                  href={g.mp_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13 }}
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

function RsvpsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("all"); // all | yes | no
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | confirmed | attended | declined

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

    const { error } = await supabase.from("rsvps").update(payload).eq("id", id);

    if (error) {
      alert("Não foi possível atualizar o status.");
      return;
    }

    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...payload } : x))
    );
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
      return `Olá, ${name}! 😊\n\nVi sua confirmação e só queria deixar tudo certinho:\n✅ Você confirma presença no casamento?\n\nSe precisar ajustar acompanhantes/quantidade, me avisa por aqui.`;
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
      // fallback (caso clipboard falhe)
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
    <div style={{ marginTop: 14 }}>
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
          <h3 style={{ margin: 0 }}>Confirmações (RSVP)</h3>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              className="select"
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
            >
              <option value="all">Vai/Não vai: Todas</option>
              <option value="yes">Somente “Sim”</option>
              <option value="no">Somente “Não”</option>
            </select>

            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

        <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 13 }}>
          Registros: <strong>{items.length}</strong> • Pessoas (somatório):{" "}
          <strong>{totalPeople}</strong>
        </div>

        {loading && <p>Carregando...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p style={{ color: "var(--muted)" }}>Nenhuma confirmação ainda.</p>
        )}

        {!loading &&
          !error &&
          items.map((x) => (
            <div
              key={x.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 12,
                marginTop: 10,
                background: "rgba(255,255,255,.75)",
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
                  <strong>{x.full_name}</strong>{" "}
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

                  {/* ✅ WhatsApp (mensagem dinâmica) */}
                  {x.phone && (
                    <button
                      type="button"
                      style={secondaryBtn}
                      onClick={() => openWhatsApp(x)}
                    >
                      WhatsApp
                    </button>
                  )}

                  {/* ✅ Copiar telefone */}
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
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    lineHeight: 1.5,
                  }}
                >
                  Acompanhantes: {x.guests_names}
                </div>
              )}

              {x.message && (
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <strong>Mensagem:</strong> {x.message}
                </div>
              )}

              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {x.created_at
                  ? new Date(x.created_at).toLocaleString("pt-BR")
                  : ""}
                {x.attended_at
                  ? ` • Compareceu em: ${new Date(x.attended_at).toLocaleString(
                      "pt-BR"
                    )}`
                  : ""}
              </div>
            </div>
          ))}
      </Card>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, marginBottom: 6, color: "var(--muted)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function emptyForm() {
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
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  fontSize: 14,
  background: "rgba(255,255,255,.85)",
};

const secondaryBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,.85)",
  cursor: "pointer",
};

const dangerBtn = {
  ...secondaryBtn,
  border: "1px solid rgba(255,0,0,.25)",
};
