export type Lang = 'th' | 'en';

export const ADMIN_STRINGS: Record<Lang, {
  nav: {
    overview: string;
    tenants: string;
    search: string;
    settings: string;
    system: string;
    dashboard: string;
    organizations: string;
    ranking: string;
    appSettings: string;
    errorLogs: string;
    logout: string;
  };
  common: {
    save: string;
    saving: string;
    cancel: string;
    reset: string;
    loading: string;
    search: string;
    actions: string;
    status: string;
    name: string;
    plan: string;
    joined: string;
    hotels: string;
    edit: string;
    delete: string;
    active: string;
    suspended: string;
    confirm: string;
  };
  kpi: {
    organizations: string;
    hotels: string;
    mrr: string;
    newThisMonth: string;
  };
  orgs: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noResults: string;
    suspend: string;
    reactivate: string;
    impersonate: string;
    viewDetail: string;
    impersonateReason: string;
    columns: {
      name: string;
      plan: string;
      status: string;
      hotels: string;
      joined: string;
      actions: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    tabs: {
      general: string;
      plans: string;
      features: string;
      announcement: string;
      content: string;
    };
    general: {
      appName: string;
      appNameDesc: string;
      supportEmail: string;
      maintenanceMode: string;
      maintenanceModeDesc: string;
      logoUrl: string;
      save: string;
    };
    plans: {
      title: string;
      desc: string;
      starter: string;
      standard: string;
      pro: string;
      enterprise: string;
      priceLabel: string;
    };
    features: {
      title: string;
      desc: string;
      aiConcierge: string;
      loyaltyProgram: string;
      channelManager: string;
      multiProperty: string;
      analyticsAdvanced: string;
      onlyOn: string;
    };
    announcement: {
      title: string;
      desc: string;
      message: string;
      messagePlaceholder: string;
      enabled: string;
      preview: string;
      save: string;
    };
    content: {
      title: string;
      desc: string;
      heroHeadlineTh: string;
      heroHeadlineEn: string;
      heroSubtitle: string;
      heroCta: string;
      siteDescription: string;
      siteDescriptionDesc: string;
      faviconUrl: string;
      faviconDesc: string;
      footerTagline: string;
      save: string;
    };
  };
  ranking: {
    title: string;
    subtitle: string;
    save: string;
    reset: string;
    formula: string;
    featuredLabel: string;
    featuredDesc: string;
    signals: {
      rating: string;
      reviews: string;
      photos: string;
      freeCancel: string;
      stars: string;
      content: string;
      breakfast: string;
      featured: string;
    };
    livePreview: string;
    maxScore: string;
    noFeatured: string;
    totalWeight: string;
  };
  errors: {
    title: string;
    subtitle: string;
    lastEvents: string;
    noErrors: string;
    stackTrace: string;
  };
  system: {
    health: string;
    dbStatus: string;
    apiStatus: string;
    uptime: string;
  };
}> = {
  th: {
    nav: {
      overview: 'ภาพรวม',
      tenants: 'ผู้เช่า',
      search: 'ค้นหา',
      settings: 'ตั้งค่า',
      system: 'ระบบ',
      dashboard: 'แดชบอร์ด',
      organizations: 'องค์กร',
      ranking: 'การจัดอันดับ',
      appSettings: 'ตั้งค่าแอป',
      errorLogs: 'บันทึกข้อผิดพลาด',
      logout: 'ออกจากระบบ',
    },
    common: {
      save: 'บันทึก',
      saving: 'กำลังบันทึก...',
      cancel: 'ยกเลิก',
      reset: 'รีเซ็ต',
      loading: 'กำลังโหลด...',
      search: 'ค้นหา',
      actions: 'การดำเนินการ',
      status: 'สถานะ',
      name: 'ชื่อ',
      plan: 'แผน',
      joined: 'วันที่เข้าร่วม',
      hotels: 'โรงแรม',
      edit: 'แก้ไข',
      delete: 'ลบ',
      active: 'ใช้งานอยู่',
      suspended: 'ถูกระงับ',
      confirm: 'ยืนยัน',
    },
    kpi: {
      organizations: 'องค์กรทั้งหมด',
      hotels: 'โรงแรมทั้งหมด',
      mrr: 'รายได้รายเดือน (MRR)',
      newThisMonth: 'ใหม่เดือนนี้',
    },
    orgs: {
      title: 'จัดการองค์กร',
      subtitle: 'ดูแลและจัดการองค์กรทั้งหมดในแพลตฟอร์ม',
      searchPlaceholder: 'ค้นหาองค์กร...',
      noResults: 'ไม่พบองค์กรที่ตรงกัน',
      suspend: 'ระงับการใช้งาน',
      reactivate: 'เปิดใช้งานอีกครั้ง',
      impersonate: 'เข้าสู่ระบบแทน',
      viewDetail: 'ดูรายละเอียด',
      impersonateReason: 'กรุณาระบุเหตุผลในการเข้าสู่ระบบแทน',
      columns: {
        name: 'ชื่อองค์กร',
        plan: 'แผนการใช้งาน',
        status: 'สถานะ',
        hotels: 'จำนวนโรงแรม',
        joined: 'วันที่เข้าร่วม',
        actions: 'การดำเนินการ',
      },
    },
    settings: {
      title: 'ตั้งค่าแพลตฟอร์ม',
      subtitle: 'จัดการการตั้งค่าระดับแพลตฟอร์มทั้งหมด',
      tabs: {
        general: 'ทั่วไป',
        plans: 'แผนการใช้งาน',
        features: 'ฟีเจอร์',
        announcement: 'ประกาศ',
        content: 'เนื้อหาเว็บ',
      },
      general: {
        appName: 'ชื่อแอปพลิเคชัน',
        appNameDesc: 'ชื่อที่แสดงในส่วนหัวและอีเมล',
        supportEmail: 'อีเมลสนับสนุน',
        maintenanceMode: 'โหมดปิดปรับปรุง',
        maintenanceModeDesc: 'เมื่อเปิดใช้งาน ผู้ใช้ทั่วไปจะไม่สามารถเข้าสู่ระบบได้',
        logoUrl: 'URL โลโก้',
        save: 'บันทึกการตั้งค่า',
      },
      plans: {
        title: 'แผนการใช้งาน',
        desc: 'กำหนดราคาและคุณสมบัติของแต่ละแผน',
        starter: 'Starter',
        standard: 'Standard',
        pro: 'Pro',
        enterprise: 'Enterprise',
        priceLabel: 'ราคา/เดือน',
      },
      features: {
        title: 'ฟีเจอร์แพลตฟอร์ม',
        desc: 'เปิด/ปิดฟีเจอร์สำหรับแต่ละแผนการใช้งาน',
        aiConcierge: 'AI Concierge',
        loyaltyProgram: 'โปรแกรมสะสมแต้ม',
        channelManager: 'Channel Manager',
        multiProperty: 'หลายสาขา',
        analyticsAdvanced: 'Analytics ขั้นสูง',
        onlyOn: 'ใช้ได้เฉพาะแผน',
      },
      announcement: {
        title: 'ประกาศระบบ',
        desc: 'แสดงข้อความประกาศแก่ผู้ใช้ทุกคนในแพลตฟอร์ม',
        message: 'ข้อความประกาศ',
        messagePlaceholder: 'พิมพ์ข้อความประกาศที่นี่...',
        enabled: 'เปิดใช้งานประกาศ',
        preview: 'ตัวอย่าง',
        save: 'บันทึกประกาศ',
      },
      content: {
        title: 'เนื้อหาหน้าเว็บ',
        desc: 'แก้ไขข้อความและเนื้อหาที่แสดงบนหน้าเว็บสาธารณะ รวมถึงชื่อเว็บและไอคอน',
        heroHeadlineTh: 'หัวข้อหลัก (ภาษาไทย)',
        heroHeadlineEn: 'หัวข้อหลัก (ภาษาอังกฤษ)',
        heroSubtitle: 'คำบรรยายใต้หัวข้อ',
        heroCta: 'ข้อความปุ่ม CTA',
        siteDescription: 'คำอธิบายเว็บ (SEO)',
        siteDescriptionDesc: 'ข้อความที่แสดงใน Google และ social media ควรยาว 120-160 ตัวอักษร',
        faviconUrl: 'URL ไอคอนเว็บ (Favicon)',
        faviconDesc: 'URL รูปภาพ .png หรือ .svg แนะนำขนาด 32x32 หรือ 64x64 px — ปล่อยว่างเพื่อใช้ไอคอนเริ่มต้น',
        footerTagline: 'คำขวัญท้ายเว็บ (Footer)',
        save: 'บันทึกเนื้อหา',
      },
    },
    ranking: {
      title: 'สูตรการจัดอันดับโรงแรม',
      subtitle: 'ปรับน้ำหนักสัญญาณเพื่อควบคุมลำดับการแสดงผลโรงแรม',
      save: 'บันทึกสูตร',
      reset: 'รีเซ็ตค่าเริ่มต้น',
      formula: 'สูตรคำนวณ',
      featuredLabel: 'โรงแรมแนะนำ',
      featuredDesc: 'โรงแรมที่ถูกเลือกเป็นแนะนำจะได้รับคะแนนพิเศษ',
      signals: {
        rating: 'คะแนนรีวิว',
        reviews: 'จำนวนรีวิว',
        photos: 'จำนวนรูปภาพ',
        freeCancel: 'ยกเลิกฟรี',
        stars: 'ระดับดาว',
        content: 'ความครบถ้วนของข้อมูล',
        breakfast: 'รวมอาหารเช้า',
        featured: 'โรงแรมแนะนำ',
      },
      livePreview: 'ตัวอย่างผลลัพธ์แบบเรียลไทม์',
      maxScore: 'คะแนนสูงสุด',
      noFeatured: 'ไม่มีโรงแรมแนะนำ',
      totalWeight: 'น้ำหนักรวม',
    },
    errors: {
      title: 'บันทึกข้อผิดพลาด',
      subtitle: 'ตรวจสอบข้อผิดพลาดและเหตุการณ์ผิดปกติในระบบ',
      lastEvents: 'เหตุการณ์ล่าสุด',
      noErrors: 'ไม่พบข้อผิดพลาด',
      stackTrace: 'Stack Trace',
    },
    system: {
      health: 'สถานะระบบ',
      dbStatus: 'สถานะฐานข้อมูล',
      apiStatus: 'สถานะ API',
      uptime: 'เวลาทำงานสะสม',
    },
  },

  en: {
    nav: {
      overview: 'Overview',
      tenants: 'Tenants',
      search: 'Search',
      settings: 'Settings',
      system: 'System',
      dashboard: 'Dashboard',
      organizations: 'Organizations',
      ranking: 'Ranking',
      appSettings: 'App Settings',
      errorLogs: 'Error Logs',
      logout: 'Sign Out',
    },
    common: {
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      reset: 'Reset',
      loading: 'Loading...',
      search: 'Search',
      actions: 'Actions',
      status: 'Status',
      name: 'Name',
      plan: 'Plan',
      joined: 'Joined',
      hotels: 'Hotels',
      edit: 'Edit',
      delete: 'Delete',
      active: 'Active',
      suspended: 'Suspended',
      confirm: 'Confirm',
    },
    kpi: {
      organizations: 'Total Organizations',
      hotels: 'Total Hotels',
      mrr: 'Monthly Recurring Revenue',
      newThisMonth: 'New This Month',
    },
    orgs: {
      title: 'Manage Organizations',
      subtitle: 'Oversee and manage all organizations on the platform',
      searchPlaceholder: 'Search organizations...',
      noResults: 'No organizations found',
      suspend: 'Suspend',
      reactivate: 'Reactivate',
      impersonate: 'Impersonate',
      viewDetail: 'View Detail',
      impersonateReason: 'Please provide a reason for impersonation',
      columns: {
        name: 'Organization Name',
        plan: 'Plan',
        status: 'Status',
        hotels: 'Hotels',
        joined: 'Joined',
        actions: 'Actions',
      },
    },
    settings: {
      title: 'Platform Settings',
      subtitle: 'Manage all platform-level configuration',
      tabs: {
        general: 'General',
        plans: 'Plans',
        features: 'Features',
        announcement: 'Announcement',
        content: 'Content',
      },
      general: {
        appName: 'Application Name',
        appNameDesc: 'Name shown in the header and emails',
        supportEmail: 'Support Email',
        maintenanceMode: 'Maintenance Mode',
        maintenanceModeDesc: 'When enabled, regular users will not be able to sign in',
        logoUrl: 'Logo URL',
        save: 'Save Settings',
      },
      plans: {
        title: 'Subscription Plans',
        desc: 'Define pricing and capabilities for each plan',
        starter: 'Starter',
        standard: 'Standard',
        pro: 'Pro',
        enterprise: 'Enterprise',
        priceLabel: 'Price / month',
      },
      features: {
        title: 'Platform Features',
        desc: 'Enable or disable features per subscription plan',
        aiConcierge: 'AI Concierge',
        loyaltyProgram: 'Loyalty Program',
        channelManager: 'Channel Manager',
        multiProperty: 'Multi-Property',
        analyticsAdvanced: 'Advanced Analytics',
        onlyOn: 'Only on',
      },
      announcement: {
        title: 'System Announcement',
        desc: 'Display a banner message to all users on the platform',
        message: 'Announcement Message',
        messagePlaceholder: 'Type your announcement message here...',
        enabled: 'Enable Announcement',
        preview: 'Preview',
        save: 'Save Announcement',
      },
      content: {
        title: 'Website Content',
        desc: 'Edit text and content shown on public pages, including the site name and favicon',
        heroHeadlineTh: 'Hero Headline (Thai)',
        heroHeadlineEn: 'Hero Headline (English)',
        heroSubtitle: 'Hero Subtitle',
        heroCta: 'CTA Button Text',
        siteDescription: 'Site Description (SEO)',
        siteDescriptionDesc: 'Shown in Google and social media previews. Aim for 120–160 characters.',
        faviconUrl: 'Favicon URL',
        faviconDesc: 'URL to a .png or .svg image. Recommended 32×32 or 64×64 px — leave blank to use the default icon.',
        footerTagline: 'Footer Tagline',
        save: 'Save Content',
      },
    },
    ranking: {
      title: 'Hotel Ranking Formula',
      subtitle: 'Adjust signal weights to control how hotels are ordered in search results',
      save: 'Save Formula',
      reset: 'Reset to Defaults',
      formula: 'Scoring Formula',
      featuredLabel: 'Featured Hotels',
      featuredDesc: 'Hotels marked as featured receive a bonus score',
      signals: {
        rating: 'Review Rating',
        reviews: 'Review Count',
        photos: 'Photo Count',
        freeCancel: 'Free Cancellation',
        stars: 'Star Rating',
        content: 'Content Completeness',
        breakfast: 'Breakfast Included',
        featured: 'Featured',
      },
      livePreview: 'Live Preview',
      maxScore: 'Max Score',
      noFeatured: 'No featured hotels',
      totalWeight: 'Total Weight',
    },
    errors: {
      title: 'Error Logs',
      subtitle: 'Monitor errors and anomalies across the platform',
      lastEvents: 'Recent Events',
      noErrors: 'No errors found',
      stackTrace: 'Stack Trace',
    },
    system: {
      health: 'System Health',
      dbStatus: 'Database Status',
      apiStatus: 'API Status',
      uptime: 'Uptime',
    },
  },
};

/**
 * Look up a translated string by dot-notation key.
 *
 * @example
 *   t('th', 'nav.overview')        // 'ภาพรวม'
 *   t('en', 'orgs.columns.name')   // 'Organization Name'
 */
export function t(lang: Lang, key: string): string {
  const parts = key.split('.');
  let node: any = ADMIN_STRINGS[lang];

  for (const part of parts) {
    if (node == null || typeof node !== 'object') {
      return key;
    }
    node = node[part];
  }

  if (typeof node === 'string') {
    return node;
  }

  return key;
}
