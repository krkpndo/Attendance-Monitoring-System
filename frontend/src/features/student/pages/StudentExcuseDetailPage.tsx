import { useRef } from "react";
import { Link, useParams } from "react-router";
import { useExcuseLetter, useUploadAttachments } from "../student.queries";
import { DataState } from "@/components/ui/DataState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatFileSize, formatTime } from "@/lib/format";

/*
 * Excuse detail — the full letter: each covered date with its own review status
 * (a single letter can span classes reviewed by different professors), plus
 * attachments. Attachment upload is only offered while at least one date is still
 * PENDING (the backend rejects uploads once reviewed).
 */
export function StudentExcuseDetailPage() {
  const { excuseId = "" } = useParams();
  const query = useExcuseLetter(excuseId);
  const upload = useUploadAttachments(excuseId);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = (files: FileList | null) => {
    if (files && files.length > 0) upload.mutate([...files]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <Link to="/student/excuses" className="text-sm text-primary hover:underline">
        ← Back to excuse letters
      </Link>

      <DataState query={query}>
        {(letter) => {
          const anyPending = letter.excuseDates.some((d) => d.status === "PENDING");
          return (
            <div className="flex flex-col gap-5">
              <div className="rounded-box border border-base-300 bg-base-100 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge-outline">{letter.excuseType.replace("_", " ")}</span>
                  <span className="text-xs text-base-content/50">Submitted {formatDate(letter.submittedAt)}</span>
                </div>
                <p className="mt-3 text-base-content/80">{letter.description}</p>
              </div>

              <div>
                <h2 className="mb-2 font-semibold text-base-content">Covered dates</h2>
                <div className="flex flex-col gap-2">
                  {letter.excuseDates.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-4">
                      <div className="text-sm">
                        <div className="font-medium">{d.attendanceRecord.session.class.course.courseCode}</div>
                        <div className="text-base-content/60">
                          {formatDate(d.attendanceRecord.session.sessionDate)} ·{" "}
                          {formatTime(d.attendanceRecord.session.startTime)}
                        </div>
                        {d.status === "REJECTED" && d.rejectionReason && (
                          <div className="mt-1 text-xs text-error">Reason: {d.rejectionReason}</div>
                        )}
                        {d.reviewedByUser && (
                          <div className="mt-1 text-xs text-base-content/50">Reviewed by {d.reviewedByUser.name}</div>
                        )}
                      </div>
                      <Badge>{d.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold text-base-content">Attachments</h2>
                  {anyPending && (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/jpeg,application/pdf"
                        className="hidden"
                        onChange={(e) => onFiles(e.target.files)}
                      />
                      <Button size="sm" variant="secondary" loading={upload.isPending} onClick={() => fileRef.current?.click()}>
                        Upload
                      </Button>
                    </>
                  )}
                </div>
                {letter.attachments.length === 0 ? (
                  <p className="text-sm text-base-content/50">No attachments.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {letter.attachments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-3 text-sm">
                        <span className="font-mono">{a.fileName}</span>
                        <span className="text-base-content/50">{formatFileSize(a.fileSize)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
