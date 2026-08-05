/**
 * Bản dịch tiếng Việt — cấu trúc i18n cho toàn bộ UI.
 * Đây là bước chuẩn bị: tách text ra 1 file trung tâm để sau này tích hợp next-intl
 * hoặc đa ngôn ngữ khác. Hiện tại chưa wire vào component, chỉ là single source of truth
 * để copy text thay vì hardcode.
 *
 * Quy ước:
 *  - Mỗi module là 1 object lồng nhau
 *  - Key dùng camelCase, không dấu
 *  - Comment giải thích ngữ cảnh dùng
 */

export const vi = {
  common: {
    brand: "Vietrail Way",
    brandTagline: "Đặt vé tàu Bắc · Trung · Nam",
    brandSublabelAdmin: "Vietrail Way · Admin",
    skipToMain: "Bỏ qua đến nội dung chính",
    loading: "Đang tải…",
    saved: "Đã lưu",
    error: "Đã xảy ra lỗi",
    retry: "Thử lại",
    cancel: "Huỷ",
    confirm: "Xác nhận",
    save: "Lưu",
    edit: "Chỉnh sửa",
    delete: "Xoá",
    close: "Đóng",
    back: "Quay lại",
    next: "Tiếp theo",
    previous: "Trước",
    search: "Tìm kiếm",
    filter: "Lọc",
    sort: "Sắp xếp",
    apply: "Áp dụng",
    clear: "Xoá bộ lọc",
    all: "Tất cả",
    none: "Không có",
  },

  nav: {
    home: "Trang chủ",
    search: "Tìm chuyến",
    tickets: "Duyệt vé tàu",
    orders: "Đơn của tôi",
    profile: "Hồ sơ",
    admin: "Quản trị",
    login: "Đăng nhập",
    register: "Tạo tài khoản",
    logout: "Đăng xuất",
  },

  home: {
    title: "Đặt vé tàu Bắc · Trung · Nam chỉ trong vài phút",
    description:
      "Vietrail Way giúp bạn tra cứu tuyến, so sánh giá và giữ chỗ trên cùng một mạch — không cần chờ, không cần gọi điện.",
    statsLabel: "Thống kê nhanh",
    journeyLabel: "Hành trình 4 bước",
    featuredLabel: "Tuyến nổi bật",
    trustLabel: "Cam kết dịch vụ",
  },

  search: {
    title: "Tìm vé theo tuyến, thời gian và nhu cầu đặt chỗ",
    description:
      "Lọc theo ga đi, ga đến và ngày khởi hành để tìm các chuyến còn chỗ, giá phù hợp và đường dẫn đặt vé.",
    filterTitle: "Bộ lọc hành trình",
    filterDescription: "Chọn tuyến, ngày và cách sắp xếp để thu hẹp danh sách.",
    fromLabel: "Ga đi",
    toLabel: "Ga đến",
    dateLabel: "Ngày đi",
    sortLabel: "Sắp xếp",
    allFrom: "Tất cả ga đi",
    allTo: "Tất cả ga đến",
    sortRecommended: "Phù hợp nhất",
    sortPrice: "Giá thấp trước",
    sortDeparture: "Khởi hành sớm",
    syncing: "Đang đồng bộ",
    fresh: "Kết quả mới",
    noResultsTitle: "Chưa có chuyến phù hợp",
    noResultsDescription: "Thử đổi ga đi, ga đến hoặc bỏ ngày khởi hành để mở rộng tồn vé.",
  },

  ticket: {
    title: "Chi tiết vé",
    tabs: {
      overview: "Hành trình",
      booking: "Đặt chỗ",
      seats: "Sơ đồ ghế",
      operations: "Vận hành",
      edit: "Chỉnh sửa",
      add: "Thêm hạng",
    },
  },

  booking: {
    passengerName: "Họ tên hành khách",
    seatLabels: "Mã ghế (tùy chọn)",
    seatLabelsHint: "Chọn ghế trên sơ đồ bên dưới hoặc nhập tay theo định dạng A1,A2.",
    quantity: "Số lượng vé",
    quantityHint: "Có thể mua nhiều vé trong cùng một đơn.",
    submit: "Giữ chỗ & thanh toán VNPay",
    submitting: "Đang chuyển sang VNPay...",
    seatMapTitle: "Sơ đồ ghế",
    needLoginTitle: "Cần đăng nhập",
    needLoginDescription:
      "Đăng nhập trước khi giữ chỗ để đơn hàng đồng bộ vào tài khoản của bạn.",
    orderCreatedTitle: "Đã tạo đơn hàng",
    orderCreatedDescription: "Đang chuyển sang cổng VNPay để hoàn tất thanh toán.",
  },

  auth: {
    loginTitle: "Đăng nhập",
    registerTitle: "Tạo tài khoản",
    forgotTitle: "Quên mật khẩu",
    resetTitle: "Đặt lại mật khẩu",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Nhập lại mật khẩu",
    fullName: "Họ và tên",
    submitLogin: "Đăng nhập",
    submitRegister: "Tạo tài khoản",
    submitForgot: "Gửi yêu cầu",
    submitReset: "Đặt lại mật khẩu",
    needAccount: "Chưa có tài khoản?",
    haveAccount: "Đã có tài khoản?",
    forgotPassword: "Quên mật khẩu?",
  },

  admin: {
    title: "Bảng điều khiển quản trị",
    tabs: {
      overview: "Tổng quan",
      tickets: "Vé mới nhất",
      orders: "Đơn & Thanh toán",
      create: "Tạo nhanh",
      users: "Người dùng",
    },
  },

  errors: {
    required: "Trường này là bắt buộc",
    invalidEmail: "Email không hợp lệ",
    minLength: "Tối thiểu {min} ký tự",
    passwordMismatch: "Mật khẩu không khớp",
    networkError: "Lỗi mạng. Vui lòng thử lại.",
    unauthorized: "Bạn cần đăng nhập để tiếp tục",
    forbidden: "Bạn không có quyền truy cập",
  },

  footer: {
    brandDescription:
      "Lên kế hoạch, giữ chỗ và theo dõi hành trình trong một trải nghiệm đặt vé thống nhất.",
    journey: "Hành trình",
    personal: "Cá nhân",
  },

  seatMap: {
    legend: {
      available: "Còn trống",
      selected: "Đang chọn",
      taken: "Đã bán",
    },
  },
} as const;

export type ViDictionary = typeof vi;
export type ViKey<T extends keyof ViDictionary = keyof ViDictionary> = keyof ViDictionary[T];

/** Helper: lookup nested key. Hiện tại chỉ là tiện ích type, sau này tích hợp next-intl. */
export function t<K extends keyof ViDictionary>(section: K): ViDictionary[K] {
  return vi[section];
}
