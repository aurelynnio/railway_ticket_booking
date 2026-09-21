# Hướng Dẫn Chi Tiết Triển Khai Backend Lên AWS EC2 (`m7i-flex.large`)

Tài liệu này hướng dẫn chi tiết từng bước để bạn tự cấu hình, cài đặt môi trường và vận hành toàn bộ hệ thống backend microservices **Railway Ticket Booking** trên máy chủ ảo **AWS EC2**.

---

## 📑 Mục Lục

1. [Giai Đoạn 1: Tạo máy chủ EC2 trên AWS Console](#1-giai-đoạn-1-tạo-máy-chủ-ec2-trên-aws-console)
2. [Giai Đoạn 2: Kết nối vào máy chủ EC2](#2-giai-đoạn-2-kết-nối-vào-máy-chủ-ec2)
3. [Giai Đoạn 3: Cài đặt Docker, Docker Compose & Tạo Swap](#3-giai-đoạn-3-cài-đặt-docker-docker-compose--tạo-swap)
4. [Giai Đoạn 4: Clone Code & Cấu hình biến môi trường (`.env.docker`)](#4-giai-đoạn-4-clone-code--cấu-hình-biến-môi-trường-envdocker)
5. [Giai Đoạn 5: Khởi chạy toàn bộ hệ thống bằng Docker Compose](#5-giai-đoạn-5-khởi-chạy-toàn-bộ-hệ-thống-bằng-docker-compose)
6. [Giai Đoạn 6: Kiểm tra hoạt động (Verification)](#6-giai-đoạn-6-kiểm-tra-hoạt-động-verification)
7. [Giai Đoạn 7: Các lệnh vận hành thường dùng](#7-giai-đoạn-7-các-lệnh-vận-hành-thường-dùng)
8. [Giai Đoạn 8: Cấu hình CI/CD Tự Động (GitHub Actions & AWS ECR)](#8-giai-đoạn-8-cấu-hình-cicd-tự-động-github-actions--aws-ecr)
9. [Xử lý lỗi thường gặp (Troubleshooting)](#9-xử-lý-lỗi-thường-gặp-troubleshooting)

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

## 4. Giai Đoạn 4: Clone Code & Cấu hình biến môi trường (`.env.docker`)

### 4.1. Clone source code backend

```bash
git clone https://github.com/aurelynnio/railway_ticket_booking.git
cd railway_ticket_booking/infra/docker
```

### 4.2. Tạo file `.env.docker`

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

### 4.3. Chỉnh sửa nội dung file `.env.docker`

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
VNPAY_PUBLIC_BASE_URL=http://<EC2_PUBLIC_IP>:8080
VNPAY_RETURN_URL=http://<EC2_PUBLIC_IP>:8080/payments/vnpay/return

# ---------- Client / CORS Configuration ----------
# Điền domain frontend Vercel của bạn hoặc để localhost:3000 khi đang dev
CLIENT_ORIGIN=http://localhost:3000
CLIENT_URL=http://localhost:3000

# ---------- Order Expiration (10 phút = 600000ms) ----------
ORDER_EXPIRATION_TTL_MS=600000

# ---------- SMTP Email (notification-service) ----------
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=no-reply@vietrail.com
```

- Nhấn `Ctrl + O` rồi nhấn `Enter` để lưu file.
- Nhấn `Ctrl + X` để thoát khỏi trình soạn thảo `nano`.

---

## 5. Giai Đoạn 5: Khởi chạy toàn bộ hệ thống bằng Docker Compose

Ngay tại thư mục `railway_ticket_booking/infra/docker`:

```bash
docker compose --env-file .env.docker -f docker-compose.yml up -d --build
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

## 7. Giai Đoạn 7: Các lệnh vận hành thường dùng

| Tác vụ                               | Lệnh thực thi (trong thư mục `infra/docker`)                                         |
| :----------------------------------- | :----------------------------------------------------------------------------------- |
| **Xem log realtime**                 | `docker compose logs -f <service-name>` _(vd: `docker compose logs -f api-gateway`)_ |
| **Khởi động lại 1 service**          | `docker compose restart <service-name>`                                              |
| **Tạm dừng toàn bộ**                 | `docker compose down`                                                                |
| **Cập nhật code mới nhất từ GitHub** | `git pull origin main`<br>`docker compose --env-file .env.docker up -d --build`      |
| **Xem mức tiêu thụ RAM / CPU**       | `docker stats`                                                                       |

---

## 8. Giai Đoạn 8: Cấu hình CI/CD Tự Động (GitHub Actions & AWS ECR)

Hệ thống đã được thiết lập pipeline tự động tại file `.github/workflows/ci.yml`. Mỗi khi bạn `git push` lên nhánh `main`, GitHub Actions sẽ tự động:
1. Chạy linter, unit tests, và build kiểm tra toàn bộ 6 microservices.
2. Kiểm tra tính hợp lệ của cấu hình Docker Compose.
3. Đăng nhập vào **AWS ECR** (`406715718964.dkr.ecr.ap-southeast-1.amazonaws.com/railway-ticket_booking`).
4. Build và đẩy Docker images của tất cả microservices lên ECR song song.
5. SSH vào máy ảo EC2, kéo Docker images mới nhất về và cập nhật các container với zero downtime.

### 8.1. Cài đặt AWS CLI trên EC2 (chỉ cần chạy 1 lần duy nhất trên EC2)

SSH vào EC2 và cài AWS CLI:
```bash
sudo apt-get update && sudo apt-get install -y awscli
```

### 8.2. Cấu hình Secrets và Variables trên GitHub

Vào repository GitHub của bạn: **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.

#### 🔒 Repository Secrets (4 bí mật)

Bấm **New repository secret** và thêm lần lượt 4 biến sau:

| Tên Secret | Giá trị cần điền |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | Access Key ID của tài khoản AWS IAM có quyền truy cập ECR (ví dụ: `AKIA...`) |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key tương ứng của IAM user trên |
| `EC2_HOST` | Địa chỉ IP Public IPv4 của máy chủ EC2 (ví dụ: `54.254.120.45` hoặc Elastic IP) |
| `EC2_SSH_PRIVATE_KEY` | Toàn bộ nội dung file khóa SSH `railway-backend-key.pem` (mở bằng Notepad, copy toàn bộ từ `-----BEGIN ...` đến `-----END ...`) |

#### 🌐 Repository Variables (3 biến cấu hình)

Chuyển sang tab **Variables** $\rightarrow$ Bấm **New repository variable** và thêm lần lượt 3 biến sau:

| Tên Variable | Giá trị cần điền | Ghi chú |
| :--- | :--- | :--- |
| `AWS_REGION` | `ap-southeast-1` | Vùng AWS Singapore bạn đang dùng ECR & EC2 |
| `EC2_USER` | `ubuntu` | Tên user đăng nhập mặc định của máy ảo Ubuntu |
| `ECR_REPOSITORY` | `railway-ticket_booking` | Tên repository ECR bạn đã tạo trên AWS |

---

## 9. Xử lý lỗi thường gặp (Troubleshooting)

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

