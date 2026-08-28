/**
 * CSS-only editorial visuals for public church pages.
 * The motifs intentionally avoid photos and faces while retaining Graceway's
 * Grace Navy, Way Blue, and restrained Warm Gold visual language.
 */
export const abstractVisualKinds = ["path", "word", "community", "campus", "sending", "youth", "welcome"] as const;

export type BrandAbstractVisualKind = (typeof abstractVisualKinds)[number];

type BrandAbstractVisualProps = {
  kind: BrandAbstractVisualKind;
  imageSrc?: string;
  className?: string;
  imageClassName?: string;
  showPathMotif?: boolean;
};

export function BrandAbstractVisual({ kind, imageSrc, className = "", imageClassName = "", showPathMotif = true }: BrandAbstractVisualProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative isolate h-full w-full overflow-hidden bg-[#17324D] ${className}`}
    >
      {imageSrc && <img src={imageSrc} alt="" className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`} />}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(86,112,138,0.74),transparent_38%),linear-gradient(140deg,#102b45_0%,#163B59_52%,#0d2035_100%)] ${imageSrc ? "opacity-60" : ""}`} />
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(244,242,236,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(244,242,236,0.025)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#C9973E]/20" />
      <div className="absolute -right-4 -top-10 h-40 w-40 rounded-full border border-white/10" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#56708A]/20 blur-2xl" />

      {kind === "path" && showPathMotif && (
        <>
          <div className="absolute -bottom-[68%] left-[45%] h-[150%] w-[42%] -translate-x-1/2 rotate-[18deg] rounded-[50%] border-l-[26px] border-[#F4F2EC]/90 shadow-[0_0_70px_rgba(201,151,62,0.2)]" />
          <div className="absolute -bottom-[58%] left-[61%] h-[130%] w-[32%] -translate-x-1/2 rotate-[18deg] rounded-[50%] border-l-[5px] border-[#C9973E]/85" />
          <div className="absolute right-[25%] top-[23%] h-20 w-1 bg-[#C9973E] shadow-[0_0_24px_rgba(201,151,62,0.8)]" />
          <div className="absolute right-[19%] top-[31%] h-1 w-12 bg-[#C9973E] shadow-[0_0_24px_rgba(201,151,62,0.8)]" />
        </>
      )}

      {kind === "word" && (
        <>
          <div className="absolute left-[13%] right-[13%] top-[28%] h-px bg-[#F4F2EC]/65" />
          <div className="absolute left-[18%] right-[24%] top-[43%] h-px bg-[#F4F2EC]/40" />
          <div className="absolute left-[13%] right-[31%] top-[58%] h-px bg-[#F4F2EC]/30" />
          <div className="absolute left-[13%] top-[21%] h-12 w-12 border-l-2 border-t-2 border-[#C9973E]" />
          <div className="absolute bottom-[17%] right-[14%] h-24 w-24 rounded-full border border-[#C9973E]/45" />
        </>
      )}

      {kind === "community" && (
        <>
          <div className="absolute left-[17%] top-[29%] h-24 w-24 rounded-full border-2 border-[#C9973E]/80 bg-[#17324D]/30" />
          <div className="absolute left-[43%] top-[20%] h-32 w-32 rounded-full border-2 border-[#F4F2EC]/65 bg-[#56708A]/20" />
          <div className="absolute left-[61%] top-[48%] h-20 w-20 rounded-full border-2 border-[#C9973E]/65 bg-[#17324D]/30" />
          <div className="absolute left-[29%] top-[48%] h-px w-[38%] -rotate-[24deg] bg-[#F4F2EC]/45" />
          <div className="absolute left-[36%] top-[38%] h-px w-[32%] rotate-[28deg] bg-[#C9973E]/65" />
        </>
      )}

      {kind === "sending" && (
        <>
          <div className="absolute -bottom-[50%] left-1/2 h-[125%] w-[78%] -translate-x-1/2 rounded-[50%] border-t border-[#F4F2EC]/55" />
          <div className="absolute -bottom-[44%] left-1/2 h-[112%] w-[60%] -translate-x-1/2 rounded-[50%] border-t-2 border-[#C9973E]/80" />
          <div className="absolute -bottom-[39%] left-1/2 h-[96%] w-[40%] -translate-x-1/2 rounded-[50%] border-t border-[#F4F2EC]/35" />
          <div className="absolute left-[50%] top-[17%] h-16 w-16 -translate-x-1/2 rounded-full bg-[#C9973E]/80 blur-xl" />
        </>
      )}

      {kind === "campus" && (
        <>
          <div className="absolute -bottom-[38%] left-[18%] h-[110%] w-[68%] rotate-[22deg] rounded-[45%] border border-[#F4F2EC]/55" />
          <div className="absolute -bottom-[28%] left-[32%] h-[96%] w-[52%] rotate-[22deg] rounded-[45%] border-2 border-[#C9973E]/70" />
          <div className="absolute left-[62%] top-[19%] h-20 w-20 rounded-full border border-[#56708A]/80" />
          <div className="absolute left-[36%] top-[35%] h-px w-[44%] -rotate-[31deg] bg-[#F4F2EC]/55" />
        </>
      )}

      {kind === "youth" && (
        <>
          <div className="absolute -left-[10%] top-[24%] h-24 w-[82%] -rotate-[18deg] rounded-full border border-[#F4F2EC]/55" />
          <div className="absolute -right-[12%] top-[46%] h-20 w-[80%] rotate-[18deg] rounded-full border-2 border-[#56708A]" />
          <div className="absolute left-[65%] top-[20%] h-3 w-3 rounded-full bg-[#C9973E] shadow-[0_0_22px_rgba(201,151,62,1)]" />
          <div className="absolute left-[28%] bottom-[21%] h-2 w-2 rounded-full bg-[#F4F2EC]" />
          <div className="absolute left-[48%] bottom-[32%] h-2 w-2 rounded-full bg-[#C9973E]" />
        </>
      )}

      {kind === "welcome" && (
        <>
          <div className="absolute bottom-[-26%] left-1/2 h-[118%] w-[56%] -translate-x-1/2 rounded-t-[50%] border-[18px] border-b-0 border-[#F4F2EC]/85" />
          <div className="absolute bottom-[-21%] left-1/2 h-[102%] w-[40%] -translate-x-1/2 rounded-t-[50%] border-[5px] border-b-0 border-[#C9973E]" />
          <div className="absolute left-1/2 top-[24%] h-28 w-28 -translate-x-1/2 rounded-full bg-[#C9973E]/35 blur-xl" />
        </>
      )}
    </div>
  );
}
