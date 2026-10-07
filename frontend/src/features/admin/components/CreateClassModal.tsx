import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAdminCourses, useAdminProfessors, useCreateClass } from "../admin.queries";
import { createClassSchema, type CreateClassForm } from "../admin.schema";
import { semesterSchema } from "@/lib/enums";

/*
 * Create-class modal. A class = a course taught by a professor in a section for a
 * given school year + semester. Course and professor are picked from selects that
 * load their own lists; `professorId` is the professor's User.id (matches the
 * backend, which keys class → professor on User.id).
 */
export function CreateClassModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateClass();
  const courses = useAdminCourses();
  // Pull a wide page of professors so the picker holds the full roster.
  const professors = useAdminProfessors({ page: 1, limit: 100 });

  const form = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { semester: "FIRST" },
  });

  const submit = form.handleSubmit((v) =>
    create.mutate(
      { ...v, room: v.room || undefined },
      { onSuccess: () => { form.reset({ semester: "FIRST" }); onClose(); } },
    ),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create class"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={create.isPending}>Create</Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <label className="form-control">
          <span className="label-text mb-1">Course</span>
          <select className="select select-bordered" {...form.register("courseId")} defaultValue="">
            <option value="" disabled>Select a course…</option>
            {courses.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>
            ))}
          </select>
          {form.formState.errors.courseId && <span className="mt-1 text-xs text-error">{form.formState.errors.courseId.message}</span>}
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Professor</span>
          <select className="select select-bordered" {...form.register("professorId")} defaultValue="">
            <option value="" disabled>Select a professor…</option>
            {professors.data?.items.map((p) => (
              <option key={p.user.id} value={p.user.id}>{p.user.name} ({p.employeeNumber})</option>
            ))}
          </select>
          {form.formState.errors.professorId && <span className="mt-1 text-xs text-error">{form.formState.errors.professorId.message}</span>}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <TextField id="cl-section" label="Section" error={form.formState.errors.section?.message} {...form.register("section")} />
          <TextField id="cl-year" label="School year" placeholder="2025-2026" error={form.formState.errors.schoolYear?.message} {...form.register("schoolYear")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text mb-1">Semester</span>
            <select className="select select-bordered" {...form.register("semester")}>
              {semesterSchema.options.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <TextField id="cl-room" label="Room (optional)" {...form.register("room")} />
        </div>
      </form>
    </Modal>
  );
}
