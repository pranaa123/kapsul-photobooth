export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand--light" : ""}`}>
      KAPSUL<span className="brand-dot">●</span>
    </span>
  );
}
