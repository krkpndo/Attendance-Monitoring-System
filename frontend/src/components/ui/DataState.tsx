import type { ReactNode } from "react";
import { Skeleton } from "./Skeleton";
import { Banner } from "./Banner";
import { Button } from "./Button";

/*
 * DataState — the §3 contract (loading / error / empty / success) in one place,
 * so every data view handles all four without a blank screen. A page reads like:
 *
 *   const q = useThing();
 *   return <DataState query={q} isEmpty={!q.data?.length} empty={<EmptyState .../>}>
 *            {(data) => <RealContent data={data} />}
 *          </DataState>;
 *
 * It uses `isPending` (no data yet) for the skeleton — NOT `isFetching`, so a
 * background refetch of an already-loaded screen doesn't re-skeleton it.
 */
type QueryLike<T> = {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: { message: string } | null;
  refetch: () => void;
};

type DataStateProps<T> = {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  isEmpty?: boolean;
  empty?: ReactNode;
  skeleton?: ReactNode;
};

export function DataState<T>({ query, children, isEmpty, empty, skeleton }: DataStateProps<T>) {
  if (query.isPending) {
    return (
      <>
        {skeleton ?? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </>
    );
  }

  if (query.isError) {
    // Content-blocking error → inline state + retry, not just a toast (§3).
    return (
      <div className="flex flex-col gap-3">
        <Banner variant="error">{query.error?.message ?? "Something went wrong."}</Banner>
        <div>
          <Button variant="ghost" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isEmpty && empty) return <>{empty}</>;

  return <>{children(query.data as T)}</>;
}
