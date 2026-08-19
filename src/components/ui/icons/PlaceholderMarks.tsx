// Marcas abstratas pros três espaços do carrossel "Acreditam no meu
// trabalho" que não têm logo real nem nome de empresa de verdade por trás
// (ver brands.ts): formas geométricas genéricas, não o nome de uma empresa
// fictícia em texto. Um nome fictício lido junto de logos reais confundia
// (lia como afirmação de cliente de verdade); uma marca abstrata sem nome
// nenhum deixa claro que é espaço reservado, não uma associação inventada.
// currentColor, não PNG/SVG rasterizado: acompanha o tema claro/escuro
// sozinho, sem precisar do dark:invert que as logos reais exigem.

export function MarkRings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="18" cy="16" r="11" />
      <circle cx="30" cy="16" r="11" />
    </svg>
  );
}

export function MarkPeaks({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M4 26 16 8 24 20 32 6 44 26Z" />
    </svg>
  );
}

export function MarkFacet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
      <path d="M24 4 44 16 24 28 4 16Z" />
      <path d="M24 4V28M4 16H44" />
    </svg>
  );
}
