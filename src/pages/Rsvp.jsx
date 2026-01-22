import { useState } from "react";
import SectionTitle from "../components/SectionTitle";
import Card from "../components/Card";
import PrimaryButton from "../components/PrimaryButton";
import { supabase } from "../lib/supabaseClient";

export default function Rsvp() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    attendance: "yes",
    guests_count: 1,
    guests_names: "",
    message: "",
  });

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function onlyDigits(v) {
    return String(v || "").replace(/\D/g, "");
  }

  function normName(v) {
    return String(v || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  async function alreadyExists({ nameNorm, phoneDigits }) {
    // Se tiver telefone, ele é o melhor identificador
    if (phoneDigits && phoneDigits.length >= 10) {
      const { data, error } = await supabase
        .from("rsvps")
        .select("id")
        .eq("phone", phoneDigits) // vamos salvar phone como digits (abaixo)
        .limit(1);

      if (error) return false;
      return (data || []).length > 0;
    }

    // Sem telefone: tenta pelo nome (últimos 90 dias) pra evitar spam duplicado
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("rsvps")
      .select("id, full_name, created_at")
      .gte("created_at", since)
      .limit(50);

    if (error) return false;

    return (data || []).some((x) => normName(x.full_name) === nameNorm);
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const full_name = form.full_name.trim();
      if (!full_name) throw new Error("Informe seu nome.");

      const guestsCountNum = Number(form.guests_count);
      if (!Number.isFinite(guestsCountNum) || guestsCountNum < 1 || guestsCountNum > 10) {
        throw new Error("Quantidade inválida (1 a 10).");
      }

      const phoneDigits = onlyDigits(form.phone);
      const nameNorm = normName(full_name);

      // ✅ Anti-duplicado
      const exists = await alreadyExists({ nameNorm, phoneDigits });
      if (exists) {
        throw new Error(
          "Parece que você já confirmou presença. Se precisar alterar, fale com os noivos."
        );
      }

      // ✅ status inicial
      // - se a pessoa disse "não", já vai como declined
      // - se disse "sim", entra como pending (você confirma no admin se quiser)
      const initialStatus = form.attendance === "no" ? "declined" : "pending";

      const payload = {
        full_name,
        phone: phoneDigits || null, // salva somente números para facilitar dedupe
        attendance: form.attendance,
        guests_count: guestsCountNum,
        guests_names: form.guests_names.trim() || null,
        message: form.message.trim() || null,
        status: initialStatus,
      };

      const { error } = await supabase.from("rsvps").insert(payload);
      if (error) throw error;

      setDone(true);
    } catch (err) {
      setError(err?.message || "Não foi possível enviar sua confirmação.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 860, padding: "0 10px" }}>
          <SectionTitle>CONFIRMAÇÃO</SectionTitle>
          <Card>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Recebido! 💙</h3>
            <p style={{ textAlign: "center", color: "var(--muted)", lineHeight: 1.6 }}>
              Sua confirmação foi registrada com sucesso.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 860, padding: "0 10px" }}>
        <SectionTitle>CONFIRME SUA PRESENÇA</SectionTitle>

        <Card>
          <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            Preencha os dados abaixo para registrar sua confirmação.
          </p>

          <form onSubmit={submit}>
            <Field label="Nome completo *">
              <input
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Telefone (recomendado pra evitar duplicidade)">
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                style={inputStyle}
                placeholder="(xx) 9xxxx-xxxx"
              />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Dica: se puder, preencha. Ajuda a impedir confirmações repetidas.
              </div>
            </Field>

            <Field label="Você irá comparecer? *">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label style={radioStyle}>
                  <input
                    type="radio"
                    name="attendance"
                    checked={form.attendance === "yes"}
                    onChange={() => setField("attendance", "yes")}
                  />
                  <span>Sim</span>
                </label>

                <label style={radioStyle}>
                  <input
                    type="radio"
                    name="attendance"
                    checked={form.attendance === "no"}
                    onChange={() => setField("attendance", "no")}
                  />
                  <span>Não</span>
                </label>
              </div>
            </Field>

            <Field label="Quantidade de pessoas (incluindo você) *">
              <input
                type="number"
                min={1}
                max={10}
                value={form.guests_count}
                onChange={(e) => setField("guests_count", e.target.value)}
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Nomes dos acompanhantes (opcional)">
              <textarea
                value={form.guests_names}
                onChange={(e) => setField("guests_names", e.target.value)}
                style={{ ...inputStyle, minHeight: 70 }}
              />
            </Field>

            <Field label="Mensagem (opcional)">
              <textarea
                value={form.message}
                onChange={(e) => setField("message", e.target.value)}
                style={{ ...inputStyle, minHeight: 70 }}
              />
            </Field>

            {error && (
              <div style={{ color: "red", fontSize: 13, marginTop: 10 }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <PrimaryButton>{saving ? "Enviando..." : "Confirmar"}</PrimaryButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, marginBottom: 6, color: "var(--muted)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  fontSize: 14,
  background: "rgba(255,255,255,.85)",
};

const radioStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "rgba(255,255,255,.85)",
  cursor: "pointer",
};
