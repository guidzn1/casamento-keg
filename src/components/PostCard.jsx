export default function PostCard({ title, date, category, content }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>
        {category} • {date}
      </span>

      <h3 style={{ margin: "8px 0 6px", fontSize: 16 }}>{title}</h3>

      <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
        {content}
      </p>
    </div>
  );
}
