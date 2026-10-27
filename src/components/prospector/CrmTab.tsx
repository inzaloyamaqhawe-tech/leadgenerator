import { Button } from "@/components/ui/button";

export function CrmTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-4">
          <h3 className="font-display text-base">Shared database</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Prospect records, statuses and call activity are saved directly in the same protected
            Xneelo database used by Bolide CRM.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <h3 className="font-display text-base">Prospecting first</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            New, researching, contacted and follow-up prospects remain in Township Prospector and
            stay out of the CRM pipeline.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <h3 className="font-display text-base">Interested to pipeline</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Marking a prospect Interested automatically checks the company, solution and location,
            then creates or links the CRM deal. Repeated submissions cannot create another deal.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-card p-5">
        <h3 className="font-display text-lg">Handover</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Research the business, verify contact details and call the prospect.</li>
          <li>Record calls, follow-ups, electricity supply and the rooftop solar check.</li>
          <li>
            When the prospect confirms interest, change its status to Interested.
          </li>
          <li>The system routes it automatically; it asks only when an owner or duplicate decision is required.</li>
          <li>The CRM team continues from Lead Received through KYC and proposal stages.</li>
        </ol>
        <Button className="mt-5 rounded-full bolide-gradient" asChild>
          <a href="https://bolide.co.za/crm/" target="_blank" rel="noreferrer">
            Open Bolide CRM
          </a>
        </Button>
      </div>
    </div>
  );
}
