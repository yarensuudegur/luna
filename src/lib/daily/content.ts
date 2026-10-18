import type { PlanetKey } from '@/lib/astro';

export type DailyItem = {
  /** Başlık. */
  h: string;
  /** Metin; {ay} yerine Ay'ın bulunduğu burç gelir. */
  b: string;
  /** Destekleyici kapanış cümlesi. */
  s: string;
  /** Sert kapanış cümlesi. */
  x: string;
  /** Metnin konuştuğu transit gezegenler; seçimde bu gezegenlerin açıları ağırlık kazanır. */
  planets: readonly PlanetKey[];
  /** Ay bu evlerden geçerken de metin öne çıkar. */
  houses?: readonly number[];
};

export const DAILY: readonly DailyItem[] = [
  {
    h: 'Bugün yavaş gitmek sana zaman kazandırır.',
    b: 'Ay {ay} ilerlerken dikkatin kolayca dağılabilir. Elindeki işi bitirmeden yenisine geçme. Akşama doğru biriyle yapacağın kısa ve dürüst bir konuşma günün en iyi anı olabilir.',
    s: 'Kendine gösterdiğin sabır bugün en güçlü yanın.',
    x: 'Ertelediğin o tek işi öğleden önce bitir.',
    planets: ['Ay'],
  },
  {
    h: 'Söylemek istediğin şeyin bir taslağı zaten hazır.',
    b: 'Merkür iletişim alanını hareketlendiriyor. Kafanda kurduğun cümleyi yazıya dök, sonra bir kez sesli oku. Bugün açık olmak sana kusursuz olmaktan daha çok yarar.',
    s: 'Ne hissettiğini anlatmak için doğru anı beklemek zorunda değilsin.',
    x: 'Lafı dolandırma, ne istediğini doğrudan söyle.',
    planets: ['Merkür'],
  },
  {
    h: 'Küçük bir düzen, büyük bir rahatlama getirir.',
    b: 'Ay {ay} olduğu için ev ve gündelik rutin daha çok dikkatini çekebilir. Bir çekmeceyi toplamak, bir faturayı ödemek ya da yarın için tek bir plan yapmak zihnini hafifletir.',
    s: 'Bugün yaptığın her küçük şey sayılır.',
    x: 'Dağınıklığı bahane etmeyi bırak, on dakikanı ayır.',
    planets: ['Ay'],
    houses: [4, 6],
  },
  {
    h: 'Merakın seni doğru kişiye götürebilir.',
    b: 'Jüpiter sosyal alanını destekliyor. Uzun süredir konuşmadığın birine yazmak ya da yeni bir grupta söz almak için iyi bir gün. Soru sormak bugün sana cevap vermekten daha çok kapı açar.',
    s: 'İlk adımı atan sen olursan kimse seni yargılamaz.',
    x: 'Beklemeyi bırak, mesajı gönder.',
    planets: ['Jüpiter'],
    houses: [11],
  },
  {
    h: 'Bugün enerjin kısa ama yoğun.',
    b: 'Mars yükselenine açı yapıyor. Ağır işleri sabah bitirip öğleden sonrayı hafif tutmak iyi olur. Akşam bedenine iyi gelecek bir şey yap. Yürüyüş, esneme ya da erken uyku yeterli.',
    s: 'Dinlenmek de üretkenliğin bir parçası.',
    x: 'Enerjini boş tartışmalara harcama.',
    planets: ['Mars'],
  },
  {
    h: 'Bir sınır koymak ilişkini korur.',
    b: 'Satürn ilişkiler alanında net olmanı istiyor. Kendine ayırdığın zamanı savunmak bencillik sayılmaz. Nazik bir hayır, isteksiz bir evetten daha çok saygı kazanır.',
    s: 'Kendini korumak sevdiklerini korumanın da bir yolu.',
    x: 'Herkesi memnun etmeye çalışma, kendi planını koru.',
    planets: ['Satürn'],
    houses: [7],
  },
  {
    h: 'Sezgilerin bugün hızlı çalışıyor.',
    b: 'Ay {ay} ve Neptün’e uyumlu açı yapıyor. Bir karar verirken ilk hissini not et, akşam tekrar bak. Rüyalar ve küçük tesadüfler bugün sana daha çok şey anlatabilir.',
    s: 'İç sesine güvenmek için izin istemene gerek yok.',
    x: 'Hissettiğini görmezden gelme, ama acele de etme.',
    planets: ['Ay', 'Neptün'],
    houses: [12],
  },
  {
    h: 'Bugün bir şeyi bitirmek çok keyifli olacak.',
    b: 'Venüs emek alanını aydınlatıyor. Yarım kalan bir projeyi, bir kitabı ya da bir yazışmayı tamamlamak sana beklediğinden fazla tatmin verecek.',
    s: 'Bitirdiğin her şey için kendini tebrik et.',
    x: 'Yarım bıraktığın listeden bir şeyi bugün kapat.',
    planets: ['Venüs'],
  },
];

