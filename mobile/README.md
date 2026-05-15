# Maitri PMS — Mobile App (React Native / Expo)

แอพมือถือสำหรับพนักงานโรงแรม — ทำงานร่วมกับ Maitri PMS backend (Next.js + Supabase)

## Tech Stack

- **Expo SDK 51** + **Expo Router** (file-based routing)
- **React Native 0.74**
- **TypeScript**
- **Supabase JS** (auth + realtime)
- **TanStack Query** (data fetching + caching)
- **Zustand** (global state)

## Roles ที่รองรับ

| Role | หน้าจอหลัก |
|---|---|
| front_desk | หน้าหลัก, เช็คอิน, สถานะห้อง, โปรไฟล์ |
| housekeeping | หน้าหลัก, งานของฉัน, สถานะห้อง, โปรไฟล์ |
| technician | หน้าหลัก, งานซ่อม, โปรไฟล์ |
| kitchen_staff | หน้าหลัก, Kitchen Display, โปรไฟล์ |
| bellboy / transport_driver | หน้าหลัก, งานของฉัน, โปรไฟล์ |
| security_staff / concierge | หน้าหลัก, งานของฉัน, โปรไฟล์ |

## Setup

### 1. แยก repo
```bash
cp -r mobile/ ../maitri-mobile/
cd ../maitri-mobile
git init && git add . && git commit -m "init: Maitri mobile app scaffold"
```

### 2. ติดตั้ง dependencies
```bash
npm install
# หรือ
yarn install
```

### 3. ตั้งค่า environment
```bash
cp .env.example .env
# แก้ไขค่าใน .env:
# EXPO_PUBLIC_API_URL = URL ของ Maitri backend
# EXPO_PUBLIC_SUPABASE_URL = Supabase project URL
# EXPO_PUBLIC_SUPABASE_ANON_KEY = Supabase anon key
```

### 4. รัน
```bash
npx expo start
# กด 'a' สำหรับ Android
# กด 'i' สำหรับ iOS simulator
# สแกน QR ด้วย Expo Go สำหรับ physical device
```

### 5. Build สำหรับ production (EAS Build)
```bash
npm install -g eas-cli
eas login
eas build --platform android  # APK / AAB
eas build --platform ios      # IPA
```

## โครงสร้างไฟล์

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout + auth init
│   ├── index.tsx            # Redirect (login / tabs)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx        # หน้าเข้าสู่ระบบ
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar (role-based tabs)
│       ├── index.tsx        # หน้าหลัก + stats
│       ├── tasks.tsx        # งานของฉัน (claim/complete)
│       ├── rooms.tsx        # สถานะห้อง grid
│       ├── arrivals.tsx     # เช็คอินวันนี้
│       ├── kitchen.tsx      # Kitchen KDS (Kanban)
│       └── profile.tsx      # โปรไฟล์ + sign out
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client (SecureStore)
│   │   └── api.ts           # Authenticated API fetch
│   ├── store/
│   │   └── auth.ts          # Zustand auth store
│   └── hooks/
│       └── useProfile.ts    # Load staff profile from DB
├── assets/                  # Icons, splash screen
├── app.json                 # Expo config
├── package.json
├── tsconfig.json
└── .env.example
```

## API Endpoints ที่ใช้

แอพเรียก API ของ Maitri backend โดยตรง:

| Endpoint | ใช้ใน |
|---|---|
| `GET /api/rooms?hotelId=` | สถานะห้อง |
| `GET /api/reservations?hotelId=&checkIn=&status=reserved` | เช็คอินวันนี้ |
| `GET /api/my-tasks?staffId=&hotelId=` | งานของฉัน |
| `PATCH /api/work-orders/[id]` | อัพเดทสถานะงาน |
| `GET /api/kitchen?hotelId=` | ออร์เดอร์ครัว |
| `PATCH /api/kitchen/[id]` | อัพเดทสถานะออร์เดอร์ |
| `GET /api/dashboard?hotelId=` | stats หน้าหลัก |

## ขั้นต่อไป (TODO)

- [ ] Push notifications (Expo Notifications + OneSignal)
- [ ] Offline mode (queue actions when no internet)
- [ ] Photo upload สำหรับ task evidence
- [ ] QR scanner สำหรับ room check-in
- [ ] Biometric login (Face ID / Fingerprint)
- [ ] Housekeeping photo proof workflow
- [ ] Transport/Bellboy task screens
- [ ] Security patrol checklist
- [ ] Guest messaging (reply to inbox)
