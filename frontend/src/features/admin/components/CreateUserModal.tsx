import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useCreateUser } from "../admin.queries";
import { createUserSchema, type CreateUserForm, type CreateUserInput } from "../admin.schema";
import { userTypeSchema } from "@/lib/enums";

/*
 * Create-user modal. One flat form; the required extra fields switch on the
 * selected type (superRefine in the schema enforces them). On submit we reshape
 * the flat fields into the { studentData } / { professorData } the API expects.
 * Note: the backend sets the initial password to the username (by design).
 */
export function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateUser();
  // <Input, ctx, Output>: the form fields are the pre-coercion input type; the
  // resolver hands the parsed (coerced) output to the submit handler.
  const form = useForm<CreateUserInput, unknown, CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { type: "STUDENT" },
  });
  const type = form.watch("type");

  const onSubmit = (v: CreateUserForm) => {
    const base = { username: v.username, email: v.email, name: v.name, type: v.type };
    const body =
      v.type === "STUDENT"
        ? { ...base, studentData: { studentNumber: v.studentNumber, yearLevel: v.yearLevel, program: v.program, section: v.section, department: v.department || undefined } }
        : v.type === "PROFESSOR"
          ? { ...base, professorData: { employeeNumber: v.employeeNumber, department: v.department, position: v.position } }
          : base;
    create.mutate(body, { onSuccess: () => { form.reset({ type: "STUDENT" }); onClose(); } });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create user"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={create.isPending}>Create</Button>
        </>
      }
    >
      <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="form-control">
          <span className="label-text mb-1">Type</span>
          <select className="select select-bordered" {...form.register("type")}>
            {userTypeSchema.options.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <TextField id="cu-name" label="Full name" error={form.formState.errors.name?.message} {...form.register("name")} />
        <TextField id="cu-username" label="Username" error={form.formState.errors.username?.message} {...form.register("username")} />
        <TextField id="cu-email" label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />

        {type === "STUDENT" && (
          <>
            <TextField id="cu-sn" label="Student number" error={form.formState.errors.studentNumber?.message} {...form.register("studentNumber")} />
            <div className="grid grid-cols-2 gap-3">
              <TextField id="cu-yl" label="Year level" type="number" error={form.formState.errors.yearLevel?.message} {...form.register("yearLevel")} />
              <TextField id="cu-sec" label="Section" error={form.formState.errors.section?.message} {...form.register("section")} />
            </div>
            <TextField id="cu-prog" label="Program" error={form.formState.errors.program?.message} {...form.register("program")} />
            <TextField id="cu-dept" label="Department (optional)" {...form.register("department")} />
          </>
        )}

        {type === "PROFESSOR" && (
          <>
            <TextField id="cu-emp" label="Employee number" error={form.formState.errors.employeeNumber?.message} {...form.register("employeeNumber")} />
            <TextField id="cu-pdept" label="Department" error={form.formState.errors.department?.message} {...form.register("department")} />
            <TextField id="cu-pos" label="Position" error={form.formState.errors.position?.message} {...form.register("position")} />
          </>
        )}

        <p className="text-xs text-base-content/50">The initial password will be the username; the user is prompted to change it on first login.</p>
      </form>
    </Modal>
  );
}
