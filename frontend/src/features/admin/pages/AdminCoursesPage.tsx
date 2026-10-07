import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminCourses, useCreateCourse } from "../admin.queries";
import { createCourseSchema, type CreateCourseForm, type CreateCourseInput } from "../admin.schema";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";

export function AdminCoursesPage() {
  const query = useAdminCourses();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content">Courses</h1>
        <Button onClick={() => setOpen(true)}>Create course</Button>
      </div>

      <DataState query={query} isEmpty={query.data?.length === 0} empty={<EmptyState title="No courses" action={<Button onClick={() => setOpen(true)}>Create course</Button>} />}>
        {(courses) => (
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead><tr><th>Code</th><th>Name</th><th>Units</th><th>Classes</th></tr></thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="hover">
                    <td><Link to={`/admin/courses/${c.id}`} className="font-mono font-medium text-primary hover:underline">{c.courseCode}</Link></td>
                    <td>{c.courseName}</td>
                    <td>{c.units}</td>
                    <td>{c._count?.classes ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>

      <CreateCourseModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function CreateCourseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateCourse();
  const form = useForm<CreateCourseInput, unknown, CreateCourseForm>({ resolver: zodResolver(createCourseSchema) });
  const submit = form.handleSubmit((v) => create.mutate(v, { onSuccess: () => { form.reset(); onClose(); } }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create course"
      actions={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={create.isPending}>Create</Button></>}
    >
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <TextField id="cc-code" label="Course code" error={form.formState.errors.courseCode?.message} {...form.register("courseCode")} />
        <TextField id="cc-name" label="Course name" error={form.formState.errors.courseName?.message} {...form.register("courseName")} />
        <TextField id="cc-units" label="Units" type="number" error={form.formState.errors.units?.message} {...form.register("units")} />
        <label className="form-control">
          <span className="label-text mb-1">Description (optional)</span>
          <textarea className="textarea textarea-bordered" rows={2} {...form.register("courseDescription")} />
        </label>
      </form>
    </Modal>
  );
}
