import Link from "next/link";
import { TrainFront, Mail, Phone, MapPin } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { STATIONS } from "@/lib/stations";

const footerLinks = {
  booking: [
    { label: "Tìm chuyến", href: "/search" },
    { label: "Danh sách vé", href: "/tickets" },
    { label: "Lộ trình", href: "/route-map" },
    { label: "Đơn của tôi", href: "/profile/orders" },
  ],
  support: [
    { label: "Trung tâm trợ giúp", href: "#" },
    { label: "Điều khoản sử dụng", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
    { label: "Chính sách hoàn vé", href: "#" },
  ],
  company: [
    { label: "Về chúng tôi", href: "#" },
    { label: "Tuyển dụng", href: "#" },
    { label: "Liên hệ", href: "#" },
    { label: "Blog", href: "#" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="bg-card/40 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="space-y-5">
            <BrandMark size="lg" />
            <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
              Nền tảng đặt vé tàu đường sắt Việt Nam hiện đại. Kết nối hàng trăm
              chuyến Bắc – Trung – Nam với trải nghiệm minh bạch, ấm áp và tin cậy.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary">
                <TrainFront className="size-3" />
                {STATIONS.length} ga phủ sóng
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
                VNPay
              </span>
            </div>
          </div>

          {/* Links */}
          <FooterColumn title="Đặt vé" links={footerLinks.booking} />
          <FooterColumn title="Hỗ trợ" links={footerLinks.support} />

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
              Liên hệ
            </h4>
            <ul className="mt-5 space-y-3.5">
              <li className="flex items-start gap-3 text-sm text-ink-muted">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>1900 0000 (24/7)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-ink-muted">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>support@mekongline.vn</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-ink-muted">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>265 Nguyễn Trãi, Hà Nội</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-subtle">
            © 2026 Mekong Line. Đã đăng ký bản quyền.
          </p>
          <p className="text-xs font-medium tracking-wide text-ink-subtle">
            Thiết kế cho hành trình đường sắt Việt Nam
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
        {title}
      </h4>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-ink-muted transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
