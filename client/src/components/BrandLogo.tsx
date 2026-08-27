type BrandLogoProps = {
  /** Use the white reverse lockup on dark backgrounds. */
  variant?: "on-light" | "on-dark";
  className?: string;
  priority?: boolean;
};

export const brandLogoSources = {
  "on-light": "/manus-storage/graceway-logo-light_4da05d65.png",
  "on-dark": "/manus-storage/graceway-logo-dark_65272897.png",
} as const;

/** Official Graceway bilingual lockup derived from the supplied logo template. */
export function BrandLogo({ variant = "on-dark", className = "", priority = false }: BrandLogoProps) {
  return (
    <img
      src={brandLogoSources[variant]}
      alt="Graceway Baptist Church · 그레이스웨이 침례교회"
      className={`h-auto w-full object-contain ${className}`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
