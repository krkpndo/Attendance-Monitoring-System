import { useState } from "react";
import { Link } from "react-router";
import { useAdminProfessors, useAdminStudents, useAdminUsers } from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { CreateUserModal } from "../components/CreateUserModal";

/*
 * Users — three list endpoints (all users / students / professors) surfaced as
 * tabs. Search + type filter feed the query key. Rows link to a user detail page.
 */
type Tab = "all" | "students" | "professors";

export function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const reset = (t: Tab) => { setTab(t); setPage(1); };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content">Users</h1>
        <Button onClick={() => setCreateOpen(true)}>Create user</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="tabs tabs-box w-fit">
          <button className={`tab ${tab === "all" ? "tab-active" : ""}`} onClick={() => reset("all")}>All</button>
          <button className={`tab ${tab === "students" ? "tab-active" : ""}`} onClick={() => reset("students")}>Students</button>
          <button className={`tab ${tab === "professors" ? "tab-active" : ""}`} onClick={() => reset("professors")}>Professors</button>
        </div>
        <input
          type="search"
          placeholder="Search name / email…"
          className="input input-bordered input-sm w-64"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {tab === "all" && <AllUsers search={search} page={page} setPage={setPage} />}
      {tab === "students" && <Students search={search} page={page} setPage={setPage} />}
      {tab === "professors" && <Professors search={search} page={page} setPage={setPage} />}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

type SubProps = { search: string; page: number; setPage: (n: number) => void };

function AllUsers({ search, page, setPage }: SubProps) {
  const query = useAdminUsers({ page, limit: 15, ...(search ? { search } : {}) });
  return (
    <DataState query={query} isEmpty={query.data?.items.length === 0} empty={<EmptyState title="No users" />}>
      {(data) => (
        <>
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="hover">
                    <td><Link to={`/admin/users/${u.id}`} className="font-medium text-primary hover:underline">{u.name}</Link></td>
                    <td className="text-sm">{u.username}</td>
                    <td className="text-sm text-base-content/70">{u.email}</td>
                    <td><span className="badge badge-ghost badge-sm">{u.type}</span></td>
                    <td><Badge>{u.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}
    </DataState>
  );
}

function Students({ search, page, setPage }: SubProps) {
  const query = useAdminStudents({ page, limit: 15, ...(search ? { search } : {}) });
  return (
    <DataState query={query} isEmpty={query.data?.items.length === 0} empty={<EmptyState title="No students" />}>
      {(data) => (
        <>
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead><tr><th>Name</th><th>Student No.</th><th>Program</th><th>Year/Sec</th><th>Status</th></tr></thead>
              <tbody>
                {data.items.map((s) => (
                  <tr key={s.user.id} className="hover">
                    <td><Link to={`/admin/users/${s.user.id}`} className="font-medium text-primary hover:underline">{s.user.name}</Link></td>
                    <td className="font-mono text-sm">{s.studentNumber}</td>
                    <td className="text-sm">{s.program}</td>
                    <td className="text-sm">{s.yearLevel}-{s.section}</td>
                    <td><Badge>{s.user.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}
    </DataState>
  );
}

function Professors({ search, page, setPage }: SubProps) {
  const query = useAdminProfessors({ page, limit: 15, ...(search ? { search } : {}) });
  return (
    <DataState query={query} isEmpty={query.data?.items.length === 0} empty={<EmptyState title="No professors" />}>
      {(data) => (
        <>
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead><tr><th>Name</th><th>Employee No.</th><th>Department</th><th>Position</th><th>Status</th></tr></thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.user.id} className="hover">
                    <td><Link to={`/admin/users/${p.user.id}`} className="font-medium text-primary hover:underline">{p.user.name}</Link></td>
                    <td className="font-mono text-sm">{p.employeeNumber}</td>
                    <td className="text-sm">{p.department}</td>
                    <td className="text-sm">{p.position}</td>
                    <td><Badge>{p.user.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}
    </DataState>
  );
}
