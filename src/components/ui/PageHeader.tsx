interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="animate-fade-up mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="section-label mb-1">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--ink-muted)]">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
