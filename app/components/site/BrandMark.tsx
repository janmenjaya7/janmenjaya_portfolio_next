/*
  The small mor pankh (peacock-feather eye) that ties the main site to the intro's bansuri logo.
  Decorative: always aria-hidden next to visible text. Flat colours, no gradient ids, so it can repeat on a page.
*/
export default function BrandMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 20 28" className={className} aria-hidden="true" focusable="false">
      <path d="M10 27.5V13" stroke="#e9dcc0" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="10" cy="9.5" rx="8.2" ry="9" fill="#b08638" />
      <ellipse cx="10" cy="10" rx="6.4" ry="7.2" fill="#2f9a6a" />
      <ellipse cx="10" cy="10.6" rx="4.6" ry="5.3" fill="#1f9aa0" />
      <ellipse cx="10" cy="11.2" rx="3" ry="3.6" fill="#1d4fa0" />
      <ellipse cx="10" cy="11.8" rx="1.5" ry="1.9" fill="#0c1d4a" />
    </svg>
  );
}
