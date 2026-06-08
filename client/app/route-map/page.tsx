import Link from "next/link";

import { AppShell, Panel } from "@/components/app-shell";

export default function RouteMapPage() {
  return (
    <AppShell
      title="Client Route Map"
      description="Trang route-map nay la diem vao nhanh de di den search, ticket detail, order detail va profile flow."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title="Nguoi dung"
          description="Cac route phuc vu tim chuyen, xem chi tiet va theo doi order."
        >
          <div className="flex flex-col gap-3 text-sm text-zinc-700">
            <Link className="font-medium text-amber-700 hover:underline" href="/search">
              /search
            </Link>
            <Link className="font-medium text-amber-700 hover:underline" href="/tickets">
              /tickets
            </Link>
            <Link className="font-medium text-amber-700 hover:underline" href="/profile">
              /profile
            </Link>
          </div>
        </Panel>
        <Panel
          title="Ghi chu"
          description="Profile va order hien tai dua tren session cookie. Login xong la client co the goi luong profile/order cua user hien tai."
        >
          <p className="text-sm leading-6 text-zinc-700">
            Backend orders hien van la in-memory scaffold, nen luong tao order
            tot nhat la bat dau tu trang chi tiet ticket.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
