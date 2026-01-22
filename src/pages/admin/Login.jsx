import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Card from "../../components/Card";
import PrimaryButton from "../../components/PrimaryButton";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Email ou senha inválidos");
    } else {
      window.location.href = "/admin/dashboard";
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Card>
          <h2 style={{ textAlign: "center", marginBottom: 16 }}>
            Área Administrativa
          </h2>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13 }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ color: "red", fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <PrimaryButton>
              {loading ? "Entrando..." : "Entrar"}
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 14,
};
