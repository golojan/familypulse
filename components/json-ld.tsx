/**
 * Emits a JSON-LD structured-data <script> for SEO. The data is JSON-serialized
 * (not user HTML), so this is safe; angle brackets are escaped to avoid any
 * chance of breaking out of the script tag.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
