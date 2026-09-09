# Kiến trúc & Luồng thanh toán — Diagrams (Mermaid)

> Xem trực tiếp trên GitHub, VS Code (extension *Markdown Preview Mermaid Support*), hoặc dán vào [mermaid.live](https://mermaid.live).

---

## 1. Kiến trúc tổng thể hệ thống

```mermaid
flowchart LR
    subgraph Edge["-edge-"]
        NGINX["Nginx Reverse Proxy<br/:80 — gzip, security headers,<br/>rate limit 2 tầng"]
    end

    subgraph Client["-client-"]
        NEXT["Next.js 16 App Router<br/>TanStack Query + axios<br/>refresh dedupe"]
    end

    subgraph Gateway["-api-gateway (NestJS)-"]
        GW["Guard Chain toàn cục<br/>Throttler → JwtAuth → Roles<br/>@Public() / @Roles(ADMIN)"]
    end

    subgraph Services["-microservices (NestJS + RMQ)-"]
        AUTH["auth-service<br/>PostgreSQL"]
        ORDERS["orders-service<br/>PostgreSQL<br/>+ idempotency key"]
        PAYMENTS["payments-service<br/>PostgreSQL<br/>+ PaymentOutbox"]
        TICKETS["tickets-service<br/>MongoDB replica set<br/>+ Redis Redlock"]
        NOTIF["notification-service<br/>PostgreSQL + SMTP"]
    end

    subgraph Infra["-hạ tầng-"]
        RMQ[("RabbitMQ<br/>durable queues + DLQ")]
        PG[("PostgreSQL<br/>db-per-service")]
        MONGO[("MongoDB rs0<br/>$transaction")]
        REDIS[("Redis Sentinel<br/>1M + 2R + 3S")]
    end

    NEXT --> NGINX --> GW
    GW <--> RMQ
    RMQ <--> AUTH
    RMQ <--> ORDERS
    RMQ <--> PAYMENTS
    RMQ <--> TICKETS
    RMQ <--> NOTIF
    AUTH --> PG
    ORDERS --> PG
    PAYMENTS --> PG
    NOTIF --> PG
    TICKETS --> MONGO
    TICKETS --> REDIS

    style NGINX fill:#06A1A0,color:#fff
    style GW fill:#17324D,color:#fff
    style RMQ fill:#e8f7f7,stroke:#06A1A0
    style REDIS fill:#fff4e6,stroke:#e8890c
    style MONGO fill:#eef7e8,stroke:#4caf50
    style PG fill:#eef2f7,stroke:#3567b3
```

---

## 2. Giai đoạn 1 — Checkout & giữ ghế (Redlock + Idempotency + Delayed Queue)

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant C as Next.js client
    participant G as api-gateway
    participant O as orders-service
    participant T as tickets-service
    participant M as Mongo (replica set)
    participant R as Redis (Redlock)
    participant Q as orders_expiration_queue<br/>(TTL 10 phút)

    U->>C: Bấm "Thanh toán"
    C->>G: POST /orders/checkout<br/>(idempotencyKey)
    G->>G: Throttler → JwtAuth → Roles
    G->>O: orders.checkout (RMQ)

    O->>O: Check idempotencyKey<br/>(trùng → replay order cũ)

    rect rgb(232, 247, 247)
        note over O,R: 🔒 Redlock — chống double-booking
        O->>R: redlock.using() acquire lock
        R-->>O: lock granted (+ fencing token)
        O->>T: hold seats
        T->>M: $transaction<br/>trừ availableSeatLabels
        M-->>T: ok
        T-->>O: seats held
        O->>R: release lock (auto-extend khi chậm)
    end

    O->>O: CREATE order (PENDING_PAYMENT)<br/>unique(idempotency_key)
    O->>O: CREATE payment (PENDING, VNPAY)
    O->>Q: emit 'orders.expire_check'<br/>⏳ message nằm chờ TTL 10 phút
    O-->>G: { order, payment, reservation }
    G-->>C: 200 OK
    C->>U: Redirect sang VNPay
```

---

## 3. Giai đoạn 2 — Thanh toán thành công (IPN + Transactional Outbox + Saga)

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant V as VNPay Server
    participant G as api-gateway
    participant P as payments-service
    participant DB as PostgreSQL
    participant Q as RabbitMQ
    participant O as orders-service
    participant N as notification-service

    U->>V: Thanh toán trên cổng VNPay

    rect rgb(238, 242, 247)
        note over V,P: IPN — nguồn truth (server-to-server)
        V->>G: GET /payments/vnpay/ipn?vnp_SecureHash=...
        G->>P: verify IPN
        P->>P: ✓ checksum ✓ amount match<br/>✓ idempotent (đã Paid → trả 00)
        P->>V: RspCode '00' (Confirm success)
    end

    rect rgb(232, 247, 247)
        note over P,DB: 📤 Transactional Outbox — cùng 1 DB transaction
        P->>DB: BEGIN
        P->>DB: UPDATE payments<br/>SET status = Paid
        P->>DB: INSERT payment_outbox<br/>(status = 0 pending)
        P->>DB: COMMIT
        note over P,DB: Crash giữa chừng?<br/>Event vẫn nằm trong outbox — không mất
    end

    rect rgb(255, 244, 230)
        note over P,Q: ⏰ Outbox worker — @Cron mỗi 10 giây
        P->>DB: SELECT outbox due<br/>(status=0, nextAttemptAt <= now)
        P->>Q: emit 'payment.paid'
        P->>DB: UPDATE outbox SET status = 1
        note over P,Q: Thất bại → retry exponential backoff<br/>(1s, 2s, 4s... max 60s, max attempts)
    end

    rect rgb(238, 247, 232)
        note over O,N: 🔄 Saga Choreography — orders tự phản ứng với event
        Q->>O: 'payment.paid'
        O->>O: markPaid<br/>PENDING_PAYMENT → PAID
        O->>O: confirm<br/>PAID → CONFIRMED
        O->>O: issueTicket<br/>CONFIRMED → TICKET_ISSUED
        O->>Q: emit 'notification.payment_paid'
        Q->>N: gửi email xác nhận
    end

    V-->>U: Redirect Return URL<br/>(chỉ hiển thị — KHÔNG cập nhật DB)
```

---

## 4. Giai đoạn 3 — Compensation: hết hạn / thanh toán thất bại

```mermaid
sequenceDiagram
    autonumber
    participant TTL as orders_expiration_queue<br/>(TTL 10 phút)
    participant DL as orders_expired_process_queue
    participant O as orders-service
    participant P as payments-service
    participant T as tickets-service
    participant M as Mongo

    note over TTL,DL: ⏰ Delayed Queue = "bộ đếm ngược" không cần cron server<br/>RabbitMQ tự dead-letter message khi hết TTL

    TTL->>DL: hết 10 phút → dead-letter
    DL->>O: 'orders.expire_check'
    O->>O: Đọc order status

    alt Order đã PAID / ISSUE
        O->>O: Bỏ qua — saga đã hoàn tất
    else Order còn PENDING_PAYMENT
        O->>O: markExpired<br/>PENDING_PAYMENT → EXPIRED
        O->>P: markPaymentExpired<br/>payment → Expired
        O->>T: release seats (compensation)
        T->>M: $transaction<br/>hoàn availableSeatLabels
        note over T,M: Ghế quay về kho — người khác đặt được
    end
```

---

## 5. Tổng quan 3 nhánh số phận của một Order (state machine)

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: checkout<br/>(ghế đã hold)

    PENDING_PAYMENT --> PAID: IPN 'payment.paid'<br/>(outbox → saga)
    PENDING_PAYMENT --> EXPIRED: TTL 10 phút hết hạn<br/>(compensation + hoàn ghế)

    PAID --> CONFIRMED: confirm
    CONFIRMED --> TICKET_ISSUED: issueTicket + email

    EXPIRED --> [*]
    TICKET_ISSUED --> [*]

    note right of PENDING_PAYMENT
        Idempotency key chống
        double-click tạo order trùng
    end note

    note right of EXPIRED
        Compensation thay cho
        rollback 2PC: hoàn ghế
        về tickets-service
    end note
```

---

## 6. Ma trận Queue RabbitMQ

```mermaid
flowchart TB
    subgraph Producers
        GW[api-gateway]
        O[orders-service]
        P[payments-service]
        A[auth-service]
    end

    Q1[orders_queue]:::q
    Q2[orders_expiration_queue<br/>x-message-ttl: 600000]:::ttl
    Q3[orders_expired_process_queue]:::q
    Q4[payments_queue]:::q
    Q5[tickets_queue]:::q
    Q6[notifications_queue]:::q
    Q7[auth_queue]:::q
    DLQ[railway_dead_letter_queue<br/>⚠ chưa có consumer/alert]:::warn

    GW --> Q1 & Q4 & Q5 & Q6 & Q7
    O --> Q2 & Q4 & Q5 & Q6 & Q7
    P --> Q1
    A --> Q6

    Q1 & Q3 & Q4 & Q5 & Q6 & Q7 -.->|handler throw| DLQ
    Q2 -->|hết TTL| Q3

    classDef q fill:#e8f7f7,stroke:#06A1A0
    classDef ttl fill:#fff4e6,stroke:#e8890c
    classDef warn fill:#fdecea,stroke:#d93025
```
