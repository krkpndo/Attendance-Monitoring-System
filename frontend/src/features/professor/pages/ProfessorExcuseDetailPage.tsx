import { useState } from "react";
import { Link, useParams } from "react-router";
import { useProfExcuse, useReviewExcuse } from "../professor.queries";
import { DataState } from "@/components/ui/DataState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatFileSize, formatTime } from "@/lib/format";

/*
 * Excuse detail + review. A professor can only act on the PENDING dates that
 * belong to their own classes (the backend enforces this); once none are
 * pending, the review controls disappear. Reject requires a reason (modal).
 */
export function ProfessorExcuseDetailPage() {
  const { excuseId = "" } = useParams();
  const query = useProfExcuse(excuseId);
  const review = useReviewExcuse(excuseId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const approve = () => review.mutate({ status: "APPROVED" });
  const reject = () => {
    if (!reason.trim()) return;
    review.mutate({ status: "REJECTED", rejectionReason: reason.trim() }, { onSuccess: () => { setRejectOpen(false); setReason(""); } });
  };

  return (
    <div className="flex flex-col gap-4">
      <Link to="/professor/excuses" className="text-sm text-primary hover:underline">← Back to excuse letters</Link>

      <DataState query={query}>
        {(letter) => {
          const anyPending = letter.excuseDates.some((d) => d.status === "PENDING");
          return (
            <div className="flex flex-col gap-5">
              <div className="rounded-box border border-base-300 bg-base-100 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-base-content">{letter.student.name}</div>
                    <div className="text-sm text-base-content/60">{letter.student.email}</div>
                  </div>
                  <span className="badge badge-outline">{letter.excuseType.replace("_", " ")}</span>
                </div>
                <p className="mt-3 text-base-content/80">{letter.description}</p>
                <div className="mt-1 text-xs text-base-content/50">Submitted {formatDate(letter.submittedAt)}</div>
              </div>

              {anyPending && (
                <div className="flex gap-2">
                  <Button loading={review.isPending} onClick={approve}>Approve</Button>
                  <Button variant="error" disabled={review.isPending} onClick={() => setRejectOpen(true)}>Reject</Button>
                </div>
              )}

              <div>
                <h2 className="mb-2 font-semibold text-base-content">Covered dates</h2>
                <div className="flex flex-col gap-2">
                  {letter.excuseDates.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-4">
                      <div className="text-sm">
                        <div className="font-medium">{d.attendanceRecord.session.class.course.courseCode} · {d.attendanceRecord.session.class.section}</div>
                        <div className="text-base-content/60">{formatDate(d.attendanceRecord.session.sessionDate)} · {formatTime(d.attendanceRecord.session.startTime)}</div>
                        {d.status === "REJECTED" && d.rejectionReason && <div className="mt-1 text-xs text-error">Reason: {d.rejectionReason}</div>}
                      </div>
                      <Badge>{d.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {letter.attachments.length > 0 && (
                <div>
                  <h2 className="mb-2 font-semibold text-base-content">Attachments</h2>
                  <ul className="flex flex-col gap-2">
                    {letter.attachments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-3 text-sm">
                        <span className="font-mono">{a.fileName}</span>
                        <span className="text-base-content/50">{formatFileSize(a.fileSize)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }}
      </DataState>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject excuse"
        actions={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="error" onClick={reject} loading={review.isPending} disabled={!reason.trim()}>Reject</Button>
          </>
        }
      >
        <label className="form-control">
          <span className="label-text mb-1">Reason (required)</span>
          <textarea className="textarea textarea-bordered" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this excuse being rejected?" />
        </label>
      </Modal>
    </div>
  );
}
