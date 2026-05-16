import { LookupClient } from './lookup-client';

export const metadata = {
  title: 'ตรวจสอบการจอง | Maitri PMS',
  description: 'ค้นหาการจองด้วยรหัสการจองและอีเมล',
};

export default function BookingLookupPage() {
  return <LookupClient />;
}
