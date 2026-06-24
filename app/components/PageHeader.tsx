type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function PageHeader({
  title,
  subtitle,
}: PageHeaderProps) {
  return (
    <div
      className="
        mb-6
        p-5
        rounded-3xl
        bg-white
        dark:bg-zinc-900
        border
        border-stone-200
        dark:border-zinc-800
        text-center
      "
    >
      <h1 className="text-2xl font-bold">
        {title}
      </h1>

      <p className="text-stone-500 dark:text-zinc-400">
        {subtitle}
      </p>
    </div>
  );
}