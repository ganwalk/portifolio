import { MediaView } from "@/components/ui/MediaView";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Corpo de apoio de um case: um campo por subprojeto (Ganwalk, Dezert Horse,
// Pink Opala em "Experiências interativas para artistas"), lado a lado, ou os
// dois placeholders genéricos enquanto o case não tem subProjects definido.
// Reaproveitado pela página dedicada e pelo overlay expandido do carrossel.

export function CaseMediaGrid({
  caseStudy,
  locale,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
}) {
  if (caseStudy.subProjects) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {caseStudy.subProjects.map((subProject) => (
          <div key={subProject.name}>
            <MediaView
              media={subProject.media}
              locale={locale}
              className="aspect-[3/4] w-full bg-surface object-cover"
            />
            <p className="type-mono mt-4 text-muted">{subProject.name}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="texture-noise aspect-4/3 bg-surface" />
      <div className="texture-noise aspect-4/3 bg-surface" />
    </div>
  );
}
