interface PageContainerProps {
  title?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  description,
  actions,
  children,
}: PageContainerProps) {
  const hasHeader = title || description || actions;
  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-full">
      {hasHeader && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
