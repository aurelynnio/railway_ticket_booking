# Railway Ticket Booking Services

Repo gồm nhiều NestJS project độc lập. Mỗi service có `package.json`, cấu hình TypeScript/Nest và thư mục `src` riêng.

## Services

| Service | Chức năng | Port mặc định |
| --- | --- | --- |
| `api-gateway` | cổng vào hệ thống | `3000` |
| `auth-service` | đăng ký, đăng nhập | `3001` |
| `users-service` | danh sách user, profile user | `3002` |
| `search-service` | tìm chuyến tàu | `3003` |
| `tickets-service` | kiểm tra và giữ vé | `3004` |
| `orders-service` | tạo và xem order | `3005` |
| `payments-service` | tạo và xem trạng thái thanh toán | `3006` |

## Chạy một service

```bash
cd auth-service
npm install
npm run start:dev
```

Đổi port bằng biến môi trường:

```powershell
$env:PORT=4001; npm run start:dev
```

```bash
PORT=4001 npm run start:dev
```

## Build một service

```bash
cd auth-service
npm install
npm run build
```

## Ghi chú

Các service hiện là API demo, chưa có database, message broker, Docker hay cấu hình deploy.
