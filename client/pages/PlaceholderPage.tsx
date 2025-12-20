interface Props {
  title: string;
  description?: string;
}
export default function PlaceholderPage({ title, description }: Props) {
  return (
    <div className="container py-24">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">
        {description ??
          "This page will be assembled next. All copy and blocks are editable in Builder later."}
      </p>
    </div>
  );
}
