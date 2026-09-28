export default function Loading() {
  return (
    <div className="container-mono pb-24 pt-[calc(var(--header-h)+5rem)]" aria-busy="true" aria-label="Cargando productos">
      <div className="skeleton h-20 w-2/3 max-w-xl" />
      <div className="mt-16 grid grid-cols-2 gap-5 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5] rounded-[var(--radius-lg)]" />
            <div className="skeleton mt-4 h-4 w-2/3" />
            <div className="skeleton mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
