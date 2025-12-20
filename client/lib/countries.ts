export type Country = { code: string; label: string };

export const COUNTRIES: Country[] = [
  { code: "US", label: "United States" },
  { code: "IN", label: "India" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "IE", label: "Ireland" },
  { code: "CH", label: "Switzerland" },
  { code: "AT", label: "Austria" },
  { code: "BE", label: "Belgium" },
  { code: "PT", label: "Portugal" },
  { code: "PL", label: "Poland" },
  { code: "CZ", label: "Czech Republic" },
  { code: "HU", label: "Hungary" },
  { code: "RO", label: "Romania" },
  { code: "GR", label: "Greece" },
  { code: "TR", label: "Türkiye" },
  { code: "RU", label: "Russia" },
  { code: "CN", label: "China" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "HK", label: "Hong Kong" },
  { code: "SG", label: "Singapore" },
  { code: "MY", label: "Malaysia" },
  { code: "TH", label: "Thailand" },
  { code: "VN", label: "Vietnam" },
  { code: "PH", label: "Philippines" },
  { code: "ID", label: "Indonesia" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "QA", label: "Qatar" },
  { code: "KW", label: "Kuwait" },
  { code: "EG", label: "Egypt" },
  { code: "NG", label: "Nigeria" },
  { code: "KE", label: "Kenya" },
  { code: "ZA", label: "South Africa" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "CO", label: "Colombia" },
  { code: "PE", label: "Peru" },
  { code: "IL", label: "Israel" },
  { code: "PK", label: "Pakistan" },
  { code: "BD", label: "Bangladesh" },
  { code: "LK", label: "Sri Lanka" },
  { code: "NP", label: "Nepal" },
  { code: "ET", label: "Ethiopia" },
  { code: "MA", label: "Morocco" },
  { code: "TN", label: "Tunisia" },
  { code: "UA", label: "Ukraine" },
  { code: "BG", label: "Bulgaria" },
  { code: "HR", label: "Croatia" },
  { code: "SK", label: "Slovakia" },
  { code: "SI", label: "Slovenia" }
];

export function guessCountryFromLocale(): string | null {
  if (typeof navigator === "undefined") return null;
  const langs = navigator.languages || [navigator.language];
  for (const l of langs) {
    const m = /-([A-Za-z]{2})$/.exec(l);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

export function codeToFlagEmoji(code: string): string {
  try {
    if (!/^[A-Z]{2}$/i.test(code)) return "🌍";
    const chars = code.toUpperCase().split("").map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...chars);
  } catch {
    return "🌍";
  }
}
