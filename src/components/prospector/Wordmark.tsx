export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <img
      src={`${import.meta.env.BASE_URL}bolide-logo.jpg`}
      alt="Bolide — Bridging the Divide"
      className={`select-none rounded-md bg-white object-contain ${big ? "h-28 w-80 p-3" : "h-14 w-44 p-2"}`}
    />
  );
}
