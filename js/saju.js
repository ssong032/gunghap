// 오늘의 사주: 내 일간 × 오늘 일진 (재미용)
// 일진 기준: 1900-01-01 = 갑술(60갑자 인덱스 10). 실제 기사 일진(2022-07-05 기미, 2022-08-22 정미,
// 2026-11-19 정유, 2026-11-20 무술)으로 검증함.

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const STEMS_HJ = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const BRANCHES_HJ = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ELEMENTS = ["목", "화", "토", "금", "수"];
const ELEMENT_ADJ = ["푸른", "붉은", "노란", "하얀", "검은"];
const ELEMENT_COLORS = [["초록", "민트"], ["빨강", "코랄"], ["노랑", "베이지"], ["흰색", "실버"], ["남색", "블랙"]];
const ELEMENT_NUMBERS = [[3, 8], [2, 7], [5, 0], [4, 9], [1, 6]];

// 일간별 성향
const DAY_MASTER = [
  { nick: "곧게 뻗는 큰 나무", desc: "목표가 생기면 끝까지 밀고 나가는 추진력과 리더십이 있어요." },
  { nick: "유연한 꽃과 풀", desc: "어디서든 잘 어울리는 적응력과 부드러운 친화력이 있어요." },
  { nick: "세상을 비추는 태양", desc: "밝고 열정적이어서 주변을 환하게 만드는 사람이에요." },
  { nick: "따뜻한 촛불", desc: "섬세하고 배려 깊어서 가까운 사람을 은은하게 챙겨요." },
  { nick: "듬직한 큰 산", desc: "믿음직하고 포용력이 커서 사람들이 기대고 싶어 해요." },
  { nick: "기름진 논밭", desc: "실속 있고 세심해서 맡은 일을 알차게 키워 내요." },
  { nick: "단단한 바위", desc: "결단력과 의리가 있어서 한번 정하면 흔들리지 않아요." },
  { nick: "빛나는 보석", desc: "깔끔하고 감각이 좋아서 작은 것도 반짝이게 다듬어요." },
  { nick: "넓은 바다", desc: "생각의 폭이 넓고 지혜로워서 큰 흐름을 잘 읽어요." },
  { nick: "맑은 이슬비", desc: "직관과 감수성이 뛰어나 분위기를 누구보다 빨리 알아채요." },
];

