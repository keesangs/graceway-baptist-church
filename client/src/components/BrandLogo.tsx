type BrandLogoProps = {
  /** Use the white reverse lockup on dark backgrounds. */
  variant?: "on-light" | "on-dark";
  className?: string;
  priority?: boolean;
};

export const brandLogoSources = {
  "on-light": "/manus-storage/graceway-logo-light-updated_e386b8f1.png",
  "on-dark": "/manus-storage/graceway-logo-dark-updated_bda9aced.png",
} as const;

export const brandLogoIntrinsicSizes = {
  "on-light": { width: 3086, height: 763 },
  "on-dark": { width: 3086, height: 763 },
} as const;

/** Official Graceway bilingual lockup derived from the supplied logo template. */
export function BrandLogo({ variant = "on-dark", className = "", priority = false }: BrandLogoProps) {
  const intrinsicSize = brandLogoIntrinsicSizes[variant];

  return (
    <img
      src={brandLogoSources[variant]}
      alt="Graceway Baptist Church · 그레이스웨이 침례교회"
      width={intrinsicSize.width}
      height={intrinsicSize.height}
      className={`h-auto w-full object-contain ${className}`}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
