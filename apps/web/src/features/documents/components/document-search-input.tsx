export function DocumentSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      aria-label="Buscar documentos"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Buscar por nome ou tipo..."
      className="h-11 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
    />
  );
}
