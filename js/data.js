// 궁합 데이터와 점수 계산 로직 (재미용)

// 띠 순서 = 지지 순서(자축인묘진사오미신유술해). 인덱스 0~11
const TTI = [
  { name: "쥐", emoji: "🐭", trait: "영리하고 눈치 빠른" },
  { name: "소", emoji: "🐮", trait: "성실하고 묵직한" },
  { name: "범", emoji: "🐯", trait: "당당하고 추진력 있는" },
  { name: "토끼", emoji: "🐰", trait: "다정하고 섬세한" },
  { name: "용", emoji: "🐲", trait: "스케일 크고 자신감 넘치는" },
  { name: "뱀", emoji: "🐍", trait: "신중하고 직감이 좋은" },
  { name: "말", emoji: "🐴", trait: "활발하고 자유로운" },
  { name: "양", emoji: "🐑", trait: "온화하고 배려 깊은" },
  { name: "원숭이", emoji: "🐵", trait: "재치 있고 센스 넘치는" },
  { name: "닭", emoji: "🐔", trait: "꼼꼼하고 부지런한" },
  { name: "개", emoji: "🐶", trait: "의리 있고 솔직한" },
  { name: "돼지", emoji: "🐷", trait: "너그럽고 복스러운" },
];

// 2020년 = 쥐띠 기준으로 최근 출생 연도 4개
function ttiYears(i) {
  const years = [];
  for (let y = 1960; y <= 2026; y++) {
    if ((((y - 2020) % 12) + 12) % 12 === i) years.push(y);
  }
  return years.slice(-4);
}

// 띠 관계 판정
const TTI_RELATIONS = {
  yukhap: {
    label: "육합",
    title: "서로를 채워 주는 짝",
    score: 96,
    desc: "전통 궁합에서 '육합'이라 불리는 손꼽히는 조합이에요. 내게 부족한 부분을 상대가 자연스럽게 채워 줘서, 함께 있을수록 편안해지는 사이예요.",
    tip: "서로의 장점을 자주 말로 칭찬해 주면 관계가 더 단단해져요.",
  },
  samhap: {
    label: "삼합",
    title: "같은 방향을 보는 동료",
    score: 92,
    desc: "같은 기운을 나누는 '삼합' 관계예요. 목표와 가치관이 잘 맞아서 함께 무언가를 해 나갈 때 시너지가 커요.",
    tip: "여행, 운동, 저축처럼 둘이 함께하는 작은 목표를 만들어 보세요.",
  },
  same: {
    label: "동띠",
    title: "말하지 않아도 통하는 사이",
    score: 80,
    desc: "같은 띠끼리는 생각하는 방식이 닮아서 말하지 않아도 통하는 부분이 많아요. 다만 닮은 만큼 고집이 부딪칠 때도 있어요.",
    tip: "의견이 갈릴 땐 한 박자 쉬고, 먼저 양보하는 쪽이 이기는 거예요.",
  },
  normal: {
    label: "평합",
    title: "가꿀수록 좋아지는 사이",
    score: null, // 조합마다 68~78
    desc: "특별히 부딪히는 기운 없이 무난하게 어울리는 조합이에요. 어떻게 가꾸느냐에 따라 얼마든지 좋아질 수 있어요.",
    tip: "함께하는 시간을 꾸준히 쌓는 게 가장 좋은 궁합 처방이에요.",
  },
  chung: {
    label: "충",
    title: "부딪히며 끌리는 반전 매력",
    score: 62,
    desc: "전통적으로 '충'이라 불리는, 정반대 기운의 조합이에요. 부딪히는 만큼 서로에게 강하게 끌리는 반전 매력이 있어요.",
    tip: "다름을 틀림으로 보지 않으면, 서로에게 가장 큰 자극이 되는 사이가 될 수 있어요.",
  },
  wonjin: {
    label: "원진",
    title: "오해만 풀면 오래가는 사이",
    score: 58,
    desc: "'원진'이라 불리는, 괜히 서운함이 쌓이기 쉬운 조합이에요. 하지만 작은 오해만 잘 풀면 의외로 오래가는 커플이 많아요.",
    tip: "서운한 건 그때그때, 부드럽게 말하는 습관이 관계의 열쇠예요.",
  },
};

// 원진: 자미, 축오, 인유, 묘신, 진해, 사술
const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];

