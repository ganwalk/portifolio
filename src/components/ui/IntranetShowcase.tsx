"use client";

import { useRef, useState } from "react";
import { Reveal } from "./Reveal";
import { RepoLink } from "./RepoLink";
import { Catalog } from "./intranet/Catalog";
import { catalogGroups, INTRANET_ORIGIN } from "./intranet/catalog";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo do case da Intranet. Já teve uma bento inteira aqui (tokens de cor
// e seis componentes do Design System portados de verdade, código real
// rodando nativamente, sem imagem nem iframe): pedido explícito pra
// simplificar, a página nunca ficou satisfatória com tanto tratamento
// especial competindo entre si (ver histórico de BentoCard.tsx e
// DesignTokens.tsx, removidos). Depois disso vieram, nessa ordem, um
// quadro estático com still do vídeo de capa, um bloco de texto com
// prompt pronto pra IA e um quadro que ciclava só os NOMES das categorias
// (histórico removido a cada vez, pedido explícito): a última rodada
// pediu partes DE VERDADE da Intranet, embutidas, não uma representação
// abstrata. Agora esse lugar é o índice de acesso (abrir o site ao vivo,
// ir direto pro repositório) mais um quadro com o site publicado de
// verdade embutido (ver EmbeddedShowcase abaixo), parado numa parte real,
// sem trocar sozinho. O índice completo mora logo abaixo (Catalog.tsx),
// mesma lista, mesma ordem: quem quer ver as outras 25 partes rola até lá
// e escolhe, em vez de esperar o próprio quadro chegar nela.
//
// Chegou a ciclar sozinho por todas as 26, uma a cada 3,8s: pedido
// explícito pra tirar, porque o quadro virava uma página navegando por
// conta própria dentro da página do case, competindo pela atenção de quem
// só queria ler o corpo do texto. `EmbeddedShowcase` mantém o mesmo iframe
// da Intranet publicada de verdade (não uma captura), só que fixo numa
// única parte.

// As 26 partes documentadas, achatadas numa lista só na mesma ordem do
// índice abaixo: só o primeiro item entra no quadro, mas a lista inteira
// continua a fonte única de verdade (mesmo item, mesma ordem, mesmo nome
// que o índice mostra pra ele).
const SHOWCASE_ITEMS = catalogGroups.flatMap((group) => group.items);
const SHOWCASE_ITEM = SHOWCASE_ITEMS[0];

const catalogHeading: Localized = {
  pt: "Índice do Design System",
  en: "Design System index",
  es: "Índice del Design System",
  zh: "设计系统索引",
};

function EmbeddedShowcase() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // Só funciona quando o iframe é MESMA ORIGEM que a página que o embute
  // (ganwalk.github.io serve tanto o portfólio quanto a Intranet, ver
  // dezert-horse-cleanup.ts pro mesmo raciocínio aplicado lá). Em
  // desenvolvimento local (localhost embutindo o site publicado) isso NÃO
  // vale, contentDocument lança SecurityError: o catch cobre esse caso,
  // caindo pro iframe mostrando a própria home do Design System como
  // carregou, sem esconder nada nem rolar até a parte certa.
  function handleLoad() {
    const iframe = iframeRef.current;
    try {
      const doc = iframe?.contentDocument;
      if (doc) {
        const style = doc.createElement("style");
        // Header fixo e a sidebar de navegação (nav logo antes do <main>,
        // ver DesignSystem.tsx no repositório da Intranet) escondidos:
        // sem os dois, a seção começa já no topo do próprio quadro, sem
        // precisar compensar a altura do header no cálculo da rolagem.
        // Duas regras separadas, não uma lista só: se :has() não for
        // suportado, só a regra da sidebar falha, o header some do mesmo
        // jeito.
        style.textContent = "header { display: none !important; } nav:has(+ main) { display: none !important; }";
        doc.head.appendChild(style);

        // "instant", não "auto": a página embutida pode ter
        // scroll-behavior: smooth no próprio CSS, e "auto" nesse caso só
        // significa "respeita a página", herdando a animação suave dela.
        // Isso lia como o quadro "se movendo sozinho" um instante depois
        // de carregar, o correção de posição precisa ser um salto seco,
        // não um scroll visível: o header some (mudando a altura de tudo
        // abaixo dele) só depois que a página embutida já tinha calculado
        // a posição do fragmento da URL contra o layout ANTIGO, com
        // header, então precisa corrigir uma vez, mas sem parecer
        // animação.
        const id = SHOWCASE_ITEM.path.split("#")[1];
        const el = id ? doc.getElementById(id) : null;
        el?.scrollIntoView({ behavior: "instant", block: "start" });
      }
    } catch {
      // Cross-origin: segue sem limpar nada.
    } finally {
      setReady(true);
    }
  }

  return (
    // h-[60vh]/max-h: nunca mais alto que a própria tela (isso já bastava
    // pra garantir isso sozinho, na prática qualquer fração de vh
    // garante), com um teto pra não esticar demais em monitor grande e um
    // piso pra não espremer demais em notebook baixo. Era aspect-
    // [1440/900] (a proporção da própria tela onde o Design System foi
    // desenhado): numa coluna larga o bastante, a altura resultante
    // passava da tela, exatamente o "mais alto que uma tela" reclamado.
    //
    // Sem pointer-events-none nem tabIndex/aria-hidden no iframe: agora é
    // uma janela de verdade pro site publicado, com o scroll nativo dele
    // (roda, arrasta, teclado, tudo) disponível por dentro, não só um
    // still decorativo atrás de um link que cobre o quadro inteiro. Abrir
    // em nova aba já tem o próprio botão explícito acima do quadro
    // ("Abrir em nova aba", ver IntranetShowcase abaixo): o selo com o
    // nome da categoria por cima do iframe (ex.: "Cores", nome do primeiro
    // item do catálogo, sem contexto pra quem não conhece o índice) virava
    // um segundo caminho pra fazer a mesma coisa, removido.
    <div className="relative h-[60vh] max-h-[560px] min-h-[360px] overflow-hidden bg-background">
      <iframe
        ref={iframeRef}
        src={`${INTRANET_ORIGIN}${SHOWCASE_ITEM.path}`}
        title="Design System"
        loading="lazy"
        onLoad={handleLoad}
        className="absolute inset-0 h-full w-full transition-opacity duration-300"
        style={{ border: 0, opacity: ready ? 1 : 0 }}
      />
    </div>
  );
}

export function IntranetShowcase({
  locale,
  demoUrl,
  repoUrl,
  title,
  dict,
  className = "",
}: {
  locale: Locale;
  demoUrl: string;
  repoUrl: string;
  title: string;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <div className={className}>
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between gap-6 border-b border-line px-6 py-5 sm:px-8 sm:py-6">
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="type-mono inline-flex items-center gap-2 text-foreground transition-colors hover:text-muted"
            >
              {dict.cases.openDemo}
              <span aria-hidden>↗</span>
            </a>
            <RepoLink repoUrl={repoUrl} title={title} dict={dict} />
          </div>

          <EmbeddedShowcase />
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-14">
        <p className="type-mono text-muted">{catalogHeading[locale]}</p>
        <div className="mt-3">
          <Catalog locale={locale} />
        </div>
      </Reveal>
    </div>
  );
}
