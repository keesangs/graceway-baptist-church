type BrandLogoProps = {
  /** Use the white reverse lockup on dark backgrounds. */
  variant?: "on-light" | "on-dark";
  className?: string;
  priority?: boolean;
};

export const brandLogoSources = {
  "on-light": "/manus-storage/graceway-logo-light_4da05d65.png",
  "on-dark": "/manus-storage/graceway-logo-dark-approved_ab158297.png",
} as const;

export const brandLogoIntrinsicSizes = {
  "on-light": { width: 433, height: 113 },
  "on-dark": { width: 2012, height: 522 },
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