function ttiRelation(a, b) {
  if (a === b) return "same";
  if ((a + b) % 12 === 1) return "yukhap";      // 자축, 인해, 묘술, 진유, 사신, 오미
  if (a % 4 === b % 4) return "samhap";          // 신자진, 사유축, 인오술, 해묘미
  if (Math.abs(a - b) === 6) return "chung";     // 자오, 축미, 인신, 묘유, 진술, 사해
  if (WONJIN.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "wonjin";
  return "normal";
}

function ttiResult(a, b) {
  const key = ttiRelation(a, b);
  const rel = TTI_RELATIONS[key];
  const score = rel.score !== null ? rel.score : 68 + ((7 * (a + b) + a * b) % 11);
  const A = TTI[a], B = TTI[b];
  const intro = a === b
    ? `${A.trait} ${A.name}띠 두 사람이 만났어요.`
    : `${A.trait} ${A.name}띠와 ${B.trait} ${B.name}띠가 만났어요.`;
  return {
    score,
    badge: rel.label,
    title: rel.title,
    lines: [intro, rel.desc],
    tip: rel.tip,
    heading: `${A.emoji} ${A.name}띠 × ${B.emoji} ${B.name}띠`,
  };
}

// MBTI
const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const MBTI_NICK = {
  INTJ: "큰 그림 설계자", INTP: "호기심 연구가", ENTJ: "타고난 리더", ENTP: "아이디어 뱅크",
  INFJ: "속 깊은 조언자", INFP: "감성 몽상가", ENFJ: "따뜻한 리더", ENFP: "에너지 요정",
  ISTJ: "믿음직한 원칙주의자", ISFJ: "다정한 수호자", ESTJ: "똑부러진 관리자", ESFJ: "분위기 메이커",
  ISTP: "쿨한 해결사", ISFP: "섬세한 예술가", ESTP: "거침없는 도전가", ESFP: "무대 체질 엔터테이너",
};

// 각 지표별: [같을 때 점수, 다를 때 점수], 같을 때 문구(글자별), 다를 때 문구
const MBTI_DIMS = [
  {
    name: "에너지 방향 (E/I)", pos: 0, same: 5, diff: 10,
    sameText: {
      E: "둘 다 외향형이라 함께 있으면 에너지가 넘쳐요. 약속이 끊이지 않는 활동적인 조합!",
      I: "둘 다 내향형이라 조용히 함께 보내는 시간이 가장 편안해요.",
    },
    diffText: "외향과 내향이 만나 한 명은 세상을 넓혀 주고, 한 명은 쉼표가 되어 줘요.",
  },
  {
    name: "인식 방식 (S/N)", pos: 1, same: 20, diff: 0,
    sameText: {
      S: "현실 감각이 비슷해서 일상의 리듬이 잘 맞아요.",
      N: "상상력과 대화 주제가 잘 통해서 이야기가 끝없이 이어져요.",
    },
    diffText: "현실형과 상상형이 만나 대화 주파수가 가끔 엇갈려요. 대신 서로의 관점이 새로운 시야가 돼요.",
  },
  {
    name: "판단 방식 (T/F)", pos: 2, same: 6, diff: 8,
    sameText: {
      T: "둘 다 논리적이라 문제가 생겨도 깔끔하게 해결해요. 가끔은 감정 표현도 잊지 마세요.",
      F: "공감 능력이 뛰어난 둘이라 서로의 마음을 잘 알아줘요.",
    },
    diffText: "이성과 감성이 균형을 이뤄 서로 부족한 부분을 채워 줘요.",
  },
  {
    name: "생활 방식 (J/P)", pos: 3, same: 4, diff: 10,
    sameText: {
      J: "계획형끼리라 약속과 일정이 척척 맞아요.",
      P: "즉흥형끼리라 갑자기 떠나는 여행도 즐거워요. 중요한 일정만 함께 챙겨요.",
    },
    diffText: "계획형과 즉흥형이 만나 안정감과 설렘을 동시에 줘요.",
  },
];

function mbtiResult(a, b) {
  let score = 50;
  const lines = [];
  for (const d of MBTI_DIMS) {
    const ca = a[d.pos], cb = b[d.pos];
    if (ca === cb) {
      score += d.same;
      lines.push(d.sameText[ca]);
    } else {
      score += d.diff;
      lines.push(d.diffText);
    }
  }
  const title = a === b
    ? "거울처럼 닮은 사이"
    : a[1] !== b[1]
      ? "서로의 세상을 넓혀 주는 사이"
      : a[1] === "N" ? "생각이 척척 통하는 사이" : "일상의 리듬이 잘 맞는 사이";
  return {
    score,
    badge: a === b ? "동일 유형" : "MBTI 케미",
    title,
    lines,
    tip: score >= 82
      ? "지금처럼 서로의 다름과 닮음을 즐기면 충분해요."
      : "다른 부분은 '나에게 없는 장점'으로 보면 케미가 훨씬 좋아져요.",
    heading: `${a} × ${b}`,
    sub: `${MBTI_NICK[a]} × ${MBTI_NICK[b]}`,
  };
}

function gradeOf(score) {
  if (score >= 90) return { label: "천생연분 💞", cls: "g1" };
  if (score >= 82) return { label: "찰떡 케미 ✨", cls: "g2" };
  if (score >= 74) return { label: "편안한 사이 😊", cls: "g3" };
  if (score >= 66) return { label: "밀당 케미 🔥", cls: "g4" };
  return { label: "반전 매력 🌱", cls: "g5" };
}
