// Thai-language error message mapping for API & Supabase error codes.
// Usage: import { thError } from '@/lib/th-errors'; toast.error(thError(error));

const CODE_MAP: Record<string, string> = {
  // Auth
  'invalid_credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'email_not_confirmed': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
  'user_already_exists': 'อีเมลนี้มีบัญชีอยู่แล้ว',
  'weak_password': 'รหัสผ่านอ่อนแอเกินไป กรุณาใช้อย่างน้อย 8 ตัวอักษร',
  'over_email_send_rate_limit': 'ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่',
  'session_not_found': 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  // Postgres
  '23505': 'ข้อมูลนี้มีอยู่แล้วในระบบ',
  '23503': 'ข้อมูลที่อ้างอิงไม่พบในระบบ',
  '42501': 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  'PGRST116': 'ไม่พบข้อมูลที่ต้องการ',
  // Network / generic
  'Failed to fetch': 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเตอร์เน็ต',
  'NetworkError': 'เครือข่ายขัดข้อง กรุณาลองใหม่',
  'timeout': 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่',
};

const PHRASE_MAP: [RegExp, string][] = [
  [/duplicate key/i, 'ข้อมูลนี้มีอยู่แล้วในระบบ'],
  [/foreign key/i, 'ข้อมูลที่อ้างอิงไม่พบในระบบ'],
  [/permission denied/i, 'คุณไม่มีสิทธิ์ดำเนินการนี้'],
  [/not found/i, 'ไม่พบข้อมูลที่ต้องการ'],
  [/invalid.*token/i, 'Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่'],
  [/row.*level.*security/i, 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'],
  [/too many requests/i, 'คำขอมากเกินไป กรุณารอสักครู่'],
  [/payment.*fail/i, 'การชำระเงินล้มเหลว กรุณาลองใหม่'],
  [/card.*declined/i, 'บัตรถูกปฏิเสธ กรุณาใช้บัตรอื่น'],
  [/insufficient.*fund/i, 'ยอดเงินในบัตรไม่เพียงพอ'],
];

const HTTP_MAP: Record<number, string> = {
  400: 'ข้อมูลที่ส่งไม่ถูกต้อง',
  401: 'กรุณาเข้าสู่ระบบก่อน',
  403: 'คุณไม่มีสิทธิ์ดำเนินการนี้',
  404: 'ไม่พบข้อมูลที่ต้องการ',
  409: 'ข้อมูลขัดแย้งกัน กรุณาตรวจสอบอีกครั้ง',
  422: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  429: 'คำขอมากเกินไป กรุณารอสักครู่',
  500: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่',
  503: 'ระบบไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง',
};

export function thError(err: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่'): string {
  if (!err) return fallback;

  // Supabase / PostgREST error object
  if (typeof err === 'object' && err !== null) {
    const e = err as any;

    // HTTP status code
    if (typeof e.status === 'number' && HTTP_MAP[e.status]) return HTTP_MAP[e.status];

    // Supabase error code
    const code = e.code || e.error_code || e.error;
    if (typeof code === 'string' && CODE_MAP[code]) return CODE_MAP[code];

    // Error message string
    const msg = e.message || e.error_description || '';
    if (typeof msg === 'string') {
      for (const [re, th] of PHRASE_MAP) if (re.test(msg)) return th;
      if (msg) return msg; // return original if no match
    }
  }

  if (typeof err === 'string') {
    if (CODE_MAP[err]) return CODE_MAP[err];
    for (const [re, th] of PHRASE_MAP) if (re.test(err)) return th;
    return err;
  }

  return fallback;
}

// Convenience for field-level validation errors (Zod / react-hook-form)
export const FIELD_ERRORS: Record<string, string> = {
  required: 'กรุณากรอกข้อมูล',
  email: 'รูปแบบอีเมลไม่ถูกต้อง',
  minLength: 'ข้อมูลสั้นเกินไป',
  maxLength: 'ข้อมูลยาวเกินไป',
  min: 'ค่าต่ำเกินไป',
  max: 'ค่าสูงเกินไป',
  pattern: 'รูปแบบข้อมูลไม่ถูกต้อง',
  phone: 'รูปแบบเบอร์โทรไม่ถูกต้อง',
  url: 'รูปแบบ URL ไม่ถูกต้อง',
  numeric: 'กรุณากรอกตัวเลขเท่านั้น',
  date: 'รูปแบบวันที่ไม่ถูกต้อง',
  future: 'กรุณาเลือกวันที่ในอนาคต',
  past: 'กรุณาเลือกวันที่ในอดีต',
  taxId: 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก',
};
