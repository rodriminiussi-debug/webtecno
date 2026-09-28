export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { heading: string; body: string }[] }) {
  return (
    <article className="container-mono pb-24 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <div className="grid gap-12 md:grid-cols-12">
        <header className="md:col-span-4">
          <p className="label-mono text-muted">Legal · actualizado {updated}</p>
          <h1 className="mt-4 text-title font-semibold">{title}</h1>
        </header>
        <div className="max-w-prose md:col-span-7 md:col-start-6">
          {sections.map((section, index) => (
            <section key={section.heading} className="border-t border-line py-8">
              <h2 className="flex gap-4 text-[18px] font-medium tracking-[-0.02em]">
                <span className="label-mono pt-1.5 text-muted">{String(index + 1).padStart(2, '0')}</span>
                {section.heading}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}