// 십신별 하루 풀이. scores = [총운, 애정운, 금전운, 일·학업운]
const TEN_GODS = {
  비견: {
    title: "든든한 내 편이 생기는 날",
    scores: [78, 70, 66, 80],
    total: "나와 같은 기운이 들어오는 날이라 자신감이 올라가요. 혼자 끙끙대던 일도 친구나 동료와 나누면 훨씬 가벼워져요.",
    love: "편한 친구 같은 대화가 잘 통해요. 내 주장만 고집하지 않으면 분위기가 좋아요.",
    money: "큰 변화보다는 지금 흐름을 지키는 게 좋아요. 함께 쓰는 돈은 미리 나눠 두면 깔끔해요.",
    work: "협업 운이 좋아요. 같은 목표를 가진 사람과 손잡으면 속도가 붙어요.",
    word: "같이 가면 멀리 가요.",
    action: "오랜만에 친구에게 먼저 연락하기",
  },
  겁재: {
    title: "승부욕이 불타는 날",
    scores: [72, 72, 60, 76],
    total: "에너지가 넘치고 경쟁심이 살아나는 날이에요. 그 힘을 운동이나 밀린 일에 쓰면 성과가 확실해요.",
    love: "적극적인 표현이 매력으로 보여요. 다만 이기려는 대화보다는 들어 주는 대화가 좋아요.",
    money: "기분 따라 지갑이 열리기 쉬운 날이에요. 장바구니에 담아 두고 하루만 고민해 보세요.",
    work: "추진력이 좋아 미뤄 둔 일을 끝내기 좋아요. 혼자 다 하려 하지 말고 나눠서 맡겨요.",
    word: "경쟁 상대는 어제의 나예요.",
    action: "땀 흘리는 운동 20분",
  },
  식신: {
    title: "여유와 즐거움이 찾아오는 날",
    scores: [88, 82, 76, 80],
    total: "마음이 넉넉해지고 표현력이 좋아지는 날이에요. 맛있는 걸 먹고, 하고 싶은 말을 편하게 해도 잘 전달돼요.",
    love: "함께 맛집에 가거나 소소한 데이트를 하기 딱 좋아요. 다정한 말 한마디가 크게 와닿아요.",
    money: "작은 즐거움에 쓰는 돈은 아깝지 않은 날이에요. 취미나 재능이 수입으로 이어질 아이디어도 떠올라요.",
    work: "창의적인 아이디어가 술술 나와요. 기획이나 글쓰기, 발표에 유리해요.",
    word: "즐기는 사람이 결국 잘해요.",
    action: "좋아하는 음식으로 나에게 선물하기",
  },
  상관: {
    title: "말솜씨와 재치가 빛나는 날",
    scores: [76, 74, 72, 72],
    total: "머리가 빠르게 돌아가고 재치가 넘치는 날이에요. 번뜩이는 생각은 바로 메모해 두면 나중에 보물이 돼요.",
    love: "유머로 분위기를 띄우기 좋아요. 농담이 지나치지 않게 한 번만 더 생각하고 말해요.",
    money: "새로운 방법을 떠올리기 좋은 날이에요. 다만 결정은 하루 묵혀 두면 더 좋은 선택이 돼요.",
    work: "기존 방식을 개선할 아이디어가 많아요. 윗사람에게는 부드러운 말투로 제안해 보세요.",
    word: "좋은 말은 부드럽게 해야 멀리 가요.",
    action: "떠오른 아이디어 세 줄 메모하기",
  },
  편재: {
    title: "기회가 활발하게 움직이는 날",
    scores: [84, 80, 86, 78],
    total: "사람과 기회가 활발하게 오가는 날이에요. 새로운 만남이나 제안에 마음을 열어 두면 뜻밖의 수확이 있어요.",
    love: "사교 운이 좋아요. 모임에서 눈에 띄기 쉽고, 연인과는 새로운 곳에 가 보면 설렘이 살아나요.",
    money: "돈의 흐름이 활발해요. 들어오는 만큼 나가기도 쉬우니 기록만 잘해 두면 좋아요.",
    work: "영업, 협상, 외부 미팅에 유리해요. 발이 넓어질수록 기회도 커져요.",
    word: "움직이는 만큼 기회가 와요.",
    action: "안 가 본 길로 산책하기",
  },
  정재: {
    title: "실속을 챙기는 알찬 날",
    scores: [82, 78, 88, 82],
    total: "꼼꼼하게 챙긴 만큼 결과가 돌아오는 날이에요. 큰 한 방보다 차곡차곡 쌓는 쪽이 훨씬 잘 풀려요.",
    love: "안정적이고 믿음 가는 모습이 매력이에요. 약속을 잘 지키는 것만으로도 점수가 올라가요.",
    money: "가계부나 저축 계획을 세우기 좋은 날이에요. 새는 돈을 찾아 막으면 기분까지 좋아져요.",
    work: "정리, 마감, 숫자 확인 같은 꼼꼼한 일이 잘 맞아요. 성실함이 인정받아요.",
    word: "작은 것이 모여 큰 것이 돼요.",
    action: "구독 서비스 하나 정리하기",
  },
  편관: {
    title: "책임감이 나를 키우는 날",
    scores: [68, 66, 68, 78],
    total: "해야 할 일이 몰려와 조금 바쁘게 느껴질 수 있는 날이에요. 하나씩 해결하다 보면 저녁엔 뿌듯함이 남아요.",
    love: "피곤하면 말이 짧아지기 쉬워요. '오늘 좀 바빴어'라고 먼저 말해 주면 상대도 이해해요.",
    money: "급하게 결정하기보다는 정해 둔 예산 안에서 움직이면 마음이 편해요.",
    work: "어려운 일을 맡을수록 실력이 늘어요. 버거우면 도움을 요청하는 것도 능력이에요.",
    word: "한 번에 하나씩이면 충분해요.",
    action: "할 일 목록에서 가장 쉬운 것부터 지우기",
  },
  정관: {
    title: "인정과 신뢰가 쌓이는 날",
    scores: [86, 80, 76, 90],
    total: "바르게 해 온 일들이 빛을 보는 날이에요. 주변에서 믿고 맡기는 일이 생기고, 칭찬을 들을 일도 있어요.",
    love: "진지하고 믿음직한 모습이 호감을 줘요. 미래 이야기를 나누기 좋은 날이에요.",
    money: "원칙대로 하면 손해 볼 일이 없어요. 계약이나 서류는 꼼꼼히 보면 좋아요.",
    work: "평가, 면접, 발표처럼 공식적인 자리에 강해요. 단정한 차림이 운을 더해 줘요.",
    word: "꾸준함은 결국 보여요.",
    action: "책상 위 깔끔하게 정리하기",
  },
  편인: {
    title: "직감이 예민해지는 날",
    scores: [74, 68, 66, 76],
    total: "생각이 깊어지고 직감이 날카로워지는 날이에요. 북적이는 곳보다 혼자만의 시간에 좋은 답을 찾아요.",
    love: "말보다 마음으로 느끼는 날이에요. 혼자 있고 싶을 땐 솔직하게 말해도 괜찮아요.",
    money: "새로운 투자나 큰 지출보다는 공부와 정보 수집에 쓰기 좋은 날이에요.",
    work: "연구, 분석, 새로운 기술 배우기에 집중력이 좋아요. 다른 사람이 놓친 걸 발견해요.",
    word: "조용한 시간에 답이 있어요.",
    action: "관심 분야 영상이나 책 한 편 보기",
  },
  정인: {
    title: "도움과 칭찬이 찾아오는 날",
    scores: [86, 84, 74, 84],
    total: "주변의 도움과 응원이 자연스럽게 모이는 날이에요. 배우고 받아들이는 자세가 행운을 불러와요.",
    love: "따뜻한 배려를 주고받는 날이에요. 고마운 마음을 표현하면 관계가 한층 깊어져요.",
    money: "어른이나 선배의 조언이 도움이 돼요. 서두르지 않아도 필요한 것이 채워져요.",
    work: "공부, 자격증, 교육에 특히 좋아요. 모르는 건 물어보면 생각보다 쉽게 풀려요.",
    word: "고맙다는 말이 운을 불러요.",
    action: "고마운 사람에게 감사 메시지 보내기",
  },
};

