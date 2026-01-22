import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminGuard({ children }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = "/admin";
        return;
      }

      if (mounted) setChecking(false);
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = "/admin";
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (checking) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
        Verificando acesso...
      </div>
    );
  }

  return children;
}
