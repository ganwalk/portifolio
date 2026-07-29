import { BORING_ATTRIBUTE, BORING_STORAGE_KEY } from "@/lib/storage-keys";

// Roda antes da primeira pintura, então quem escolheu o Modo Boring já recebe a
// página em preto e branco, sem ver a versão criativa piscar. Mesmo princípio
// que o next themes usa para o tema escuro.
const script = `try{document.documentElement.setAttribute(${JSON.stringify(
  BORING_ATTRIBUTE,
)},String(localStorage.getItem(${JSON.stringify(
  BORING_STORAGE_KEY,
)})==="true"))}catch(e){}`;

export function BoringBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
