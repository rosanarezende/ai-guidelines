export function OptimizedImage({
  alt,
  webp,
}: {
  readonly alt: string;
  readonly webp: string;
}): JSX.Element {
  return <img src={webp} alt={alt} loading="lazy" decoding="async" />;
}
