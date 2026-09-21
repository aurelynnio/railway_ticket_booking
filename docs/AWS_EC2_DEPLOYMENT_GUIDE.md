# Hướng Dẫn Chi Tiết Triển Khai Backend Lên AWS EC2 (`m7i-flex.large`)

Tài liệu này hướng dẫn chi tiết từng bước để bạn tự cấu hình, cài đặt môi trường và vận hành toàn bộ hệ thống backend microservices **Railway Ticket Booking** trên máy chủ ảo **AWS EC2**.

---

## 📑 Mục Lục

1. [Giai Đoạn 1: Tạo máy chủ EC2 trên AWS Console](#1-giai-đoạn-1-tạo-máy-chủ-ec2-trên-aws-console)
2. [Giai Đoạn 2: Kết nối vào máy chủ EC2](#2-giai-đoạn-2-kết-nối-vào-máy-chủ-ec2)
3. [Giai Đoạn 3: Cài đặt Docker, Docker Compose & Tạo Swap](#3-giai-đoạn-3-cài-đặt-docker-docker-compose--tạo-swap)
4. [Giai Đoạn 4: Thiết lập Thư Mục Triển Khai (`/srv/railway-ticket`) & Cấu hình `.env.docker`](#4-giai-đoạn-4-thiết-lập-thư-mục-triển-khai-srvrailway-ticket--cấu-hình-envdocker)
5. [Giai Đoạn 5: Khởi chạy toàn bộ hệ thống bằng Docker Compose](#5-giai-đoạn-5-khởi-chạy-toàn-bộ-hệ-thống-bằng-docker-compose)
6. [Giai Đoạn 6: Kiểm tra hoạt động (Verification)](#6-giai-đoạn-6-kiểm-tra-hoạt-động-verification)
7. [Giai Đoạn 7: Trỏ Tên Miền (Name.com) & Cấu hình Nginx Reverse Proxy với HTTPS](#7-giai-đoạn-7-trỏ-tên-miền-namecom--cấu-hình-nginx-reverse-proxy-với-https)
8. [Giai Đoạn 8: Các lệnh vận hành thường dùng](#8-giai-đoạn-8-các-lệnh-vận-hành-thường-dùng)
9. [Giai Đoạn 9: Cấu hình CI/CD Tự Động (GitHub Actions & AWS ECR)](#9-giai-đoạn-9-cấu-hình-cicd-tự-động-github-actions--aws-ecr)
10. [Xử lý lỗi thường gặp (Troubleshooting)](#10-xử-lý-lỗi-thường-gặp-troubleshooting)

---

## 1. Giai Đoạn 1: Tạo máy chủ EC2 trên AWS Console

Mở AWS Management Console $\rightarrow$ Tìm dịch vụ **EC2** $\rightarrow$ Nhấn **Launch instance**.

### 1.1. Name and tags

- **Name**: `railway-ticket-backend`

### 1.2. Application and OS Images (Amazon Machine Image - AMI)

- Chọn tab **Ubuntu**.
- **Amazon Machine Image (AMI)**: Chọn **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type**.
- **Architecture**: `64-bit (x86)`.
  > ⚠️ **Lưu ý**: Tuyệt đối **không** chọn gói _Ubuntu Pro_ để tránh phát sinh chi phí bản quyền ngoài ý muốn.

### 1.3. Instance type

- Chọn đúng loại: **`m7i-flex.large`** (2 vCPU, 8 GiB Memory).
- Kiểm tra có huy hiệu **Free tier eligible** hiển thị ở góc phải.

### 1.4. Key pair (login)

- Nhấn **Create new key pair**.
- **Key pair name**: `railway-backend-key`
- **Key pair type**: `RSA`
- **Private key file format**: `.pem` (dành cho OpenSSH / PowerShell / macOS / Linux).
- Bấm **Create key pair** $\rightarrow$ Trình duyệt tự động tải file `railway-backend-key.pem` về máy tính của bạn. Hãy lưu file này vào thư mục an toàn (ví dụ: `C:\Users\<username>\.ssh\`).

### 1.5. Network settings (Cấu hình Security Group / Tường lửa)

Chọn **Create security group** và đặt tên `railway-backend-sg`. Thiết lập các luật Inbound (Inbound rules):

| Type           | Protocol | Port Range | Source                       | Mục đích                     |
| :------------- | :------- | :--------- | :--------------------------- | :--------------------------- |
| **SSH**        | TCP      | `22`       | **My IP** (hoặc `0.0.0.0/0`) | Đăng nhập điều khiển máy chủ |
| **HTTP**       | TCP      | `80`       | `0.0.0.0/0` (Anywhere)       | Web Nginx Reverse Proxy      |
| **HTTPS**      | TCP      | `443`      | `0.0.0.0/0` (Anywhere)       | Web bảo mật SSL/TLS          |
| **Custom TCP** | TCP      | `8080`     | `0.0.0.0/0` (Anywhere)       | API Gateway trực tiếp        |

_(Tùy chọn: Nếu muốn mở trang quản lý RabbitMQ Management, thêm Port `15672` với Source là **My IP**)._

### 1.6. Configure storage (Ổ cứng EBS)

- Đổi dung lượng mặc định thành **`30 GiB`** (Gói AWS Free Tier miễn phí tối đa 30 GiB dung lượng EBS).
- **Volume type**: **`gp3`** (General Purpose SSD thế hệ 3, tốc độ cao nhất và tối ưu chi phí).

### 1.7. Hoàn tất tạo máy

- Kiểm tra lại bảng **Summary** ở cột bên phải.
- Bấm nút màu cam **Launch instance**.
- Chờ khoảng 1–2 phút cho đến khi cột **Instance state** báo `Running` và **Status check** báo `2/2 checks passed`.

---

## 2. Giai Đoạn 2: Kết nối vào máy chủ EC2

### Cách 1: Sử dụng EC2 Instance Connect (Trực tiếp trên web, nhanh nhất)

1. Trong danh sách EC2 Instances, tích chọn máy `railway-ticket-backend`.
2. Bấm nút **Connect** ở thanh công cụ trên cùng.
3. Chọn tab **EC2 Instance Connect**.
4. Giữ nguyên User name là `ubuntu`, bấm nút **Connect**.
5. Một cửa sổ terminal nền đen sẽ mở ra ngay trên trình duyệt.

### Cách 2: Sử dụng SSH từ máy tính cá nhân (PowerShell / Command Prompt)

1. Mở PowerShell trên máy tính của bạn, di chuyển đến thư mục chứa file `.pem`:
   ```powershell
   cd C:\Users\cyhin\Downloads
   ```
2. Phân quyền cho file key (trên Windows/Linux):

   ```powershell
   # Nếu dùng Linux/macOS:
   chmod 400 railway-backend-key.pem

   # Kết nối SSH (thay <EC2_PUBLIC_IP> bằng IP Public của máy bạn):
   ssh -i railway-backend-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```

---

## 3. Giai Đoạn 3: Cài đặt Docker, Docker Compose & Tạo Swap

Ngay trong cửa sổ terminal của Ubuntu EC2, thực hiện tuần tự các bước sau:

### 3.1. Cập nhật hệ thống & Cài Docker Engine chính thức

Copy toàn bộ đoạn mã sau và dán vào terminal:

```bash
# 1. Cập nhật danh sách gói
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git

# 2. Thêm GPG key của Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Khai báo apt repository cho Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Cài đặt Docker CE và Docker Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Cấp quyền chạy Docker không cần sudo cho user ubuntu
sudo usermod -aG docker ubuntu
newgrp docker
```

Kiểm tra Docker đã nhận chưa:

```bash
docker --version
docker compose version
```

### 3.2. Cấu hình 4GB Swap RAM (Chống tràn RAM bảo vệ máy)

Dù máy có 8GB RAM, tạo thêm 4GB Swap trên ổ cứng SSD gp3 sẽ giúp hệ thống không bao giờ bị đứng máy khi có tải tăng đột biến:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

_(Lệnh `free -h` hiện dòng Swap `4.0Gi` là thành công)._

---

## 4. Giai Đoạn 4: Thiết lập Thư Mục Triển Khai (`/srv/railway-ticket`) & Cấu hình `.env.docker`

> 💡 **Bảo mật & Tối ưu chuẩn Production**:  
> Bạn **KHÔNG CẦN clone toàn bộ mã nguồn (.ts, test, node_modules)** về EC2! Mã nguồn đã được GitHub Actions tự động build thành các Docker image tối ưu và đẩy lên **AWS ECR**. Máy chủ EC2 chỉ đóng vai trò là môi trường chạy (Runtime Host), giúp bảo mật mã nguồn tối đa và tiết kiệm RAM/CPU không phải tốn tài nguyên build trên máy chủ.

### 4.1. Tạo thư mục vận hành `/srv/railway-ticket`

```bash
sudo mkdir -p /srv/railway-ticket
sudo chown -R ubuntu:ubuntu /srv/railway-ticket
cd /srv/railway-ticket
```

### 4.2. Lấy các file cấu hình hạ tầng Docker Compose

Chúng ta chỉ cần lấy đúng các file cấu hình hạ tầng (`docker-compose.yml`, `init-databases.sql`, thư mục `redis/`) mà không cần lưu giữ mã nguồn:

```bash
# Tải nhanh các file cấu hình hạ tầng vào /srv/railway-ticket
git clone --depth 1 https://github.com/aurelynnio/railway_ticket_booking.git /tmp/repo
cp -r /tmp/repo/infra/docker/* /srv/railway-ticket/
rm -rf /tmp/repo
```

Sau bước này, trong thư mục `/srv/railway-ticket/` chỉ có đúng các file cấu hình Docker, hoàn toàn không chứa bất kỳ file code backend nào.

### 4.3. Tạo file biến môi trường `.env.docker`

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

### 4.4. Chỉnh sửa nội dung file `.env.docker`

Sử dụng các phím mũi tên để di chuyển, điền các giá trị an toàn:

```env
# ---------- PostgreSQL ----------
POSTGRES_USER=app
POSTGRES_PASSWORD=MatKhauDatabaseBaoMat2026!
POSTGRES_DB=railway_ticket_booking

# ---------- Redis ----------
REDIS_PASSWORD=MatKhauRedisBaoMat2026!

# ---------- RabbitMQ ----------
RABBITMQ_DEFAULT_USER=railway
RABBITMQ_DEFAULT_PASS=MatKhauRabbitMq2026!

# ---------- JWT Secret (Chuỗi ngẫu nhiên > 32 ký tự) ----------
JWT_SECRET=c2e8a1f490bd4830a1e0b5718dfb9302e6a17bfae804f32901a8c4029471b021

# ---------- VNPay Configuration ----------
VNPAY_TMN_CODE=
VNPAY_SECURE_SECRET=
VNPAY_HOST=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TEST_MODE=true
VNPAY_PUBLIC_BASE_URL=https://api.vetautet.app
VNPAY_RETURN_URL=https://api.vetautet.app/payments/vnpay/return

# ---------- Client / CORS Configuration ----------
CLIENT_ORIGIN=https://vetautet.app
CLIENT_URL=https://vetautet.app

# ---------- Order Expiration (10 phút = 600000ms) ----------
ORDER_EXPIRATION_TTL_MS=600000

# ---------- SMTP Email (notification-service) ----------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=no-reply@vietrail.com

# ---------- AWS ECR ----------
ECR_REGISTRY=406715718964.dkr.ecr.ap-southeast-1.amazonaws.com/
ECR_REPOSITORY=railway-ticket_booking
```

- Nhấn `Ctrl + O` rồi nhấn `Enter` để lưu file.
- Nhấn `Ctrl + X` để thoát khỏi trình soạn thảo `nano`.

---

## 5. Giai Đoạn 5: Khởi chạy toàn bộ hệ thống bằng Docker Compose

Ngay tại thư mục `/srv/railway-ticket`:

### 5.1. Đăng nhập vào AWS ECR để kéo Docker images

```bash
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 406715718964.dkr.ecr.ap-southeast-1.amazonaws.com
```

### 5.2. Kéo images và khởi động hệ thống

```bash
# Kéo toàn bộ Docker images mới nhất từ AWS ECR (không tốn tài nguyên build trên EC2)
docker compose pull

# Khởi chạy toàn bộ hệ thống
docker compose up -d
```

### 🔄 Quá trình tự động diễn ra:

1. Docker tải và khởi chạy PostgreSQL 16, Redis Sentinel cluster (1 master, 2 replicas, 3 sentinels), và RabbitMQ 4.1.
2. Container `railway-ticket-db-migrate` tự động chạy để tạo toàn bộ bảng trong 5 database (`railway_auth`, `railway_users`, `railway_orders`, `railway_payments`, `railway_notifications`, `railway_tickets`) rồi hoàn tất (`Exited 0`).
3. Toàn bộ 6 microservices backend khởi động song song:
   - `railway-ticket-auth-service`
   - `railway-ticket-tickets-service`
   - `railway-ticket-orders-service`
   - `railway-ticket-payments-service`
   - `railway-ticket-notification-service`
   - `railway-ticket-api-gateway` (lắng nghe cổng `8080`)

---

## 6. Giai Đoạn 6: Kiểm tra hoạt động (Verification)

### 6.1. Kiểm tra trạng thái các container trên EC2

```bash
docker compose ps
```

Kết quả hiển thị trạng thái `Up` hoặc `healthy` cho tất cả các service chính:

```text
NAME                               IMAGE                              STATUS
railway-ticket-api-gateway         ...                                Up (healthy)
railway-ticket-auth-service        ...                                Up
railway-ticket-db-migrate          ...                                Exited (0)
railway-ticket-notification-service...                                Up
railway-ticket-orders-service      ...                                Up
railway-ticket-payments-service    ...                                Up
railway-ticket-postgres            postgres:16-alpine                 Up (healthy)
railway-ticket-rabbitmq            rabbitmq:4.1-management-alpine    Up (healthy)
railway-ticket-redis-master        redis:7.4-alpine                   Up (healthy)
railway-ticket-tickets-service     ...                                Up
```

### 6.2. Kiểm tra log của API Gateway

```bash
docker compose logs -f api-gateway
```

_(Thấy log báo `Nest application successfully started` là chuẩn)._

### 6.3. Kiểm tra từ trình duyệt máy tính của bạn

Lấy **Public IPv4 Address** của EC2 (ví dụ: `54.254.120.45`):

- Mở trình duyệt truy cập:
  ```text
  http://<EC2_PUBLIC_IP>:8080/auth/health
  ```
- Kết quả trả về JSON:
  ```json
  {
    "service": "api-gateway",
    "status": "ok",
    "timestamp": "2026-09-22T00:15:00.000Z"
  }
  ```
- Truy cập tài liệu Swagger API:
  ```text
  http://<EC2_PUBLIC_IP>:8080/api/docs
  ```

---

## 7. Giai Đoạn 7: Trỏ Tên Miền (Name.com) & Cấu hình Nginx Reverse Proxy với HTTPS

Để hệ thống hoạt động chuyên nghiệp trên môi trường production, bạn cần:

1. Gắn tên miền thật **`vetautet.app`** (quản lý tại **Name.com**).
2. Dùng **Nginx** làm Reverse Proxy để tiếp nhận traffic ở cổng `80` (HTTP) và `443` (HTTPS).
3. Sử dụng **Certbot (Let's Encrypt)** để cấp chứng chỉ SSL miễn phí (ổ khóa xanh bảo mật).
4. Định tuyến lưu lượng thông minh:
   - `https://api.vetautet.app` $\rightarrow$ Chuyển tiếp vào Backend NestJS API Gateway (`127.0.0.1:8080`).
   - `https://vetautet.app` $\rightarrow$ Chuyển tiếp vào Frontend Web Client (nếu host trên EC2 hoặc trỏ DNS sang Vercel).

---

### 7.1. Bước 1: Trỏ DNS tên miền trên Name.com về EC2

1. Truy cập trang quản trị [Name.com](https://www.name.com/) và đăng nhập tài khoản của bạn.
2. Vào mục **My Domains** $\rightarrow$ Click vào tên miền **`vetautet.app`**.
3. Chọn mục **Manage DNS Records** (hoặc **DNS Records**).
4. Thêm các bản ghi DNS sau (thay `<EC2_PUBLIC_IP>` bằng IP Public của máy ảo EC2 của bạn):

| Type (Loại) | Host (Tên máy chủ) | Answer / Target (Địa chỉ đích) | TTL   | Giải thích                                                             |
| :---------- | :----------------- | :----------------------------- | :---- | :--------------------------------------------------------------------- |
| **A**       | `api`              | `<EC2_PUBLIC_IP>`              | `300` | Trỏ subdomain `api.vetautet.app` về EC2 để phục vụ Backend API Gateway |
| **A**       | `@`                | `<EC2_PUBLIC_IP>`              | `300` | Trỏ root domain `vetautet.app` về EC2 (nếu host cả Frontend trên EC2)  |
| **CNAME**   | `www`              | `vetautet.app`                 | `300` | Chuyển hướng `www.vetautet.app` về root domain                         |

> 💡 **Mẹo**: Nếu Frontend Next.js của bạn deploy trên **Vercel**, thì bản ghi `@` và `www` bạn trỏ về IP của Vercel (`76.76.21.21`), còn bản ghi `api` vẫn trỏ về `<EC2_PUBLIC_IP>` của AWS EC2.

Sau khi lưu bản ghi, chờ khoảng 1–5 phút để DNS lan truyền. Bạn có thể kiểm tra trên terminal máy tính:

```powershell
ping api.vetautet.app
```

_(Nếu hiển thị đúng địa chỉ `<EC2_PUBLIC_IP>` là DNS đã trỏ thành công)._

---

### 7.2. Bước 2: Cài đặt Nginx & Certbot trên máy chủ EC2

SSH vào máy ảo EC2 của bạn:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Kiểm tra Nginx đã khởi động thành công:

```bash
sudo systemctl status nginx
```

---

### 7.3. Bước 3: Tạo file cấu hình Nginx Reverse Proxy

Tạo một file cấu hình Nginx dành riêng cho tên miền `vetautet.app`:

```bash
sudo nano /etc/nginx/sites-available/vetautet.app
```

Dán toàn bộ nội dung cấu hình chuẩn production dưới đây vào file:

```nginx
# =============================================================================
# Cấu hình Nginx Reverse Proxy cho hệ thống Railway Ticket Booking (vetautet.app)
# =============================================================================

# 1. Rate Limiting chống spam và tấn công brute-force
limit_req_zone $binary_remote_addr zone=api_general_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_strict_limit:10m rate=5r/s;

# 2. Hỗ trợ WebSocket / Server-Sent Events (SSE)
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# -----------------------------------------------------------------------------
# SUBDOMAIN: api.vetautet.app (Dành riêng cho Backend API Gateway)
# -----------------------------------------------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name api.vetautet.app;

    # Ẩn phiên bản Nginx để tăng cường bảo mật
    server_tokens off;

    # Kích thước tối đa cho payload request (upload file, avatar)
    client_max_body_size 10m;

    # Security Headers bảo mật
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip nén dữ liệu phản hồi giúp tối ưu tốc độ
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json text/javascript application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Endpoint riêng cho VNPay IPN & Return Callback (Không áp dụng rate limit)
    location /payments/vnpay/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 60s;
    }

    # Giới hạn rate limit nghiêm ngặt cho các API nhạy cảm (Login, Register, Reset Pass)
    location ~ ^/auth/(login|register|forgot-password|reset-password|verify-email) {
        limit_req zone=auth_strict_limit burst=10 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_read_timeout 60s;
    }

    # Tất cả các API còn lại chuyển tiếp vào API Gateway Docker container
    location / {
        limit_req zone=api_general_limit burst=50 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # Chuyển tiếp Header người dùng thật
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# -----------------------------------------------------------------------------
# ROOT DOMAIN: vetautet.app & www.vetautet.app (Nếu bạn chạy Frontend trên EC2)
# (Nếu bạn dùng Vercel cho Frontend thì có thể bỏ qua block server này)
# -----------------------------------------------------------------------------
server {
    listen 80;
    listen [::]:80;
    server_name vetautet.app www.vetautet.app;

    server_tokens off;
    client_max_body_size 10m;

    location / {
        # Giả sử container Next.js client chạy ở cổng 3000
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

- Bấm `Ctrl + O` rồi nhấn `Enter` để lưu file.
- Bấm `Ctrl + X` để thoát khỏi trình soạn thảo `nano`.

---

### 7.4. Bước 4: Kích hoạt cấu hình và kiểm tra Nginx

Chạy các lệnh sau trên EC2:

```bash
# 1. Kích hoạt website bằng cách tạo symlink sang thư mục sites-enabled
sudo ln -sf /etc/nginx/sites-available/vetautet.app /etc/nginx/sites-enabled/

# 2. Xóa cấu hình mặc định (default) của nginx để tránh xung đột
sudo rm -f /etc/nginx/sites-enabled/default

# 3. Kiểm tra cú pháp xem có lỗi gì không
sudo nginx -t
```

Nếu màn hình báo:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Thì bạn chạy lệnh reload lại Nginx:

```bash
sudo systemctl reload nginx
```

---

### 7.5. Bước 5: Cấp chứng chỉ SSL/TLS miễn phí với Certbot (Let's Encrypt)

Chạy lệnh tự động kích hoạt HTTPS:

```bash
sudo certbot --nginx -d api.vetautet.app -d vetautet.app -d www.vetautet.app
```

_(Nếu bạn chỉ muốn cấp SSL cho subdomain API trước, chỉ cần chạy: `sudo certbot --nginx -d api.vetautet.app`)_.

**Quá trình tương tác:**

1. **Enter email address**: Nhập email của bạn (dùng để nhận cảnh báo gia hạn).
2. **Terms of Service**: Nhấn `Y` để đồng ý điều khoản.
3. **Share email with EFF**: Nhấn `N` hoặc `Y` tùy bạn.
4. **Certbot sẽ tự động**:
   - Xác minh quyền sở hữu tên miền qua DNS Name.com.
   - Tạo khóa mã hóa RSA 2048-bit.
   - Tự động chỉnh sửa file `/etc/nginx/sites-available/vetautet.app`, cấu hình cổng `443 SSL`, certificate path và tự động redirect toàn bộ lượt truy cập HTTP `port 80` sang HTTPS `port 443`!

Kiểm tra cơ chế tự động gia hạn chứng chỉ (Certbot tự gia hạn mỗi 90 ngày):

```bash
sudo certbot renew --dry-run
```

_(Thấy báo `Congratulations, all simulated renewals succeeded` là hoàn tất 100%)._

---

### 7.6. Bước 6: Cập nhật biến môi trường `.env.docker` theo domain mới

Bây giờ bạn đã có domain HTTPS bảo mật, hãy cập nhật lại các URL trong file cấu hình `.env.docker`:

```bash
cd ~/railway_ticket_booking/infra/docker
nano .env.docker
```

Cập nhật các dòng sau:

```bash
# Frontend cho phép CORS và Email verification link
CLIENT_ORIGIN=https://vetautet.app
CLIENT_URL=https://vetautet.app

# VNPay IPN & Return URL dùng domain HTTPS chính thức
VNPAY_PUBLIC_BASE_URL=https://api.vetautet.app
VNPAY_RETURN_URL=https://api.vetautet.app/payments/vnpay/return
```

Lưu file (`Ctrl + O`, `Enter`, `Ctrl + X`) và restart lại các container để áp dụng cấu hình:

```bash
docker compose up -d
```

---

### 7.7. Bước 7: Tăng cường bảo mật — Đóng cổng 8080 trên AWS Security Group

Vì mọi request từ bên ngoài bây giờ đã đi an toàn qua Nginx trên cổng **`80`** và **`443`**, bạn không cần mở cổng `8080` ra toàn cầu nữa:

1. Vào AWS Console $\rightarrow$ **EC2** $\rightarrow$ **Instances** $\rightarrow$ Chọn máy của bạn.
2. Chọn tab **Security** $\rightarrow$ Bấm vào tên Security Group (`railway-backend-sg`).
3. Chọn **Edit inbound rules** $\rightarrow$ Xóa dòng có Port **`8080`** $\rightarrow$ Bấm **Save rules**.
   _(Giờ đây, cổng 8080 chỉ có Nginx nội bộ truy cập được, hacker không thể quét trực tiếp vào backend NestJS của bạn)._

---

### 7.8. Bước 8: Kiểm tra thành quả trên trình duyệt

Mở trình duyệt trên máy tính của bạn và kiểm tra:

1. `https://api.vetautet.app/auth/health` $\rightarrow$ Trả về JSON `{ "service": "api-gateway", "status": "ok" }` với biểu tượng **ổ khóa an toàn (HTTPS)**.
2. `https://api.vetautet.app/api/docs` $\rightarrow$ Mở giao diện Swagger API Documentation trực tiếp qua HTTPS tên miền của bạn!

---

## 8. Giai Đoạn 8: Các lệnh vận hành thường dùng

| Tác vụ                              | Lệnh thực thi (trong thư mục `/srv/railway-ticket`)                                  |
| :---------------------------------- | :----------------------------------------------------------------------------------- |
| **Xem log realtime**                | `docker compose logs -f <service-name>` _(vd: `docker compose logs -f api-gateway`)_ |
| **Khởi động lại 1 service**         | `docker compose restart <service-name>`                                              |
| **Tạm dừng toàn bộ hệ thống**       | `docker compose down`                                                                |
| **Kéo và cập nhật images mới nhất** | `docker compose pull && docker compose up -d`                                        |
| **Xem mức tiêu thụ RAM / CPU**      | `docker stats`                                                                       |
| **Kiểm tra trạng thái Nginx**       | `sudo systemctl status nginx`                                                        |
| **Xem log truy cập Nginx**          | `sudo tail -f /var/log/nginx/access.log`                                             |
| **Xem log lỗi Nginx**               | `sudo tail -f /var/log/nginx/error.log`                                              |

---

## 9. Giai Đoạn 9: Cấu hình CI/CD Tự Động (GitHub Actions & AWS ECR)

Hệ thống đã được thiết lập pipeline tự động tại file `.github/workflows/ci.yml`. Mỗi khi bạn `git push` lên nhánh `main`, GitHub Actions sẽ tự động:

1. Chạy linter, unit tests, và build kiểm tra toàn bộ 6 microservices.
2. Kiểm tra tính hợp lệ của cấu hình Docker Compose.
3. Đăng nhập vào **AWS ECR** (`406715718964.dkr.ecr.ap-southeast-1.amazonaws.com/railway-ticket_booking`).
4. Build và đẩy Docker images của tất cả microservices lên ECR song song.
5. SSH vào máy ảo EC2, kéo Docker images mới nhất về và cập nhật các container với zero downtime.

### 9.1. Cài đặt AWS CLI trên EC2 (chỉ cần chạy 1 lần duy nhất trên EC2)

SSH vào EC2 và cài AWS CLI:

```bash
sudo apt-get update && sudo apt-get install -y awscli
```

### 9.2. Cấu hình Secrets và Variables trên GitHub

Vào repository GitHub của bạn: **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.

#### 🔒 Repository Secrets (4 bí mật)

Bấm **New repository secret** và thêm lần lượt 4 biến sau:

| Tên Secret              | Giá trị cần điền                                                                                                                |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| `AWS_ACCESS_KEY_ID`     | Access Key ID của tài khoản AWS IAM có quyền truy cập ECR (ví dụ: `AKIA...`)                                                    |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key tương ứng của IAM user trên                                                                                   |
| `EC2_HOST`              | Địa chỉ IP Public IPv4 của máy chủ EC2 (ví dụ: `54.254.120.45` hoặc Elastic IP)                                                 |
| `EC2_SSH_PRIVATE_KEY`   | Toàn bộ nội dung file khóa SSH `railway-backend-key.pem` (mở bằng Notepad, copy toàn bộ từ `-----BEGIN ...` đến `-----END ...`) |

#### 🌐 Repository Variables (3 biến cấu hình)

Chuyển sang tab **Variables** $\rightarrow$ Bấm **New repository variable** và thêm lần lượt 3 biến sau:

| Tên Variable     | Giá trị cần điền         | Ghi chú                                       |
| :--------------- | :----------------------- | :-------------------------------------------- |
| `AWS_REGION`     | `ap-southeast-1`         | Vùng AWS Singapore bạn đang dùng ECR & EC2    |
| `EC2_USER`       | `ubuntu`                 | Tên user đăng nhập mặc định của máy ảo Ubuntu |
| `ECR_REPOSITORY` | `railway-ticket_booking` | Tên repository ECR bạn đã tạo trên AWS        |

---

## 10. Xử lý lỗi thường gặp (Troubleshooting)

### Lỗi 1: Không mở được `http://<EC2_PUBLIC_IP>:8080` từ trình duyệt

- **Nguyên nhân**: Security Group của AWS chưa mở cổng `8080`.
- **Cách khắc phục**: Vào AWS Console $\rightarrow$ EC2 $\rightarrow$ Instances $\rightarrow$ Chọn máy của bạn $\rightarrow$ Tab **Security** $\rightarrow$ Bấm vào tên **Security Group** $\rightarrow$ Chọn **Edit inbound rules** $\rightarrow$ Thêm rule: **Custom TCP**, Port **`8080`**, Source **`0.0.0.0/0`** $\rightarrow$ Bấm **Save rules**.

### Lỗi 2: Tràn dung lượng ổ cứng sau một thời gian dài sử dụng

- Docker lưu trữ cache build và log container cũ.
- **Cách dọn dẹp**:
  ```bash
  docker system prune -a --volumes -f
  ```

### Lỗi 3: Địa chỉ IP của EC2 bị thay đổi sau khi Reboot/Stop máy

- Mặc định, mỗi khi bạn `Stop` và `Start` lại máy ảo EC2, AWS sẽ cấp một IP Public mới.
- **Cách khắc phục**:
  1. Vào menu bên trái AWS Console: **Network & Security** $\rightarrow$ **Elastic IPs**.
  2. Bấm **Allocate Elastic IP address** $\rightarrow$ Bấm **Allocate**.
  3. Chọn IP vừa tạo $\rightarrow$ Bấm **Actions** $\rightarrow$ **Associate Elastic IP address**.
  4. Chọn Instance máy ảo của bạn $\rightarrow$ Bấm **Associate**.
     _(Địa chỉ IP này sẽ trở thành IP tĩnh vĩnh viễn, không bao giờ thay đổi)._
