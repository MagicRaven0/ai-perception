export type SourceRef = { apa: string; url: string };

/** The source under every chart and stat, in mono like LCA's table labels. */
export function SourceLine({ source, tone = "dark" }: { source?: SourceRef; tone?: "dark" | "light" }) {
  const color = tone === "dark" ? "text-chart-text" : "text-muted";
  if (!source) {
    return <p className={`font-mono text-xs ${color}`}>Source: to be added</p>;
  }
  const linkable = /^https?:\/\//.test(source.url);
  return (
    <p className={`font-mono text-xs leading-relaxed wrap-anywhere ${color}`}>
      Source:{" "}
      {linkable ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {source.apa}
        </a>
      ) : (
        source.apa
      )}
    </p>
  );
}