export const DO = [
  'Uzun yürüyüş', 'Pencere kenarı', 'Eski bir şarkı', 'Erken uyku', 'Sade kahvaltı', 'Not defteri',
  'Sıcak çay', 'Kısa bir mesaj', 'Kitapçı', 'Ev bitkileri', 'Sessiz vagon', 'Kendi tarifin',
  'Boş bir akşam', 'El yazısı', 'Açık hava', 'Mor kalem',
] as const;

export const DONT = [
  'Gece alışverişi', 'Eski mesajlar', 'Üçüncü kahve', 'Kıyaslama', 'Aceleyle e-posta',
  'Grup sohbetinde tartışma', 'Kafanda senaryo', 'Gereksiz özür', 'Yatakta ekran', 'Unutulan sözler',
  'Yarım iş', 'Fazla plan',
] as const;

/** Durum sırası her yerde: 0 şans/güç, 1 baskı, 2 zorluk, 3 akış. */
export type LuckState = 0 | 1 | 2 | 3;

export const STATES = ['Güç', 'Baskı', 'Zorluk', 'Akış'] as const;
export const LUCK_WORD = ['şans', 'baskı', 'zorluk', 'akış'] as const;

export const DEEP_CATEGORIES = ['Ev & aile', 'Arkadaşlar', 'İş & para', 'Aşk', 'Düşünce', 'Ruhsal'] as const;
export type DeepCategory = (typeof DEEP_CATEGORIES)[number];

export const DEEP: Record<DeepCategory, readonly [string, string, string, string]> = {
  'Ev & aile': [
    'Evde huzurlu bir hava var, bunu paylaş.',
    'Ev işleri birikebilir, yardım istemekten çekinme.',
    'Ailede biriyle görüş ayrılığı çıkabilir, sesini yükseltmeden konuş.',
    'Evde sakin bir gün.',
  ],
  Arkadaşlar: [
    'Grubun içinde sesin daha çok duyuluyor.',
    'Herkese yetişmeye çalışma, tek bir plana evet de.',
    'Bir arkadaşınla planlar karışabilir, esnek ol.',
    'Sosyal hayatında sakin bir gün.',
  ],
  'İş & para': [
    'Odaklanman kolay, zor işi şimdi bitir.',
    'Teslim tarihleri sıkıştırabilir, listeni kısalt.',
    'Harcamalarını bugün iki kez düşün.',
    'İşte rutin bir gün.',
  ],
  Aşk: [
    'Rahat ve çekicisin, bunu saklama.',
    'Fazla analiz etme, akışta kal.',
    'Beklentilerini açıkça konuş.',
    'Kalbin bugün dinleniyor.',
  ],
  Düşünce: [
    'Fikirlerin akıyor, not al.',
    'Aynı anda çok fikir var, birini seç.',
    'Odaklanmak zor olabilir, kısa molalar ver.',
    'Zihnin dinleniyor.',
  ],
  Ruhsal: [
    'İçsel bir netlik hissediyorsun.',
    'Kendine zaman bulmak zor, beş dakika yeter.',
    'Eski bir duygu yüzeye çıkabilir, kendine nazik ol.',
    'Sessiz bir iç gün.',
  ],
};

