export default function QuoteScreen({ quote }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-black px-6 py-16 text-white animate-[quoteSceneFadeOut_1.4s_ease_forwards] [animation-delay:14.8s]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06),transparent_72%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.025),rgba(255,255,255,0.025)_1px,transparent_1px,transparent_5px)] opacity-40" />

      <section className="relative z-10 w-full max-w-4xl">
        <div className="space-y-5">
          {quote.lines.map((line, index) => (
            <p
              key={`${line}-${index}`}
              className={[
                "opacity-0 text-xl leading-loose tracking-wide text-white/90",
                "sm:text-3xl",
                "animate-[quoteFadeIn_1.8s_forwards,quoteFadeOut_1.5s_forwards]",
                index === 0 ? "[animation-delay:0.7s,10.8s]" : "",
                index === 1 ? "[animation-delay:2.8s,11.5s]" : "",
                index === 2 ? "[animation-delay:4.9s,12.2s]" : ""
              ].join(" ")}
            >
              {line}
            </p>
          ))}
        </div>

        <div className="mt-12 text-right text-xs tracking-[0.3em] text-white/65 opacity-0 animate-[quoteFadeIn_1.6s_forwards,quoteFadeOut_1.8s_forwards] [animation-delay:7.2s,13.6s] sm:text-sm">
          {quote.author}
        </div>
      </section>
    </main>
  );
}