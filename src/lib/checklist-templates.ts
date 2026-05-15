export interface ChecklistItem { id: string; label: string; required: boolean; }
export interface ChecklistTemplate { id: string; name: string; items: ChecklistItem[]; }

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate> = {
  vip_arrival: {
    id: 'vip_arrival',
    name: 'VIP Arrival Checklist',
    items: [
      { id: 'amenities', label: 'วางของต้อนรับในห้อง (ผลไม้/ดอกไม้)', required: true },
      { id: 'room_temp', label: 'ตั้งอุณหภูมิห้องตาม preference', required: true },
      { id: 'pillow', label: 'จัดหมอนตาม preference', required: false },
      { id: 'welcome_letter', label: 'วางจดหมายต้อนรับ', required: true },
      { id: 'minibar', label: 'เติม minibar เต็ม', required: true },
      { id: 'escort', label: 'เตรียม escort ถึงห้อง', required: true },
    ],
  },
  checkout: {
    id: 'checkout',
    name: 'Check-out Checklist',
    items: [
      { id: 'folio_review', label: 'ตรวจสอบ folio กับ guest', required: true },
      { id: 'payment', label: 'รับชำระเงิน / ยืนยัน CC', required: true },
      { id: 'keycard', label: 'รับคืน keycard', required: true },
      { id: 'luggage', label: 'เรียก bellboy ช่วยกระเป๋า', required: false },
      { id: 'invoice', label: 'ออก tax invoice (ถ้าขอ)', required: false },
      { id: 'survey', label: 'ส่ง satisfaction survey', required: false },
    ],
  },
  deep_clean: {
    id: 'deep_clean',
    name: 'Deep Cleaning Checklist',
    items: [
      { id: 'mattress', label: 'พลิก/ดูด mattress', required: true },
      { id: 'ac_filter', label: 'ทำความสะอาด AC filter', required: true },
      { id: 'curtain', label: 'ถอดผ้าม่านซัก', required: true },
      { id: 'grout', label: 'ขัดกระเบื้องห้องน้ำ', required: true },
      { id: 'behind_furniture', label: 'เช็ดหลังเฟอร์นิเจอร์', required: true },
      { id: 'minibar_clean', label: 'ล้าง minibar ด้านใน', required: true },
    ],
  },
  inspection: {
    id: 'inspection',
    name: 'Room Inspection Checklist',
    items: [
      { id: 'bed_made', label: 'ปูเตียงตรง สะอาด ไม่มีรอย', required: true },
      { id: 'bathroom', label: 'ห้องน้ำสะอาด ไม่มีคราบ', required: true },
      { id: 'amenities_placed', label: 'วางของใช้ครบตามมาตรฐาน', required: true },
      { id: 'no_odor', label: 'ไม่มีกลิ่น', required: true },
      { id: 'tv_works', label: 'TV ทำงานได้', required: true },
      { id: 'ac_works', label: 'AC ทำงานได้', required: true },
      { id: 'lights', label: 'ไฟทุกดวงทำงาน', required: true },
    ],
  },
};

export function getTemplate(id: string): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES[id];
}