/** Bugün ekranındaki şans bölümlerinin sırası. */
export const LUCK_ORDER = ['Ev & aile', 'Arkadaşlar', 'İş & para', 'Aşk'] as const;
export type LuckCategory = (typeof LUCK_ORDER)[number];

export const LUCK_PRE: Record<LuckCategory, string> = {
  'Ev & aile': 'Evde ve ailede',
  Arkadaşlar: 'Arkadaşlıkta',
  'İş & para': 'İşte ve parada',
  Aşk: 'Aşkta',
};

export const LUCK_TXT: Record<LuckCategory, readonly [string, string, string, string]> = {
  'Ev & aile': [
    'Bir aile üyesi tam onu düşündüğün anda arıyor. Komşunun yolun karşısından el sallaması bile bugün her zamankinden sıcak geliyor.',
    'Evdeki küçük işler göründüğünden uzun sürebilir. Birinin senden ne beklediğini tahmin etmeye çalışma, sor.',
    'Eski bir aile konusu sofraya geri gelebilir. Haklı çıkmaya uğraşmadan dinlemek evi bugün daha sakin tutar.',
    'Evde kimsenin senden bir şey istemediği sessiz bir akşam. Çayı demle, pencereyi biraz arala.',
  ],
  Arkadaşlar: [
    'Bir arkadaşın bugün seni sen fark etmeden kolluyor. Küçük bir teşekkür mesajı ikinizin de gününü değiştirir.',
    'Herkes aynı anda senden bir şey istiyor gibi. Tek bir plana evet de, gerisine nazikçe sonra de.',
    'Grup sohbetinde bir cümle yanlış anlaşılabilir. Göndermeden önce bir kez daha oku.',
    'Arkadaşlıkların sakin bir günde. Kimseye bir şey kanıtlaman gerekmiyor.',
  ],
  'İş & para': [
    'Uzun süredir beklediğin bir şey sana doğru geliyor. İlk tepkin şüphe olabilir, bu sefer kabul et.',
    'Masandaki işler üst üste biniyor. Listeni üç maddeye indir, gerisini yarına bırak.',
    'Bir harcama ilk bakışta mantıklı görünebilir. Sepeti bir gece beklet.',
    'İşte rutin ve sessiz bir gün. Kafanı toplamak için iyi bir fırsat.',
  ],
  Aşk: [
    'Rahat olduğunda daha çekicisin ve bugün bunu herkes görüyor. Bir bakışı biraz daha uzun tutmaktan çekinme.',
    'Bir mesajın cevabını beklerken zaman yavaş geçebilir. Telefonu bir süre başka odada bırak.',
    'Beklentilerin bugün söylediklerinden daha yüksek sesle konuşabilir. Ne istediğini açıkça söylemek tahmin oyunundan daha az yorar.',
    'Kalbin bugün dinleniyor. Kimseyi aramadan da iyi bir gün geçirebilirsin.',
  ],
};

export const HOUSE_THEME = [
  'kimliğin ve görünüşün',
  'paran ve değer verdiklerin',
  'iletişimin ve yakın çevren',
  'evin ve ailen',
  'aşk, eğlence ve yaratıcılık',
  'günlük rutinin ve bedenin',
  'ikili ilişkilerin',
  'paylaşımlar ve dönüşüm',
  'öğrenme ve yolculuklar',
  'kariyerin ve hedeflerin',
  'arkadaşların ve grupların',
  'iç dünyan ve dinlenme',
] as const;

/** [numara, ad, düz anlam, ters anlam, öneri] */
export type TarotCard = readonly [string, string, string, string, string];

