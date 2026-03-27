import Image from "next/image";

/**
 * Consistent screenshot display for docs pages.
 * Shows a bordered, rounded image with an optional caption.
 */
export function DocsImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={800}
          className="w-full"
          quality={90}
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-zinc-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
