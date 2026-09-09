import { Metadata } from "next";
import {
  Train,
  Palette,
  Type,
  MousePointerClick,
  Square,
  FormInput,
  Tag,
  Activity,
  Ruler,
  Sparkles,
  Sun,
  Moon,
  Check,
  X,
  AlertTriangle,
  Info,
  ArrowRight,
  Ticket,
  CreditCard,
  ShoppingCart,
  Armchair,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Design System — Mekong Line",
  description:
    "Bộ thiết kế trực quan cho Mekong Line: màu sắc, typography, thành phần và quy tắc thiết kế.",
};

/* ------------------------------------------------------------------ */
/*  Section shell                                                      */
/* ------------------------------------------------------------------ */
function Section({
  id,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Color swatch                                                       */
/* ------------------------------------------------------------------ */
function Swatch({
  name,
  hex,
  variable,
  textColor = "text-white",
}: {
  name: string;
  hex: string;
  variable: string;
  textColor?: string;
}) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`flex h-20 items-end p-3 ${textColor}`}
        style={{ backgroundColor: hex }}
      >
        <span className="font-mono text-xs font-medium opacity-90">{hex}</span>
      </div>
      <div className="border-t border-border px-3 py-2.5">
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="font-mono text-[11px] text-ink-subtle">{variable}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Token row                                                          */
/* ------------------------------------------------------------------ */
function TokenRow({
  label,
  value,
  preview,
}: {
  label: string;
  value: string;
  preview?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="font-mono text-xs text-ink-subtle">{value}</p>
      </div>
      {preview && <div className="shrink-0">{preview}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===== Hero ===== */}
      <header className="relative overflow-hidden border-b border-border texture-paper">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="app-container relative py-20">
          <div className="eyebrow">Design System v2.0</div>
          <h1 className="max-w-3xl">
            Mekong Line
            <span className="gradient-text-warm"> — Hệ thống thiết kế</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Bộ thiết kế trực quan lấy cảm hứng từ hoàng hôn sông Mê Kông và
            hành trình đường sắt Bắc-Nam. Ấm áp, tinh tế, đầy tính biên tập —
            xây dựng trên shadcn/ui với các token tùy chỉnh hoàn chỉnh.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg">
              Bắt đầu使用 <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg">
              Xem tài liệu
            </Button>
            <Button variant="accent" size="lg">
              <Sparkles className="size-4" /> Khám phá
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            <Badge variant="solid">Next.js 16</Badge>
            <Badge variant="solid-accent">shadcn/ui</Badge>
            <Badge variant="gold">Tailwind CSS 4</Badge>
            <Badge variant="outline">TypeScript</Badge>
            <Badge variant="outline">React 19</Badge>
          </div>
        </div>
        <div className="transit-line" />
      </header>

      {/* ===== Nav anchors ===== */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="app-container flex gap-1 overflow-x-auto py-3">
          {[
            { id: "colors", label: "Màu sắc", icon: Palette },
            { id: "typography", label: "Typography", icon: Type },
            { id: "buttons", label: "Nút bấm", icon: MousePointerClick },
            { id: "cards", label: "Thẻ", icon: Square },
            { id: "forms", label: "Biểu mẫu", icon: FormInput },
            { id: "badges", label: "Nhãn", icon: Tag },
            { id: "status", label: "Trạng thái", icon: Activity },
            { id: "tokens", label: "Token", icon: Ruler },
          ].map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink"
            >
              <Icon className="size-3.5" />
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="app-container space-y-20 py-16">
        {/* ===== COLORS ===== */}
        <Section
          id="colors"
          icon={Palette}
          title="Hệ thống màu sắc"
          description="Bảng màu lấy cảm hứng từ thiên nhiên Việt Nam: rừng sâu, hoàng hôn và ruộng lúa."
        >
          {/* Primary */}
          <div className="mb-10">
            <h3 className="kicker mb-4">Màu chính — Forest Green</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
              {[
                { n: "50", h: "#ecf5f0", tc: "text-ink" },
                { n: "100", h: "#d4e6dd", tc: "text-ink" },
                { n: "200", h: "#a9cdbb", tc: "text-ink" },
                { n: "300", h: "#7eb499", tc: "text-white" },
                { n: "400", h: "#539b77", tc: "text-white" },
                { n: "500", h: "#2d825a", tc: "text-white" },
                { n: "600", h: "#0f3d2e", tc: "text-white" },
                { n: "700", h: "#0a2e22", tc: "text-white" },
                { n: "800", h: "#08241b", tc: "text-white" },
                { n: "900", h: "#061a14", tc: "text-white" },
              ].map((c) => (
                <div
                  key={c.n}
                  className={`flex h-16 items-end rounded-lg p-2 ${c.tc}`}
                  style={{ backgroundColor: c.h }}
                >
                  <span className="font-mono text-[10px] font-semibold">
                    {c.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div className="mb-10">
            <h3 className="kicker mb-4">Màu nhấn — Sunset Orange</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
              {[
                { n: "50", h: "#fdf5ef", tc: "text-ink" },
                { n: "100", h: "#fbe8d8", tc: "text-ink" },
                { n: "200", h: "#f6d0b1", tc: "text-ink" },
                { n: "300", h: "#f1b88a", tc: "text-ink" },
                { n: "400", h: "#ec9f63", tc: "text-white" },
                { n: "500", h: "#e58745", tc: "text-white" },
                { n: "600", h: "#d96c3a", tc: "text-white" },
                { n: "700", h: "#c45a2a", tc: "text-white" },
                { n: "800", h: "#a84a20", tc: "text-white" },
                { n: "900", h: "#8a3c1a", tc: "text-white" },
              ].map((c) => (
                <div
                  key={c.n}
                  className={`flex h-16 items-end rounded-lg p-2 ${c.tc}`}
                  style={{ backgroundColor: c.h }}
                >
                  <span className="font-mono text-[10px] font-semibold">
                    {c.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gold */}
          <div className="mb-10">
            <h3 className="kicker mb-4">Màu vàng — Harvest Gold</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
              {[
                { n: "50", h: "#fdf9e8", tc: "text-ink" },
                { n: "100", h: "#faf0c4", tc: "text-ink" },
                { n: "200", h: "#f5e188", tc: "text-ink" },
                { n: "300", h: "#efd24c", tc: "text-ink" },
                { n: "400", h: "#e0bd2a", tc: "text-white" },
                { n: "500", h: "#c9a227", tc: "text-white" },
                { n: "600", h: "#a8851f", tc: "text-white" },
                { n: "700", h: "#876817", tc: "text-white" },
                { n: "800", h: "#664b0f", tc: "text-white" },
                { n: "900", h: "#443208", tc: "text-white" },
              ].map((c) => (
                <div
                  key={c.n}
                  className={`flex h-16 items-end rounded-lg p-2 ${c.tc}`}
                  style={{ backgroundColor: c.h }}
                >
                  <span className="font-mono text-[10px] font-semibold">
                    {c.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Core + Semantic */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Swatch
              name="Primary"
              hex="#0f3d2e"
              variable="--primary"
            />
            <Swatch
              name="Accent"
              hex="#d96c3a"
              variable="--accent"
            />
            <Swatch
              name="Gold"
              hex="#c9a227"
              variable="--gold"
            />
            <Swatch
              name="Background"
              hex="#faf7f2"
              variable="--background"
              textColor="text-ink"
            />
            <Swatch
              name="Success"
              hex="#2d6a4f"
              variable="--success"
            />
            <Swatch
              name="Warning"
              hex="#b45309"
              variable="--warning"
            />
            <Swatch
              name="Destructive"
              hex="#b91c1c"
              variable="--destructive"
            />
            <Swatch
              name="Info"
              hex="#1d4ed8"
              variable="--info"
            />
          </div>
        </Section>

        {/* ===== TYPOGRAPHY ===== */}
        <Section
          id="typography"
          icon={Type}
          title="Typography"
          description="Hai lớp font: Poppins cho tiêu đề và giao diện, JetBrains Mono cho dữ liệu."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Display */}
            <Card padding="lg">
              <CardHeader>
                <Badge variant="gold">Display</Badge>
                <CardTitle className="text-2xl">Poppins</CardTitle>
                <CardDescription>
                  Tiêu đề, trang chí, số lớn. Hình học, ấm áp, hiện đại với nét bo tròn đặc trưng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="display text-4xl font-semibold leading-tight text-ink">
                  Aa
                </p>
                <p className="display mt-2 text-lg italic text-ink-muted">
                  Hành trình phía trước
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    500
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    600
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    700
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    800
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Sans */}
            <Card padding="lg">
              <CardHeader>
                <Badge>UI / Body</Badge>
                <CardTitle className="text-2xl">Poppins</CardTitle>
                <CardDescription>
                  Nội dung, nhãn, điều hướng, biểu mẫu. Rõ ràng, hiện đại, dễ đọc ở mọi kích thước.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-semibold leading-tight text-ink">
                  Aa
                </p>
                <p className="mt-2 text-lg text-ink-muted">
                  Đặt vé tàu nhanh chóng và dễ dàng
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    300
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    400
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    500
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    600
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    700
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Mono */}
            <Card padding="lg">
              <CardHeader>
                <Badge variant="accent">Mono / Data</Badge>
                <CardTitle className="text-2xl">JetBrains Mono</CardTitle>
                <CardDescription>
                  Mã vé, ghế, đơn hàng, giá, thời gian. Căn chỉnh dạng bảng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mono text-4xl font-semibold leading-tight text-ink">
                  Aa
                </p>
                <p className="mono mt-2 text-lg text-ink-muted">
                  MK-2048 · A12 · 1.250.000₫
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    400
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    500
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-ink-muted">
                    600
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Heading scale */}
          <Card className="mt-6" padding="lg">
            <CardHeader>
              <CardTitle>Thang tiêu đề</CardTitle>
              <CardDescription>Từ H1 đến H6, tối ưu cho đọc trên màn hình.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b border-border pb-4">
                <span className="kicker">H1</span>
                <h1 className="mt-1">Hành trình đường sắt Bắc-Nam</h1>
              </div>
              <div className="border-b border-border pb-4">
                <span className="kicker">H2</span>
                <h2 className="mt-1">Tìm chuyến tàu phù hợp</h2>
              </div>
              <div className="border-b border-border pb-4">
                <span className="kicker">H3</span>
                <h3 className="mt-1">Chọn ghế ngồi</h3>
              </div>
              <div className="border-b border-border pb-4">
                <span className="kicker">H4</span>
                <h4 className="mt-1">Thông tin hành khách</h4>
              </div>
              <div className="border-b border-border pb-4">
                <span className="kicker">H5</span>
                <h5 className="mt-1">Chi tiết thanh toán</h5>
              </div>
              <div>
                <span className="kicker">H6</span>
                <h6 className="mt-1">Điều khoản và điều kiện</h6>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ===== BUTTONS ===== */}
        <Section
          id="buttons"
          icon={MousePointerClick}
          title="Nút bấm"
          description="8 biến thể màu sắc, 7 kích thước, hiệu ứng chuyển động mượt mà."
        >
          <Card padding="lg" className="mb-6">
            <CardHeader>
              <CardTitle>Biến thể</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="gold">Gold</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button variant="link-accent">Link Accent</Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Kích thước</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </CardContent>
            </Card>

            <Card padding="lg">
              <CardHeader>
                <CardTitle>Với icon</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button>
                  <Train className="size-4" /> Đặt vé
                </Button>
                <Button variant="accent">
                  <CreditCard className="size-4" /> Thanh toán
                </Button>
                <Button variant="outline">
                  <Ticket className="size-4" /> Vé của tôi
                </Button>
                <Button variant="ghost">
                  Xem thêm <ArrowRight className="size-4" />
                </Button>
                <Button size="icon" aria-label="Search">
                  <Train className="size-4" />
                </Button>
                <Button size="icon-sm" variant="outline" aria-label="Filter">
                  <Armchair className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card padding="lg" className="mt-6">
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button variant="outline" disabled>
                Disabled Outline
              </Button>
              <Button>
                <Check className="size-4" /> Đã xác nhận
              </Button>
              <Button variant="destructive">
                <X className="size-4" /> Hủy bỏ
              </Button>
            </CardContent>
          </Card>
        </Section>

        {/* ===== CARDS ===== */}
        <Section
          id="cards"
          icon={Square}
          title="Thẻ (Card)"
          description="5 biến thể: viền, nổi, phẳng, tối giản, kính cong."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card variant="outlined" padding="lg">
              <CardHeader>
                <Badge>Outlined</Badge>
                <CardTitle>Thẻ viền</CardTitle>
                <CardDescription>
                  Dùng cho nội dung thông thường, tập trung vào nội dung.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">
                  Đây là một thẻ có viền nhẹ, phù hợp cho hầu hết các trường hợp.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="link" size="sm">
                  Tìm hiểu thêm <ArrowRight className="size-3" />
                </Button>
              </CardFooter>
            </Card>

            <Card variant="elevated" padding="lg">
              <CardHeader>
                <Badge variant="accent">Elevated</Badge>
                <CardTitle>Thẻ nổi</CardTitle>
                <CardDescription>
                  Có đổ bóng nhẹ, nhấn mạnh nội dung quan trọng.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">
                  Thẻ nổi với shadow tinh tế, phù hợp cho các yếu tố cần chú ý.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="link-accent" size="sm">
                  Tìm hiểu thêm <ArrowRight className="size-3" />
                </Button>
              </CardFooter>
            </Card>

            <Card variant="flat" padding="lg">
              <CardHeader>
                <Badge variant="secondary">Flat</Badge>
                <CardTitle>Thẻ phẳng</CardTitle>
                <CardDescription>
                  Nền xám nhạt, không viền, dùng cho nhóm nội dung phụ.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">
                  Thẻ phẳng với nền màu secondary, phù hợp cho thông tin bổ sung.
                </p>
              </CardContent>
            </Card>

            <Card variant="quiet" padding="lg">
              <CardHeader>
                <Badge variant="outline">Quiet</Badge>
                <CardTitle>Thẻ tối giản</CardTitle>
                <CardDescription>
                  Hoàn toàn trong suốt, dùng cho bố cục không cần viền.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">
                  Thẻ không có nền hay viền, tối giản nhất.
                </p>
              </CardContent>
            </Card>

            <Card variant="glass" padding="lg" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-gold/20" />
              <div className="relative">
                <CardHeader>
                  <Badge variant="gold">Glass</Badge>
                  <CardTitle>Thẻ kính</CardTitle>
                  <CardDescription>
                    Hiệu ứng kính mờ, dùng cho hero và nền trang trí.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-ink-muted">
                    Thẻ với hiệu ứng backdrop-blur, phù hợp cho các khu vực trang trí.
                  </p>
                </CardContent>
              </div>
            </Card>

            <Card variant="elevated" padding="lg" interactive>
              <CardHeader>
                <Badge variant="success">Interactive</Badge>
                <CardTitle>Thẻ tương tác</CardTitle>
                <CardDescription>
                  Có hiệu ứng hover nâng lên, dùng cho danh sách có thể nhấn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">
                  Di chuột vào thẻ này để thấy hiệu ứng nâng lên và đổ bóng.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-ink-subtle">Hover me →</span>
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* ===== FORMS ===== */}
        <Section
          id="forms"
          icon={FormInput}
          title="Biểu mẫu"
          description="Input, Select với hiệu ứng focus ấm áp và trạng thái lỗi rõ ràng."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Input</CardTitle>
                <CardDescription>Các trạng thái của trường nhập liệu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Họ và tên
                  </label>
                  <Input placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    defaultValue="user@mekongline.vn"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Số điện thoại (lỗi)
                  </label>
                  <Input
                    aria-invalid
                    placeholder="Số điện thoại không hợp lệ"
                    defaultValue="123"
                  />
                  <p className="mt-1.5 text-xs text-destructive">
                    Vui lòng nhập số điện thoại hợp lệ (10 chữ số).
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Trường bị vô hiệu
                  </label>
                  <Input disabled placeholder="Không thể chỉnh sửa" />
                </div>
              </CardContent>
            </Card>

            <Card padding="lg">
              <CardHeader>
                <CardTitle>Select & Controls</CardTitle>
                <CardDescription>Dropdown và các điều khiển khác.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Ga đi
                  </label>
                  <Select defaultValue="hanoi">
                    <option value="hanoi">Hà Nội</option>
                    <option value="danang">Đà Nẵng</option>
                    <option value="saigon">Sài Gòn</option>
                    <option value="hue">Huế</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Ga đến
                  </label>
                  <Select defaultValue="saigon">
                    <option value="hanoi">Hà Nội</option>
                    <option value="danang">Đà Nẵng</option>
                    <option value="saigon">Sài Gòn</option>
                    <option value="hue">Huế</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    Khoảng cách ghế
                  </label>
                  <Select defaultValue="standard">
                    <option value="standard">Ghế ngồi cứng</option>
                    <option value="soft">Ghế ngồi mềm</option>
                    <option value="berth">Giường nằm 4 người</option>
                    <option value="berth2">Giường nằm 2 người</option>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button>
                    <Search className="size-4" /> Tìm chuyến
                  </Button>
                  <Button variant="outline">Đặt lại</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ===== BADGES ===== */}
        <Section
          id="badges"
          icon={Tag}
          title="Nhãn (Badge)"
          description="11 biến thể màu sắc cho mọi ngữ cảnh sử dụng."
        >
          <Card padding="lg">
            <CardContent className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="gold">Gold</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="solid">Solid</Badge>
              <Badge variant="solid-accent">Solid Accent</Badge>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card padding="md">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-success" />
                <Badge variant="success">Đã xác nhận</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Dùng cho trạng thái thành công, đã hoàn tất.
              </p>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning" />
                <Badge variant="warning">Chờ xử lý</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Dùng cho trạng thái đang chờ, cần attention.
              </p>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-2">
                <X className="size-4 text-destructive" />
                <Badge variant="destructive">Đã hủy</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Dùng cho trạng thái lỗi, đã hủy, cần cảnh báo.
              </p>
            </Card>
            <Card padding="md">
              <div className="flex items-center gap-2">
                <Info className="size-4 text-info" />
                <Badge variant="info">Thông tin</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Dùng cho thông tin trung tính, ghi chú.
              </p>
            </Card>
          </div>
        </Section>

        {/* ===== STATUS ===== */}
        <Section
          id="status"
          icon={Activity}
          title="Màu trạng thái nghiệp vụ"
          description="Bảng màu chuyên dụng cho vé, đơn hàng và thanh toán."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Ticket status */}
            <Card padding="lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ticket className="size-4 text-primary" />
                  <CardTitle className="text-base">Trạng thái vé</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Đã出票", var: "success", bg: "var(--ticket-issued-bg)", color: "var(--ticket-issued)" },
                  { label: "Chờ出票", var: "warning", bg: "var(--ticket-pending-bg)", color: "var(--ticket-pending)" },
                  { label: "Đã hủy", var: "destructive", bg: "var(--ticket-cancelled-bg)", color: "var(--ticket-cancelled)" },
                  { label: "Đã退票", var: "secondary", bg: "var(--ticket-refunded-bg)", color: "var(--ticket-refunded)" },
                  { label: "Đã sử dụng", var: "secondary", bg: "var(--ticket-used-bg)", color: "var(--ticket-used)" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    style={{ backgroundColor: s.bg }}
                  >
                    <span className="text-sm font-medium" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink-subtle">
                      {s.color}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order status */}
            <Card padding="lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-primary" />
                  <CardTitle className="text-base">Trạng thái đơn hàng</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Chờ thanh toán", bg: "var(--order-pending-bg)", color: "var(--order-pending)" },
                  { label: "Đã thanh toán", bg: "var(--order-paid-bg)", color: "var(--order-paid)" },
                  { label: "Đã xác nhận", bg: "var(--order-confirmed-bg)", color: "var(--order-confirmed)" },
                  { label: "Đã hoàn tất", bg: "var(--order-completed-bg)", color: "var(--order-completed)" },
                  { label: "Đã hủy", bg: "var(--order-cancelled-bg)", color: "var(--order-cancelled)" },
                  { label: "Đã hoàn tiền", bg: "var(--order-refunded-bg)", color: "var(--order-refunded)" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    style={{ backgroundColor: s.bg }}
                  >
                    <span className="text-sm font-medium" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink-subtle">
                      {s.color}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment status */}
            <Card padding="lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-primary" />
                  <CardTitle className="text-base">Trạng thái thanh toán</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Chờ thanh toán", bg: "var(--payment-pending-bg)", color: "var(--payment-pending)" },
                  { label: "Thành công", bg: "var(--payment-success-bg)", color: "var(--payment-success)" },
                  { label: "Thất bại", bg: "var(--payment-failed-bg)", color: "var(--payment-failed)" },
                  { label: "Đã hoàn tiền", bg: "var(--payment-refunded-bg)", color: "var(--payment-refunded)" },
                  { label: "Hoàn một phần", bg: "var(--payment-partial-bg)", color: "var(--payment-partial)" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    style={{ backgroundColor: s.bg }}
                  >
                    <span className="text-sm font-medium" style={{ color: s.color }}>
                      {s.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink-subtle">
                      {s.color}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Seat status */}
          <Card padding="lg" className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Armchair className="size-4 text-primary" />
                <CardTitle className="text-base">Trạng thái ghế</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {[
                  { label: "Còn trống", bg: "var(--seat-available)", border: "var(--seat-available-border)", text: "var(--seat-available-text)" },
                  { label: "Đã chọn", bg: "var(--seat-selected)", border: "var(--seat-selected-border)", text: "var(--seat-selected-text)" },
                  { label: "Đã đặt", bg: "var(--seat-occupied)", border: "var(--seat-occupied-border)", text: "var(--seat-occupied-text)" },
                  { label: "Nữ", bg: "var(--seat-female)", border: "var(--seat-female-border)", text: "var(--seat-female-text)" },
                  { label: "Tiếp cận", bg: "var(--seat-accessible)", border: "var(--seat-accessible-border)", text: "var(--seat-accessible-text)" },
                  { label: "Cao cấp", bg: "var(--seat-premium)", border: "var(--seat-premium-border)", text: "var(--seat-premium-text)" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div
                      className="mx-auto flex size-12 items-center justify-center rounded-lg border-2 text-xs font-bold"
                      style={{
                        backgroundColor: s.bg,
                        borderColor: s.border,
                        color: s.text,
                      }}
                    >
                      A1
                    </div>
                    <p className="mt-2 text-xs font-medium text-ink-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ===== TOKENS ===== */}
        <Section
          id="tokens"
          icon={Ruler}
          title="Design Tokens"
          description="Các giá trị cơ bản: bo góc, đổ bóng, khoảng cách, độ trong suốt."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radius */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Bo góc (Border Radius)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "sm", value: "0.5rem (8px)", size: "rounded-md" },
                  { label: "md", value: "0.75rem (12px)", size: "rounded-lg" },
                  { label: "lg", value: "1rem (16px)", size: "rounded-xl" },
                  { label: "xl", value: "1.25rem (20px)", size: "rounded-2xl" },
                  { label: "full", value: "9999px", size: "rounded-full" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-4">
                    <div
                      className={`flex size-14 items-center justify-center border-2 border-border bg-card ${r.size}`}
                    >
                      <span className="font-mono text-[10px] text-ink-muted">{r.label}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{r.label}</p>
                      <p className="font-mono text-xs text-ink-subtle">{r.value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shadows */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Đổ bóng (Shadows)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "xs", value: "0 1px 2px rgba(0,0,0,0.04)", shadow: "shadow-[0_1px_2px_0_rgb(26_26_26/0.04)]" },
                  { label: "sm", value: "0 1px 3px rgba(0,0,0,0.06)", shadow: "shadow-[0_1px_3px_rgb(26_26_26/0.06),0_1px_2px_rgb(26_26_26/0.04)]" },
                  { label: "md", value: "0 4px 16px rgba(0,0,0,0.08)", shadow: "shadow-[0_4px_16px_-2px_rgb(26_26_26/0.08),0_2px_6px_-2px_rgb(26_26_26/0.04)]" },
                  { label: "lg", value: "0 12px 32px rgba(0,0,0,0.10)", shadow: "shadow-[0_12px_32px_-4px_rgb(26_26_26/0.10),0_4px_12px_-4px_rgb(26_26_26/0.06)]" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-4">
                    <div
                      className={`flex size-14 items-center justify-center rounded-xl bg-card ${s.shadow}`}
                    >
                      <span className="font-mono text-[10px] text-ink-muted">{s.label}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{s.label}</p>
                      <p className="font-mono text-xs text-ink-subtle">{s.value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Spacing */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Khoảng cách (Spacing)</CardTitle>
                <CardDescription>Cơ sở 4px, từ 4px đến 80px.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: "space-1", value: "4px", w: "w-1" },
                    { label: "space-2", value: "8px", w: "w-2" },
                    { label: "space-3", value: "12px", w: "w-3" },
                    { label: "space-4", value: "16px", w: "w-4" },
                    { label: "space-6", value: "24px", w: "w-6" },
                    { label: "space-8", value: "32px", w: "w-8" },
                    { label: "space-12", value: "48px", w: "w-12" },
                    { label: "space-16", value: "64px", w: "w-16" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <span className="w-20 font-mono text-xs text-ink-muted">{s.label}</span>
                      <div className={`h-4 rounded bg-primary/20 ${s.w}`} />
                      <span className="font-mono text-xs text-ink-subtle">{s.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Motion */}
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Chuyển động (Motion)</CardTitle>
                <CardDescription>Thời gian và đường cong easing chuẩn hóa.</CardDescription>
              </CardHeader>
              <CardContent>
                <TokenRow label="Fast" value="150ms" />
                <TokenRow label="Base" value="250ms" />
                <TokenRow label="Slow" value="400ms" />
                <TokenRow label="Slower" value="600ms" />
                <TokenRow label="Ease Standard" value="cubic-bezier(0.4, 0, 0.2, 1)" />
                <TokenRow label="Ease Emphasized" value="cubic-bezier(0.2, 0, 0, 1)" />
                <TokenRow label="Ease Decelerated" value="cubic-bezier(0, 0, 0.2, 1)" />
              </CardContent>
            </Card>
          </div>
        </Section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border bg-card">
        <div className="app-container py-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Train className="size-4" />
                </div>
                <span className="display text-xl font-semibold text-ink">
                  Mekong Line
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                Hệ thống thiết kế v2.0 — Xây dựng trên shadcn/ui & Tailwind CSS 4.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Sun className="size-4" /> Chế độ sáng
              </Button>
              <Button variant="outline" size="sm">
                <Moon className="size-4" /> Chế độ tối
              </Button>
            </div>
          </div>
          <div className="mt-8 gradient-divider" />
          <p className="mt-6 text-center text-xs text-ink-subtle">
            © 2026 Mekong Line Design System. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
