// URL pública completa do site (domínio + basePath), para os metadados que
// precisam de URL absoluta: metadataBase, sitemap, robots, JSON-LD. Diferente
// do NEXT_PUBLIC_BASE_PATH em next.config.ts, que serve só pra montar
// caminhos relativos dentro do próprio HTML (url() do CSS, cursor
// personalizado). Mesmo esquema: definido no workflow do GitHub Pages, com um
// valor de fallback aqui que já bate com o deploy atual, então build local
// sem a env var (ou dev) ainda produz uma URL válida em vez de quebrar. Com
// domínio próprio, é só atualizar o valor no workflow (ver deploy.yml).
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ganwalk.github.io/portifolio"
).replace(/\/$/, "");
