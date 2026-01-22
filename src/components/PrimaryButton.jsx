export default function PrimaryButton({ children, onClick }) {
  return (
    <button className="btn-primary" onClick={onClick}>
      {children}
    </button>
  );
}
