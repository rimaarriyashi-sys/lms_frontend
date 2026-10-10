"use client";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  label = "Cari data",
}: SearchInputProps) {
  return (
    <label className="relative block w-full max-w-sm">
      <span className="sr-only">{label}</span>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7" />
        <path d="m16 16 4.5 4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
      <input
        className="h-11 w-full rounded-lg border border-line bg-canvas pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-brand focus:ring-4 focus:ring-brand/10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}