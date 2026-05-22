import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Clock, Star, ChevronRight, ArrowLeft, Ticket } from 'lucide-react';
import type { Metadata } from 'next';

type Attraction = {
  name: string;
  nameTh: string;
  category: string;
  emoji: string;
  description: string;
  distance: string;
  duration: string;
  rating: number;
  price: string;
  tips: string;
};

type CityData = {
  label: string;
  labelEn: string;
  hero: string;
  intro: string;
  attractions: Attraction[];
};

const CITY_DATA: Record<string, CityData> = {
  bangkok: {
    label: 'กรุงเทพมหานคร',
    labelEn: 'Bangkok',
    hero: 'from-amber-700 to-orange-900',
    intro: 'เมืองหลวงที่เต็มไปด้วยวัดวาอาราม ตลาดนัด อาหารริมถนน และความมีชีวิตชีวาตลอด 24 ชั่วโมง',
    attractions: [
      { name: 'Grand Palace', nameTh: 'พระบรมมหาราชวัง', category: 'วัง / ประวัติศาสตร์', emoji: '🏯', description: 'พระราชวังหลวงอันยิ่งใหญ่ สร้างในปี พ.ศ. 2325 พร้อมวัดพระแก้วที่ประดิษฐานพระพุทธมหามณีรัตนปฏิมากร', distance: '3 กม. จากสยาม', duration: '2–3 ชม.', rating: 4.8, price: '500 บาท', tips: 'ควรแต่งกายสุภาพ ไม่นุ่งกางเกงขาสั้น ห้ามสวมเสื้อแขนกุด' },
      { name: 'Wat Pho', nameTh: 'วัดโพธิ์', category: 'วัด / ศาสนสถาน', emoji: '🛕', description: 'วัดพระนอนที่ยิ่งใหญ่ มีพระพุทธไสยาสน์ขนาดใหญ่ยาว 46 เมตร ปิดทองทั้งองค์ และมีโรงเรียนนวดแผนโบราณ', distance: '3.5 กม. จากสยาม', duration: '1–2 ชม.', rating: 4.7, price: '200 บาท', tips: 'นวดไทยแท้ราคาไม่แพง ควรจองก่อนเข้าไป' },
      { name: 'Chatuchak Market', nameTh: 'ตลาดนัดจตุจักร', category: 'ตลาด / ช้อปปิ้ง', emoji: '🛍️', description: 'ตลาดนัดสุดสัปดาห์ที่ใหญ่ที่สุดในโลก มีร้านค้ากว่า 15,000 ร้าน สินค้าหัตถกรรม เสื้อผ้า ของสะสม อาหาร และต้นไม้', distance: '8 กม. จากสยาม', duration: 'ครึ่งวัน–เต็มวัน', rating: 4.6, price: 'ฟรีเข้า', tips: 'เปิดเฉพาะเสาร์–อาทิตย์ เช้า 9:00–18:00 น. ควรไปเช้า ก่อนอากาศร้อน' },
      { name: 'Khao San Road', nameTh: 'ถนนข้าวสาร', category: 'ย่านท่องเที่ยว', emoji: '🌃', description: 'ถนนนักเดินทางชื่อดังระดับโลก เต็มไปด้วยร้านอาหาร บาร์ ร้านขายของที่ระลึก และบรรยากาศสนุกสนานตลอดคืน', distance: '2 กม. จากพระบรมมหาราชวัง', duration: 'ตอนเย็น–ดึก', rating: 4.3, price: 'ฟรีเข้า', tips: 'ช่วงเย็นบรรยากาศดีที่สุด ระวังของที่ระลึกราคาแพงเกินจริง' },
      { name: 'Asiatique The Riverfront', nameTh: 'เอเชียทีค เดอะ ริเวอร์ฟร้อนท์', category: 'แหล่งช้อปปิ้ง / บันเทิง', emoji: '🎡', description: 'ตลาดริมแม่น้ำเจ้าพระยาสไตล์วินเทจ มีร้านอาหาร บาร์ ร้านค้า และชิงช้าสวรรค์วิวแม่น้ำ', distance: '5 กม. จากสีลม', duration: '2–4 ชม.', rating: 4.4, price: 'ฟรีเข้า', tips: 'มีเรือข้ามฟากฟรีจากท่าสาทร เปิด 17:00–24:00 น.' },
      { name: 'Lumphini Park', nameTh: 'สวนลุมพินี', category: 'สวนสาธารณะ / ธรรมชาติ', emoji: '🌳', description: 'สวนสาธารณะใจกลางกรุงเทพฯ พื้นที่กว่า 142 เอเคอร์ เหมาะพักผ่อน วิ่งออกกำลังกาย และชมมอนิเตอร์ขนาดใหญ่ในคลอง', distance: '1 กม. จากสีลม', duration: '1–2 ชม.', rating: 4.5, price: 'ฟรี', tips: 'ตอนเช้าตรู่บรรยากาศดีที่สุด มีผู้คนมาออกกำลังกายและเล่นไทชิ' },
    ],
  },
  'chiang-mai': {
    label: 'เชียงใหม่',
    labelEn: 'Chiang Mai',
    hero: 'from-green-700 to-teal-900',
    intro: 'เมืองวัฒนธรรมแห่งภาคเหนือ ล้อมรอบด้วยภูเขา วัดโบราณ ตลาดกลางคืน และวิถีชีวิตล้านนาที่อบอุ่น',
    attractions: [
      { name: 'Doi Inthanon National Park', nameTh: 'อุทยานแห่งชาติดอยอินทนนท์', category: 'ธรรมชาติ / อุทยาน', emoji: '⛰️', description: 'ยอดดอยสูงสุดในประเทศไทย 2,565 เมตร อากาศเย็นสบาย มีน้ำตก พระมหาธาตุนภเมทนีดล และทุ่งดอกไม้ป่า', distance: '90 กม. จากตัวเมือง', duration: 'เต็มวัน', rating: 4.8, price: '300 บาท', tips: 'ออกเดินทางแต่เช้าเพื่อหลีกเลี่ยงหมอก แต่งกายอุ่นหน่อยเพราะอากาศเย็น' },
      { name: 'Doi Suthep Temple', nameTh: 'วัดพระธาตุดอยสุเทพ', category: 'วัด / ศาสนสถาน', emoji: '🛕', description: 'วัดศักดิ์สิทธิ์คู่เมืองเชียงใหม่บนยอดดอยสุเทพ ชมวิวเมืองและเจดีย์ทองคำ', distance: '15 กม. จากตัวเมือง', duration: '2–3 ชม.', rating: 4.7, price: '50 บาท', tips: 'ขึ้นรถสองแถวจากมหาวิทยาลัยเชียงใหม่ หรือนั่งรถส่วนตัว' },
      { name: 'Sunday Night Market', nameTh: 'ถนนคนเดินวันอาทิตย์', category: 'ตลาด / วัฒนธรรม', emoji: '🏮', description: 'ตลาดคนเดินสุดคึกคักทุกวันอาทิตย์ ถนนวัวลาย เต็มไปด้วยงานหัตถกรรมล้านนา อาหาร ดนตรีสด', distance: 'ใจกลางเมือง', duration: '2–4 ชม.', rating: 4.6, price: 'ฟรีเข้า', tips: 'เริ่มต้น 17:00 น. พีกช่วง 19:00–21:00 น. ต่อรองราคาได้' },
      { name: 'Elephant Sanctuary', nameTh: 'สถานพักพิงช้าง', category: 'สัตว์ / นิเวศ', emoji: '🐘', description: 'สถานที่ดูแลช้างแบบมีจริยธรรม ให้อาหาร อาบน้ำ และเดินป่ากับช้างโดยไม่ใช้ขอ', distance: '60 กม. จากตัวเมือง', duration: 'ครึ่งวัน', rating: 4.9, price: '2,500–3,500 บาท', tips: 'เลือก sanctuary ที่ไม่มีการแสดง ไม่ขี่ช้าง เพื่อสนับสนุนการอนุรักษ์' },
      { name: 'Nimman Road', nameTh: 'ถนนนิมมานเหมินท์', category: 'ย่านทันสมัย / คาเฟ่', emoji: '☕', description: 'ย่านฮิปสเตอร์สุดทันสมัย เต็มไปด้วยคาเฟ่สไตล์ กิน ช้อป เดิน บรรยากาศหรูแต่ราคาเป็นมิตร', distance: '3 กม. จากประตูท่าแพ', duration: '2–3 ชม.', rating: 4.5, price: 'ฟรีเข้า', tips: 'Maya Mall อยู่ปลายถนน มีร้านอาหารหลากหลาย เหมาะพักช่วงกลางวัน' },
      { name: 'Chiang Mai Night Bazaar', nameTh: 'ไนท์บาซาร์เชียงใหม่', category: 'ตลาด / ช้อปปิ้ง', emoji: '🌙', description: 'ตลาดกลางคืนย่านช้างคลาน เปิดทุกคืน ของที่ระลึก เสื้อผ้า ของฝาก ราคาจับต้องได้', distance: 'ใจกลางเมือง', duration: '1–3 ชม.', rating: 4.3, price: 'ฟรีเข้า', tips: 'เปิด 18:00–24:00 น. ต่อรองราคาเสมอ เริ่มจากครึ่งราคาที่เสนอ' },
    ],
  },
  phuket: {
    label: 'ภูเก็ต',
    labelEn: 'Phuket',
    hero: 'from-blue-700 to-cyan-900',
    intro: 'เกาะมุกแห่งอันดามัน ชายหาดสีขาว น้ำทะเลใส เกาะสวยงาม และวัฒนธรรมชิโน-โปรตุกีสที่เป็นเอกลักษณ์',
    attractions: [
      { name: 'Patong Beach', nameTh: 'หาดป่าตอง', category: 'ชายหาด', emoji: '🏖️', description: 'ชายหาดที่มีชีวิตชีวาที่สุดของภูเก็ต กิจกรรมทางน้ำครบครัน ร้านอาหาร บาร์ ช้อปปิ้ง', distance: '15 กม. จากตัวเมือง', duration: 'เต็มวัน', rating: 4.3, price: 'ฟรี', tips: 'ช่วง Low Season (พ.ค.–ต.ค.) คลื่นแรง ระวังธงแดง' },
      { name: 'Phi Phi Islands', nameTh: 'หมู่เกาะพีพี', category: 'เกาะ / ทะเล', emoji: '🏝️', description: 'หมู่เกาะน้ำใสชื่อดังระดับโลก ชมหน้าผาหินปูน ดำน้ำ สนอร์เกิล ชมพระอาทิตย์ตก', distance: '45 นาทีจากท่าเรือ', duration: 'เต็มวัน', rating: 4.8, price: '1,500–2,500 บาท (tour)', tips: 'ออกเดินทางแต่เช้าเพื่อหลีกเลี่ยงฝูงชน สะพักค้างคืนที่เกาะได้' },
      { name: 'Big Buddha', nameTh: 'พระพุทธมิ่งมงคลเอกนาคบพิตร', category: 'วัด / ศาสนสถาน', emoji: '🪷', description: 'พระพุทธรูปขนาดใหญ่สูง 45 เมตร บนยอดเขา วิว 360° มองเห็นทั้งเกาะภูเก็ต', distance: '10 กม. จากป่าตอง', duration: '1–2 ชม.', rating: 4.6, price: 'ฟรี (บริจาคได้)', tips: 'พระอาทิตย์ตกจากยอดเขาสวยมาก แต่งกายสุภาพ' },
      { name: 'Phuket Old Town', nameTh: 'เมืองเก่าภูเก็ต', category: 'ประวัติศาสตร์ / วัฒนธรรม', emoji: '🏛️', description: 'ย่านชิโน-โปรตุกีสอันสวยงาม อาคารเก่าสีสันสดใส คาเฟ่ ร้านอาหาร และสตรีทอาร์ต', distance: 'ใจกลางตัวเมือง', duration: '2–4 ชม.', rating: 4.5, price: 'ฟรี', tips: 'เดินชมตอนเช้า อากาศเย็นกว่า และแสงสวยสำหรับถ่ายรูป' },
      { name: 'Similan Islands', nameTh: 'หมู่เกาะสิมิลัน', category: 'เกาะ / ดำน้ำ', emoji: '🤿', description: 'หมู่เกาะระดับโลกสำหรับดำน้ำ น้ำใสสีฟ้าครามคริสตัล ปะการังหลากสีและสัตว์ทะเล', distance: '3 ชม. จากภูเก็ต', duration: '1–2 คืน', rating: 4.9, price: '3,000–8,000 บาท (overnight)', tips: 'เปิดเฉพาะ พ.ย.–พ.ค. ต้องจองทัวร์ล่วงหน้า' },
      { name: 'Bangla Road', nameTh: 'ถนนบางละมุง', category: 'ย่านบันเทิง / ราตรี', emoji: '🎆', description: 'ถนนคนเดินกลางคืน ย่านป่าตอง บาร์ โชว์ ดนตรีสด บรรยากาศสุดมันส์', distance: 'ใจกลางป่าตอง', duration: 'ตอนเย็น–ดึก', rating: 4.2, price: 'ฟรีเข้า', tips: 'เปิดช่วงพลบค่ำ อย่าลืมระวังของมีค่า' },
    ],
  },
  samui: {
    label: 'เกาะสมุย',
    labelEn: 'Koh Samui',
    hero: 'from-teal-700 to-emerald-900',
    intro: 'เกาะสวรรค์อ่าวไทย ปาล์มริมหาด น้ำทะเลสีเขียวมรกต วัฒนธรรมไทยผสมผสานกับรีสอร์ทระดับโลก',
    attractions: [
      { name: 'Chaweng Beach', nameTh: 'หาดเฉวง', category: 'ชายหาด', emoji: '🌴', description: 'ชายหาดที่ยาวและสวยที่สุดบนเกาะสมุย น้ำใสสีฟ้า ทรายขาว กิจกรรมครบครัน', distance: '3 กม. จากสนามบิน', duration: 'เต็มวัน', rating: 4.6, price: 'ฟรี', tips: 'ตอนเช้าเงียบสงบ เหมาะว่ายน้ำ ตอนเย็นมีบาร์ริมหาดบรรยากาศดี' },
      { name: 'Ang Thong Marine Park', nameTh: 'อุทยานแห่งชาติหมู่เกาะอ่างทอง', category: 'เกาะ / อุทยาน', emoji: '🏞️', description: 'หมู่เกาะน้อย 42 เกาะ ทะเลสาบน้ำเค็มบนเกาะ หน้าผาหินปูน สนอร์เกิล และวิวพาโนรามา', distance: '30 กม. จากท่าเรือ', duration: 'เต็มวัน', rating: 4.8, price: '1,800–2,500 บาท (tour)', tips: 'ควรจองทัวร์ล่วงหน้า เดือน มิ.ย.–ก.ค. มรสุม อาจปิด' },
      { name: 'Big Buddha Temple', nameTh: 'วัดพระใหญ่', category: 'วัด / ศาสนสถาน', emoji: '🛕', description: 'วัดชื่อดังบนเกาะนาอิน พระพุทธรูปทองคำขนาดใหญ่ มองเห็นได้ไกลจากทะเล', distance: '12 กม. จากหาดเฉวง', duration: '1 ชม.', rating: 4.4, price: 'ฟรี (บริจาคได้)', tips: 'สะดวกแวะระหว่างทางไปสนามบิน' },
      { name: 'Fisherman\'s Village', nameTh: 'หมู่บ้านชาวประมงบ่อผุด', category: 'วัฒนธรรม / ตลาด', emoji: '🎣', description: 'หมู่บ้านชาวประมงบนฝั่งตะวันตก บรรยากาศเก่าแก่ วันศุกร์เป็นตลาดเดินเล่น', distance: '10 กม. จากหาดเฉวง', duration: '1–3 ชม.', rating: 4.5, price: 'ฟรีเข้า', tips: 'วันศุกร์ตลาดเดินเล่นเปิด 17:00–22:00 น. บรรยากาศดีที่สุด' },
      { name: 'Nathon Pier & Market', nameTh: 'ท่าเรือนาทอน', category: 'ตลาด / วิถีท้องถิ่น', emoji: '⛵', description: 'ท่าเรือหลักของเกาะ ตลาดอาหารท้องถิ่นราคาถูก บรรยากาศชาวบ้านแท้ๆ', distance: '20 กม. จากหาดเฉวง', duration: '1–2 ชม.', rating: 4.2, price: 'ฟรีเข้า', tips: 'อาหารทะเลสดราคาถูกกว่าแหล่งท่องเที่ยวทั่วไปมาก' },
      { name: 'Namuang Waterfall', nameTh: 'น้ำตกนามวัง', category: 'ธรรมชาติ / น้ำตก', emoji: '💧', description: 'น้ำตกที่สวยที่สุดบนเกาะสมุย 2 ชั้น เล่นน้ำใต้น้ำตกได้ บรรยากาศร่มรื่น', distance: '12 กม. จากใจกลางเกาะ', duration: '1–2 ชม.', rating: 4.4, price: 'ฟรี', tips: 'เหมาะสำหรับช่วงหน้าฝน น้ำมาก สวย แต่ระวังลื่น' },
    ],
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  'ชายหาด': 'bg-blue-50 text-blue-700 border-blue-100',
  'วัด / ศาสนสถาน': 'bg-amber-50 text-amber-700 border-amber-100',
  'ธรรมชาติ / อุทยาน': 'bg-green-50 text-green-700 border-green-100',
  'ตลาด / ช้อปปิ้ง': 'bg-pink-50 text-pink-700 border-pink-100',
  'ตลาด / วัฒนธรรม': 'bg-purple-50 text-purple-700 border-purple-100',
  'เกาะ / ทะเล': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'เกาะ / ดำน้ำ': 'bg-teal-50 text-teal-700 border-teal-100',
  'เกาะ / อุทยาน': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'ย่านท่องเที่ยว': 'bg-orange-50 text-orange-700 border-orange-100',
  'ย่านทันสมัย / คาเฟ่': 'bg-rose-50 text-rose-700 border-rose-100',
  'ย่านบันเทิง / ราตรี': 'bg-violet-50 text-violet-700 border-violet-100',
  'ประวัติศาสตร์ / วัฒนธรรม': 'bg-stone-50 text-stone-700 border-stone-100',
  'วัง / ประวัติศาสตร์': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'สัตว์ / นิเวศ': 'bg-lime-50 text-lime-700 border-lime-100',
  'สวนสาธารณะ / ธรรมชาติ': 'bg-green-50 text-green-700 border-green-100',
  'แหล่งช้อปปิ้ง / บันเทิง': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
  'วัฒนธรรม / ตลาด': 'bg-purple-50 text-purple-700 border-purple-100',
  'ตลาด / วิถีท้องถิ่น': 'bg-orange-50 text-orange-700 border-orange-100',
  'ธรรมชาติ / น้ำตก': 'bg-sky-50 text-sky-700 border-sky-100',
};

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const data = CITY_DATA[city];
  if (!data) return {};
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
  return {
    metadataBase: new URL(appUrl),
    title: `สถานที่ท่องเที่ยวใน${data.label} | Maitri`,
    description: `รวม ${data.attractions.length} สถานที่ท่องเที่ยวยอดนิยมใน${data.label} พร้อมเวลาเปิด ราคา และเคล็ดลับการเดินทาง`,
    alternates: {
      canonical: `/destinations/${city}/attractions`,
      languages: { 'th': `/destinations/${city}/attractions`, 'x-default': `/destinations/${city}/attractions` },
    },
    openGraph: {
      title: `สถานที่ท่องเที่ยวใน${data.label}`,
      description: data.intro,
      url: `/destinations/${city}/attractions`,
    },
  };
}

