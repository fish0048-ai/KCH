interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className="page-header animate-fade-up mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="section-label mb-1.5">{eyebrow}</p> : null}
        <h1 className="page-header-title">{title}</h1>
        {description ? <p className="page-header-desc">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