// 내 일지와 오늘 지지의 관계(띠 궁합 관계 재사용)
const BRANCH_MOD = {
  yukhap: { delta: 6, text: "오늘 일진이 내 일지와 육합을 이뤄 사람 복이 더해지는 날이에요." },
  samhap: { delta: 4, text: "오늘 일진이 내 일지와 삼합으로 통해 하는 일에 힘이 실려요." },
  same: { delta: 2, text: "오늘 일진이 내 일지와 같아 익숙하고 편안한 흐름이에요." },
  normal: { delta: 0, text: "" },
  chung: { delta: -6, text: "오늘 일진이 내 일지와 충을 이뤄 변화가 많을 수 있어요. 일정은 여유 있게 잡아요." },
  wonjin: { delta: -4, text: "사소한 말에 마음이 쓰이기 쉬운 날이에요. 한 번 더 웃어 주면 금방 풀려요." },
};

// 날짜 → 1900-01-01부터 지난 일수 (양력, 시간대 무관)
function dayNumber(y, m, d) {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000);
}
function ganzhiIndex(y, m, d) {
  return (((10 + dayNumber(y, m, d)) % 60) + 60) % 60;
}
function ganzhiName(i) {
  return { ko: STEMS[i % 10] + BRANCHES[i % 12], hj: STEMS_HJ[i % 10] + BRANCHES_HJ[i % 12], stem: i % 10, branch: i % 12 };
}

// 한국 시간 기준 오늘(+offset일)
function seoulDate(offsetDays) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date()).split("-").map(Number);
  const t = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + (offsetDays || 0)));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
}

// 십신: 나(일간) 기준으로 상대 천간의 관계
function tenGod(me, other) {
  const em = Math.floor(me / 2), eo = Math.floor(other / 2);
  const samePol = me % 2 === other % 2;
  const rel = (eo - em + 5) % 5; // 0 같음, 1 내가 생함, 2 내가 극함, 3 나를 극함, 4 나를 생함
  return [["비견", "겁재"], ["식신", "상관"], ["편재", "정재"], ["편관", "정관"], ["편인", "정인"]][rel][samePol ? 0 : 1];
}

function todayLabel(gz) {
  return `${gz.ko}(${gz.hj})일 · ${ELEMENT_ADJ[Math.floor(gz.stem / 2)]} ${TTI[gz.branch].name}의 날`;
}

function clampScore(v) { return Math.max(50, Math.min(98, v)); }

// 생일 + 대상 날짜 → 결과
function sajuResult(birth, target) {
  const bi = ganzhiIndex(birth.y, birth.m, birth.d) + (birth.lateNight ? 1 : 0);
  const me = ganzhiName(bi % 60);
  const td = ganzhiName(ganzhiIndex(target.y, target.m, target.d));
  const god = tenGod(me.stem, td.stem);
  const g = TEN_GODS[god];
  const relKey = ttiRelation(me.branch, td.branch);
  const mod = BRANCH_MOD[relKey];
  const seed = dayNumber(target.y, target.m, target.d) * 7 + me.stem * 3;
  const scores = g.scores.map((s, k) => clampScore(s + mod.delta + (((seed + k * 5) % 7) - 3)));
  const supportEl = (Math.floor(me.stem / 2) + 4) % 5; // 나를 생해 주는 오행
  const todayEl = Math.floor(td.stem / 2);
  return {
    me, td, god,
    dayMaster: DAY_MASTER[me.stem],
    meElement: ELEMENTS[Math.floor(me.stem / 2)],
    title: g.title,
    total: [g.total, mod.text].filter(Boolean).join(" "),
    scores,
    love: g.love, money: g.money, work: g.work,
    word: g.word, action: g.action,
    color: ELEMENT_COLORS[supportEl][dayNumber(target.y, target.m, target.d) % 2],
    number: ELEMENT_NUMBERS[todayEl][td.stem % 2],
  };
}