export default async function AttractionsPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = CITY_DATA[city];
  if (!data) notFound();

  const categories = [...new Set(data.attractions.map(a => a.category))];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${data.hero} py-14 px-4`}>
        <div className="max-w-3xl mx-auto">
          <Link href={`/destinations/${city}`}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />ที่พักใน{data.label}
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            สถานที่ท่องเที่ยวใน{data.label}
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xl">{data.intro}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {categories.map(cat => (
              <span key={cat} className="px-3 py-1 rounded-full bg-white/10 text-white text-xs backdrop-blur">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'สถานที่แนะนำ', value: data.attractions.length.toString() },
            { label: 'ที่พักในเมือง', value: 'ดูทั้งหมด' },
            { label: 'คะแนนเฉลี่ย', value: (data.attractions.reduce((s, a) => s + a.rating, 0) / data.attractions.length).toFixed(1) + ' ★' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-black/5 p-4 text-center">
              <p className="text-lg font-bold text-[#2A2522]">{value}</p>
              <p className="text-xs text-[#2A2522]/50 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Attractions list */}
        <div className="space-y-4">
          {data.attractions.map((a, i) => (
            <div key={a.name}
              className="bg-white rounded-2xl border border-black/5 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Number + emoji */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="h-8 w-8 rounded-full bg-[#2A2522] text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <span className="text-2xl">{a.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Category badge */}
                    <span className={`inline-block text-2xs font-medium px-2 py-0.5 rounded-full border mb-2 ${CATEGORY_COLORS[a.category] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                      {a.category}
                    </span>

                    {/* Name */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h2 className="font-bold text-[#2A2522] text-base leading-tight">{a.nameTh}</h2>
                        <p className="text-xs text-[#2A2522]/40">{a.name}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-amber-700">{a.rating}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#2A2522]/65 leading-relaxed mb-3">{a.description}</p>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#2A2522]/50 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#2563eb]" />{a.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#2563eb]" />{a.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3 text-[#2563eb]" />{a.price}
                      </span>
                    </div>

                    {/* Tips */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs text-amber-800">
                        <span className="font-semibold">💡 เคล็ดลับ:</span> {a.tips}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hotel CTA */}
        <div className={`bg-gradient-to-br ${data.hero} rounded-2xl p-6 text-center`}>
          <h2 className="text-white font-bold text-lg mb-1">พักใกล้แหล่งท่องเที่ยว</h2>
          <p className="text-white/60 text-sm mb-4">ค้นหาที่พักใน{data.label} ราคาดีที่สุด ยกเลิกฟรี</p>
          <Link
            href={`/search?city=${encodeURIComponent(data.labelEn)}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2A2522] rounded-xl font-bold text-sm hover:bg-[#FAF7F2] transition-colors shadow-sm">
            ดูที่พักใน{data.label} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Breadcrumb links */}
        <div className="flex items-center gap-2 text-sm text-[#2A2522]/40 flex-wrap">
          <Link href="/" className="hover:text-[#2563eb] transition-colors">หน้าแรก</Link>
          <span>›</span>
          <Link href={`/destinations/${city}`} className="hover:text-[#2563eb] transition-colors">
            ที่พักใน{data.label}
          </Link>
          <span>›</span>
          <span className="text-[#2A2522]/70">สถานที่ท่องเที่ยว</span>
        </div>
      </div>
    </div>
  );
}