export const TAROT: readonly TarotCard[] = [
  ['0', 'Deli', 'Yeni bir başlangıç, cesaret, plansız bir adım.', 'Düşünmeden atlamak, dağınıklık.', 'Bugün küçük bir ilki dene.'],
  ['I', 'Büyücü', 'Elindeki araçlarla bir şey başlatma gücü.', 'Dağılan enerji, yarım kalan işler.', 'Bir fikri bugün somut bir adıma çevir.'],
  ['II', 'Azize', 'Sezgi, sessizce bilmek.', 'İç sesini bastırmak.', 'Karar vermeden önce bir süre sus ve dinle.'],
  ['III', 'İmparatoriçe', 'Bolluk, şefkat, üretkenlik.', 'Kendini ihmal etmek.', 'Kendine iyi gelen bir şey hazırla.'],
  ['IV', 'İmparator', 'Düzen, sınır, sorumluluk.', 'Katılık, kontrol ihtiyacı.', 'Gününe net bir yapı ver.'],
  ['V', 'Aziz', 'Gelenek, öğrenmek, bir rehber.', 'Kalıpları sorgulamak.', 'Güvendiğin birinden fikir al.'],
  ['VI', 'Aşıklar', 'Seçim, uyum, değerlerin netleşmesi.', 'Kararsızlık, uyumsuzluk.', 'Seçimini değerlerine göre yap.'],
  ['VII', 'Savaş Arabası', 'Yön, irade, ilerleme.', 'Dağılan odak.', 'Tek bir hedefe yönel.'],
  ['VIII', 'Güç', 'Yumuşak güç, sabır, cesaret.', 'Kendinden şüphe.', 'Sert olmadan kararlı kal.'],
  ['IX', 'Ermiş', 'İçe dönüş, yalnız düşünme zamanı.', 'Kendini fazla soyutlamak.', 'Kendine sessiz bir saat ayır.'],
  ['X', 'Kader Çarkı', 'Değişim, döngüler, şans.', 'Kontrol edemediğine direnmek.', 'Akışa uyum sağla.'],
  ['XI', 'Adalet', 'Denge, dürüstlük, sonuçlar.', 'Tek taraflı bakış.', 'Bir konuyu iki taraftan da düşün.'],
  ['XII', 'Asılan Adam', 'Bekleme, farklı açıdan bakma.', 'Gereksiz fedakârlık.', 'Acele etme, bakış açını değiştir.'],
  ['XIII', 'Dönüşüm', 'Bir dönemin kapanması, yenilenme.', 'Değişime direnmek.', 'Artık işine yaramayan bir şeyi bırak.'],
  ['XIV', 'Denge', 'Orta yol, sabır, uyum.', 'Aşırılık.', 'Ölçüyü bul.'],
  ['XV', 'Zincir', 'Seni tutan alışkanlıklar.', 'Zincirlerden kurtulmak.', 'Bir alışkanlığı fark et, bir gün ara ver.'],
  ['XVI', 'Kule', 'Ani değişim, sağlam olmayan temellerin yıkılması.', 'Kaçınılan bir yüzleşme.', 'Beklenmedik olana esnek yaklaş.'],
  ['XVII', 'Yıldız', 'Umut, iyileşme, ilham.', 'Yorgunluk, umudu kaybetmek.', 'Gelecek için küçük bir dilek yaz.'],
  ['XVIII', 'Ay', 'Belirsizlik, rüyalar, sezgi.', 'Kafa karışıklığının dağılması.', 'Rüyalarını not et.'],
  ['XIX', 'Güneş', 'Neşe, açıklık, başarı.', 'Geçici bulutlar.', 'Sevdiğin biriyle bir sevinç paylaş.'],
  ['XX', 'Uyanış', 'Bir çağrıya cevap vermek, yeniden doğuş.', 'Kendini fazla yargılamak.', 'Ertelediğin bir çağrıya kulak ver.'],
  ['XXI', 'Dünya', 'Tamamlanma, bütünlük.', 'Son adımda takılmak.', 'Bir döngüyü kutla.'],
];
