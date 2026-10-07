import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { useAbsences, useSubmitExcuse } from "../student.queries";
import { excuseTypeSchema } from "@/lib/enums";
import { formatDate, formatTime } from "@/lib/format";

/*
 * SubmitExcuseModal — a contained task, so a modal (§2) rather than a page.
 *
 * The backend only accepts excuses for ABSENT/LATE records in CLOSED sessions
 * that aren't already excused. The /attendance/absences endpoint returns exactly
 * the unexcused ABSENT records in a date range, so we use it as the selectable
 * pool: pick a range → tick the records → choose a type + reason → submit.
 */
const EXCUSE_TYPES = excuseTypeSchema.options;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function SubmitExcuseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(daysAgo(0));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [excuseType, setExcuseType] = useState<string>(EXCUSE_TYPES[0]);
  const [description, setDescription] = useState("");

  const rangeValid = startDate <= endDate;
  const absences = useAbsences({ startDate, endDate }, open && rangeValid);
  const submit = useSubmitExcuse();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const reset = () => {
    setSelected(new Set());
    setDescription("");
    setExcuseType(EXCUSE_TYPES[0]);
  };

  const canSubmit = selected.size > 0 && description.trim().length > 0 && !submit.isPending;

  const onSubmit = () => {
    submit.mutate(
      {
        excuseType: excuseType as (typeof EXCUSE_TYPES)[number],
        description: description.trim(),
        attendanceRecordIds: [...selected],
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit an excuse letter"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} loading={submit.isPending} disabled={!canSubmit}>
            Submit
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Date range for the absence pool */}
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text mb-1">From</span>
            <input type="date" className="input input-bordered" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text mb-1">To</span>
            <input type="date" className="input input-bordered" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>
        {!rangeValid && <Banner variant="warning">Start date must be on or before the end date.</Banner>}

        {/* Selectable absences */}
        <div>
          <span className="label-text">Absences to excuse</span>
          <div className="mt-1 max-h-48 overflow-y-auto rounded-box border border-base-300">
            {absences.isPending && rangeValid ? (
              <div className="p-3 text-sm text-base-content/60">Loading…</div>
            ) : absences.data && absences.data.length > 0 ? (
              absences.data.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-3 border-b border-base-300 p-3 last:border-b-0">
                  <input type="checkbox" className="checkbox checkbox-sm" checked={selected.has(a.id)} onChange={() => toggle(a.id)} />
                  <span className="flex-1 text-sm">
                    <span className="font-medium">{a.session.schedule?.class.course.courseCode ?? "Class"}</span>{" "}
                    · {formatDate(a.session.sessionDate)} · {formatTime(a.session.startTime)}
                  </span>
                </label>
              ))
            ) : (
              <div className="p-3 text-sm text-base-content/60">No unexcused absences in this range.</div>
            )}
          </div>
        </div>

        {/* Type + reason */}
        <label className="form-control">
          <span className="label-text mb-1">Type</span>
          <select className="select select-bordered" value={excuseType} onChange={(e) => setExcuseType(e.target.value)}>
            {EXCUSE_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Reason</span>
          <textarea
            className="textarea textarea-bordered"
            rows={3}
            maxLength={1000}
            placeholder="Explain the reason for the absence…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
}
