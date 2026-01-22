import { NavLink } from "react-router-dom";
import "../styles/nav.css";

const items = [
  { to: "/", label: "Home" },
  { to: "/cerimonia", label: "Cerimônia" },
  { to: "/novidades", label: "Novidades" },
  { to: "/presentes", label: "Lista de presentes" },
  { to: "/rsvp", label: "Confirme sua presença" },
];

export default function NavPills() {
  return (
    <nav className="nav">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) => (isActive ? "navItem active" : "navItem")}
          end={it.to === "/"}
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
