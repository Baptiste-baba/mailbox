interface MessageScreenProps {
  title: string;
  description: string;
}

/** Full-page message for the states where no screen can be shown. */
export function MessageScreen({ title, description }: MessageScreenProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper p-6">
      <div className="flex max-w-sm flex-col gap-2 text-center">
        <h1 className="text-title font-bold">{title}</h1>
        <p className="text-ink2">{description}</p>
      </div>
    </main>
  );
}
