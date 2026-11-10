import { joinClassNames } from '../join-class-names.ts';

interface SkeletonProps {
  /** Size and placement of the placeholder, set by the caller to match the content it stands for. */
  className?: string;
}

/** A placeholder in the shape of content that is loading, so that nothing moves when it arrives. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={joinClassNames('block rounded-sm bg-field motion-safe:animate-pulse', className)}
    />
  );
}
