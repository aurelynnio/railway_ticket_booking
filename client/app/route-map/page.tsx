import { AppShell, Panel } from "@/components/app-shell";
import { SectionHeading, SurfaceLink } from "@/components/railway-ui";

const routeGroups = [
  {
    title: "Passenger flow",
    items: [
      ["/search", "Trip discovery"],
      ["/tickets", "Ticket inventory"],
      ["/orders", "Orders registry"],
      ["/payments", "Payments ledger"],
    ],
  },
  {
    title: "Account flow",
    items: [
      ["/login", "Login"],
      ["/register", "Register"],
      ["/profile", "Profile"],
      ["/profile/tickets", "Issued tickets"],
    ],
  },
  {
    title: "Operations flow",
    items: [
      ["/admin", "Admin dashboard"],
      ["/admin/tickets", "Ticket operations"],
      ["/admin/orders", "Order operations"],
      ["/admin/users", "User operations"],
      ["/admin/payments", "Payment operations"],
    ],
  },
] as const;

export default function RouteMapPage() {
  return (
    <AppShell
      title="Route map"
      description="Tong hop cac route chinh dang co trong `client/app`, chia theo passenger, account va operations de navigate nhanh khi tiep tuc phat trien."
    >
      <Panel
        title="Route surface"
        description="Route map nay gio khong con la scaffold trong suot, ma la mot menu tac nghiep de nhay nhanh den tung view da duoc redesign."
      >
        <div className="space-y-8">
          {routeGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <SectionHeading
                eyebrow="Navigation"
                title={group.title}
                description="Moi nhom route di kem ngu canh su dung chinh de giu bo cuc thong nhat va de tra cuu nhanh."
              />
              <div className="grid gap-3 md:grid-cols-2">
                {group.items.map(([href, title]) => (
                  <SurfaceLink
                    key={href}
                    href={href}
                    title={title}
                    description={`Mo ${href} trong bo design system moi.`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
