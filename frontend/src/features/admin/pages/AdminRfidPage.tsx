import { useState } from "react";
import { useAdminRfidRequests, useRejectRfidRequest } from "../admin.queries";
import { rfidRequestStatusSchema } from "@/lib/enums";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { formatTimestamp } from "@/lib/format";

/*
 * RFID request queue. Admins can reject PENDING requests (with a reason);
 * fulfillment is automatic when the student registers a new card, so there's no
 * "fulfill" action here by design.
 */
const STATUSES = rfidRequestStatusSchema.options;

export function AdminRfidPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("PENDING");
  const query = useAdminRfidRequests({ page, limit: 15, ...(status ? { status } : {}) });
  const reject = useRejectRfidRequest();

  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const doReject = () => {
    if (!rejecting || !reason.trim()) return;
    reject.mutate({ requestId: rejecting, reason: reason.trim() }, { onSuccess: () => { setRejecting(null); setReason(""); } });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">RFID Requests</h1>

      <label className="form-control w-48">
        <span className="label-text mb-1">Status</span>
        <select className="select select-bordered select-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <DataState query={query} isEmpty={query.data?.items.length === 0} empty={<EmptyState title="No requests" description="No RFID requests match this filter." />}>
        {(data) => (
          <>
            <div className="flex flex-col gap-2">
              {data.items.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-4">
                  <div className="text-sm">
                    <div className="font-medium">{r.student.user.name} <span className="font-mono text-xs text-base-content/50">{r.student.studentNumber}</span></div>
                    <div className="text-base-content/60">{r.type} · {formatTimestamp(r.createdAt)}</div>
                    {r.status === "REJECTED" && r.rejectionReason && <div className="text-xs text-error">Reason: {r.rejectionReason}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{r.status}</Badge>
                    {r.status === "PENDING" && (
                      <Button size="sm" variant="error" onClick={() => setRejecting(r.id)}>Reject</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject RFID request"
        actions={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="error" loading={reject.isPending} disabled={!reason.trim()} onClick={doReject}>Reject</Button>
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
