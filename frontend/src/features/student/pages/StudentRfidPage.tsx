import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useRegisterRfid,
  useRfidRequests,
  useStudentProfile,
  useSubmitRfidRequest,
} from "../student.queries";
import { registerRfidRequestSchema, type RegisterRfidRequest } from "../student.schema";
import { DataState } from "@/components/ui/DataState";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import type { RfidRequestType } from "@/lib/enums";

/*
 * RFID Card — register the physical card the admin handed you, or report it
 * lost/damaged/request a new one. On a real terminal the reader fills in the
 * scanned UID; here we accept manual entry (with a note) so the flow is testable.
 */
export function StudentRfidPage() {
  const profile = useStudentProfile();
  const requests = useRfidRequests();
  const register = useRegisterRfid();
  const submitRequest = useSubmitRfidRequest();

  const activeCard = profile.data?.rfidCards.find((c) => c.status === "ACTIVE");
  const hasActive = !!activeCard;

  const form = useForm<RegisterRfidRequest>({
    resolver: zodResolver(registerRfidRequestSchema),
    defaultValues: { rfidNumber: "" },
  });

  const onRegister = (data: RegisterRfidRequest) =>
    register.mutate(data, { onSuccess: () => form.reset() });

  const requestCard = (type: RfidRequestType) => submitRequest.mutate({ type });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-base-content">RFID Card</h1>

      {/* Current card */}
      <div className="rounded-box border border-base-300 bg-base-100 p-5">
        <h2 className="mb-3 font-semibold text-base-content">Current card</h2>
        {profile.isPending ? (
          <span className="loading loading-spinner" />
        ) : hasActive ? (
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg">{activeCard!.rfidNumber}</span>
            <Badge>{activeCard!.status}</Badge>
          </div>
        ) : (
          <p className="text-sm text-base-content/60">You have no active card. Register one below.</p>
        )}
      </div>

      {/* Register (only if no active card) */}
      {!hasActive && (
        <div className="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 className="mb-1 font-semibold text-base-content">Register a card</h2>
          <p className="mb-3 text-sm text-base-content/60">
            Tap the card the admin gave you on the terminal — the reader fills in the number. (You can type it for testing.)
          </p>
          <form onSubmit={form.handleSubmit(onRegister)} className="flex items-end gap-3">
            <div className="flex-1">
              <TextField
                id="rfidNumber"
                label="Card number"
                placeholder="e.g. DE:AD:BE:EF:01"
                error={form.formState.errors.rfidNumber?.message}
                {...form.register("rfidNumber")}
              />
            </div>
            <Button type="submit" loading={register.isPending}>Register</Button>
          </form>
        </div>
      )}

      {/* Request a card */}
      <div className="rounded-box border border-base-300 bg-base-100 p-5">
        <h2 className="mb-1 font-semibold text-base-content">Report or request a card</h2>
        <p className="mb-3 text-sm text-base-content/60">
          Reporting lost/damaged immediately revokes your current card.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={!hasActive || submitRequest.isPending} onClick={() => requestCard("LOST")}>
            Report lost
          </Button>
          <Button variant="secondary" size="sm" disabled={!hasActive || submitRequest.isPending} onClick={() => requestCard("DAMAGED")}>
            Report damaged
          </Button>
          <Button variant="secondary" size="sm" disabled={hasActive || submitRequest.isPending} onClick={() => requestCard("NEW")}>
            Request new
          </Button>
        </div>
        {hasActive && <p className="mt-2 text-xs text-base-content/50">"Request new" is only for when you have no active card.</p>}
      </div>

      {/* Request history */}
      <div>
        <h2 className="mb-2 font-semibold text-base-content">Request history</h2>
        <DataState
          query={requests}
          isEmpty={requests.data?.length === 0}
          empty={<EmptyState title="No requests yet" description="Card requests you make will appear here." />}
        >
          {(list) => (
            <div className="flex flex-col gap-2">
              {list.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-3">
                  <div className="text-sm">
                    <span className="font-medium">{r.type}</span>
                    <span className="ml-2 text-base-content/50">{formatDate(r.createdAt)}</span>
                    {r.status === "REJECTED" && r.rejectionReason && (
                      <div className="text-xs text-error">Reason: {r.rejectionReason}</div>
                    )}
                  </div>
                  <Badge>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </DataState>
      </div>

      {register.isError && <Banner variant="error">{register.error.message}</Banner>}
    </div>
  );
}
