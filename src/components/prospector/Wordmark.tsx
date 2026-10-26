export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <img
      src={`${import.meta.env.BASE_URL}bolide-logo.png`}
      alt="Bolide — Bridging the Divide"
      className={`select-none object-contain ${big ? "h-24 w-72" : "h-12 w-40"}`}
    />
  );
}
