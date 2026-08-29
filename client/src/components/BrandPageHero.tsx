import type { ReactNode } from "react";
import { BrandAbstractVisual, type BrandAbstractVisualKind } from "@/components/BrandAbstractVisual";

type BrandPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  visual: BrandAbstractVisualKind;
  imageSrc?: string;
  footerContent?: ReactNode;
};

/** A left-weighted editorial opening shared by Graceway's public subpages. */
export function BrandPageHero({ eyebrow, title, description, visual, imageSrc, footerContent }: BrandPageHeroProps) {
  return (
    <section className="brand-page-hero relative isolate overflow-hidden pt-28 md:pt-32">
      <div className="pointer-events-none absolute inset-0 opacity-95">
        <BrandAbstractVisual kind={visual} imageSrc={imageSrc} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(18,55,83,0.98)_0%,rgba(18,55,83,0.91)_53%,rgba(18,55,83,0.54)_100%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(185,149,94,0.8),transparent)]" />

      <div className="container relative grid min-h-[19rem] items-end gap-8 pb-14 md:min-h-[23rem] md:grid-cols-12 md:pb-16">
        <div className="md:col-span-7 lg:col-span-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-9 bg-[#B9955E]" />
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#D8C49E]">{eyebrow}</p>
          </div>
          <h1 className="max-w-3xl break-keep font-serif text-[clamp(2.35rem,6vw,4.85rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[#FFFCF5]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#D7E1E7] md:text-base">{description}</p>
          {footerContent && <div className="mt-7">{footerContent}</div>}
        </div>
        <div className="hidden md:col-span-5 md:block lg:col-span-6">
          <div className="ml-auto max-w-sm border border-white/12 bg-[#173F5D]/20 p-3 backdrop-blur-sm">
            <div className="aspect-[4/3] overflow-hidden border border-white/10">
              <BrandAbstractVisual kind={visual} imageSrc={imageSrc} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
