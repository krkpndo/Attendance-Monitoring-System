import { useState } from "react";
import { useAdminExcuses, useReviewExcuse } from "../admin.queries";
import { excuseStatusSchema } from "@/lib/enums";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/format";

/*
 * Excuse oversight — admin override. The list endpoint returns the full letter
 * (including per-date status), and there's no separate detail endpoint, so review
 * happens inline here. Admin approve/reject applies to all pending dates at once.
 */
const STATUSES = excuseStatusSchema.options;

export function AdminExcusesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("PENDING");
  const query = useAdminExcuses({ page, limit: 15, ...(status ? { status } : {}) });
  const review = useReviewExcuse();

  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const approve = (excuseId: string) => review.mutate({ excuseId, body: { status: "APPROVED" } });
  const doReject = () => {
    if (!rejecting || !reason.trim()) return;
    review.mutate({ excuseId: rejecting, body: { status: "REJECTED", rejectionReason: reason.trim() } }, { onSuccess: () => { setRejecting(null); setReason(""); } });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Excuse Oversight</h1>

      <label className="form-control w-48">
        <span className="label-text mb-1">Status</span>
        <select className="select select-bordered select-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <DataState query={query} isEmpty={query.data?.items.length === 0} empty={<EmptyState title="No excuse letters" />}>
        {(data) => (
          <>
            <div className="flex flex-col gap-3">
              {data.items.map((l) => {
                const anyPending = l.excuseDates.some((d) => d.status === "PENDING");
                return (
                  <div key={l.id} className="rounded-box border border-base-300 bg-base-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-base-content">{l.student.name}</div>
                        <span className="badge badge-outline badge-sm mt-1">{l.excuseType.replace("_", " ")}</span>
                      </div>
                      <span className="text-xs text-base-content/50">{formatDate(l.submittedAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-base-content/80">{l.description}</p>

                    <div className="mt-3 flex flex-col gap-1 border-t border-base-300 pt-3">
                      {l.excuseDates.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{d.attendanceRecord.session.class.course.courseCode} · {formatDate(d.attendanceRecord.session.sessionDate)}</span>
                          <Badge>{d.status}</Badge>
                        </div>
                      ))}
                    </div>

                    {anyPending && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" loading={review.isPending} onClick={() => approve(l.id)}>Approve</Button>
                        <Button size="sm" variant="error" onClick={() => setRejecting(l.id)}>Reject</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject excuse"
        actions={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="error" loading={review.isPending} disabled={!reason.trim()} onClick={doReject}>Reject</Button>
          </>
        }
      >
        <label className="form-control">
          <span className="label-text mb-1">Reason (required)</span>
          <textarea className="textarea textarea-bordered" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </Modal>
    </div>
  );
}
