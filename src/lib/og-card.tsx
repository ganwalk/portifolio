// Cartão compartilhado entre os opengraph-image.tsx da home e dos cases:
// mesma composição (rótulo, título, rodapé) em preto e branco, texto puro,
// já que ainda não existe um retrato único (o que existe é a folha de sprite
// do retrato animado da hero, feita pra background-position, não pra
// aparecer inteira numa imagem só). Trocar por algo com o retrato real é
// mexer só aqui.
export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = "image/png";

export function OgCard({
  eyebrow,
  title,
  footer,
}: {
  eyebrow: string;
  title: string;
  footer: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#000",
        color: "#fff",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 30,
          letterSpacing: 6,
          textTransform: "uppercase",
          opacity: 0.6,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.08, maxWidth: 1000 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, opacity: 0.7 }}>{footer}</div>
    </div>
  );
}
