"use client";

import { AppShell, Panel } from "@/components/app-shell";
import { SectionHeading, StatCard, SurfaceLink } from "@/components/railway-ui";
import { useOrders } from "@/hooks/order.hook";
import { usePayments } from "@/hooks/payment.hook";
import { useTickets } from "@/hooks/ticket.hook";
import { useListUsers } from "@/hooks/user.hook";

export default function AdminPage() {
  const ticketsQuery = useTickets({ page: 1, limit: 1 });
  const ordersQuery = useOrders({ page: 1, limit: 1 });
  const paymentsQuery = usePayments({ page: 1, limit: 1 });
  const usersQuery = useListUsers(1, 1);

  return (
    <AppShell
      title="Operations dashboard"
      description="Diem vao chinh cho bo phan van hanh, tong hop quy mo inventory, order, payment va user tu cac service hien co."
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Tickets"
          value={String(ticketsQuery.data?.pagination.total ?? 0)}
          helper="Tong inventory ticket."
        />
        <StatCard
          label="Orders"
          value={String(ordersQuery.data?.pagination.total ?? 0)}
          helper="Tong order trong he thong."
        />
        <StatCard
          label="Payments"
          value={String(paymentsQuery.data?.pagination.total ?? 0)}
          helper="Tong giao dich thanh toan."
        />
        <StatCard
          label="Users"
          value={String(usersQuery.data?.pagination.total ?? 0)}
          helper="Tong account dang co."
        />
      </div>

      <Panel
        title="Operations modules"
        description="Mỗi module duoc dat nhu mot cockpit rieng, nhung van giu chung palette va bo cueu khong border."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Command center"
            title="Chon khu vuc van hanh"
            description="Duong dan nhanh den tung namespace admin da duoc noi voi view list/detail tuong ung."
          />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SurfaceLink href="/admin/tickets" title="Ticket ops" description="Quan ly inventory, ticket item va sale windows." />
            <SurfaceLink href="/admin/orders" title="Order ops" description="Chuyen trang thai order va theo doi issue flow." />
            <SurfaceLink href="/admin/users" title="User ops" description="Tra cuu user va context related data." />
            <SurfaceLink href="/admin/payments" title="Payment ops" description="Doi soat giao dich va can thiep state machine." />
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
