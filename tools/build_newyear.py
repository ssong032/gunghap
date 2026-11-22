"""띠별 신년운세 정적 페이지 생성기.

  python tools/build_newyear.py 2027

출력: <연도>/index.html (띠별 순위 모음) + <연도>/<영문띠>.html 12개.
계산 기준은 사이트(js/data.js ttiRelation, js/content.js helperElement)와 인스타 카드(fortune-ig-cards tool/iljin.py)와 같다.
  - 띠(연지)와 그해 세운 지지의 관계: 육합 · 삼합 · 같은 띠 · 평 · 충 · 원진
  - 그해 세운 천간 오행이 띠 오행에 주는 작용: 비겁 · 식상 · 재성 · 관성 · 인성
  - 좋은 달/조심할 달: 그해 월건 지지와 띠의 육합·삼합 / 충·원진 (월은 절기 기준)
  - 삼재: 신자진→인묘진년, 사유축→해자축년, 인오술→신유술년, 해묘미→사오미년 (민간 풍속, 참고용)
"""
import html
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ny_style import STYLE, NORMAL_BY_SIGN  # noqa: E402

BASE = "https://ssong032.github.io/gunghap/"  # 자체 도메인으로 옮기면 여기만 바꾸고 다시 생성

STEMS = "갑을병정무기경신임계"
STEMS_HJ = "甲乙丙丁戊己庚辛壬癸"
BR = "자축인묘진사오미신유술해"
BR_HJ = "子丑寅卯辰巳午未申酉戌亥"
EL = ["목", "화", "토", "금", "수"]
EL_HJ = ["木", "火", "土", "金", "水"]
EL_ADJ = ["푸른", "붉은", "노란", "하얀", "검은"]
BR_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]  # 지지 오행
TTI = [("쥐", "🐭", "rat"), ("소", "🐮", "ox"), ("범", "🐯", "tiger"), ("토끼", "🐰", "rabbit"), ("용", "🐲", "dragon"),
       ("뱀", "🐍", "snake"), ("말", "🐴", "horse"), ("양", "🐑", "sheep"), ("원숭이", "🐵", "monkey"),
       ("닭", "🐔", "rooster"), ("개", "🐶", "dog"), ("돼지", "🐷", "pig")]
TRAIT = ["영리하고 눈치 빠른", "성실하고 묵직한", "당당하고 추진력 있는", "다정하고 섬세한", "스케일 크고 자신감 넘치는",
         "신중하고 직감이 좋은", "활발하고 자유로운", "온화하고 배려 깊은", "재치 있고 센스 넘치는", "꼼꼼하고 부지런한",
         "의리 있고 솔직한", "너그럽고 복스러운"]
COLORS = [["초록", "민트"], ["빨강", "코랄"], ["노랑", "베이지"], ["흰색", "실버"], ["검정", "남색"]]
NUMBERS = [[3, 8], [2, 7], [5, 10], [4, 9], [1, 6]]
DIRS = ["동쪽", "남쪽", "중앙 (집과 가까운 곳)", "서쪽", "북쪽"]
FOODS = ["신맛 · 초록 채소, 매실차, 귤", "쓴맛 · 녹차, 쑥, 씀바귀", "단맛 · 고구마, 단호박, 꿀차", "매운맛 · 무, 배, 생강차, 도라지", "짠맛 · 미역국, 검은콩, 김"]
WONJIN = [{0, 7}, {1, 6}, {2, 9}, {3, 8}, {4, 11}, {5, 10}]
MONTH_OF = {2: "2월", 3: "3월", 4: "4월", 5: "5월", 6: "6월", 7: "7월", 8: "8월", 9: "9월", 10: "10월", 11: "11월", 0: "12월", 1: "다음 해 1월"}


def jong(w):
    c = ord(w[-1]) - 0xAC00
    return 0 <= c <= 11171 and c % 28 != 0


def josa(w, a, b):
    return a if jong(w) else b


def relation(a, b):
    if a == b:
        return "same"
    if (a + b) % 12 == 1:
        return "yukhap"
    if a % 4 == b % 4:
        return "samhap"
    if abs(a - b) == 6:
        return "chung"
    if {a, b} in WONJIN:
        return "wonjin"
    return "normal"


def element_kind(year_el, my_el):
    """세운 천간 오행이 띠 오행(나)에게 무엇인지."""
    d = (year_el - my_el) % 5
    return ["비겁", "식상", "재성", "관성", "인성"][d]


def helper_el(my_el, kind):
    return (my_el + {"비겁": 1, "식상": 4, "재성": 0, "관성": 4, "인성": 1}[kind]) % 5


ELK = {
    "비겁": dict(adj=0, total="올해 천간의 기운이 띠와 같은 오행이라 자신감과 추진력이 커져요. 독립이나 새 출발처럼 내 힘으로 해내는 일에 힘이 실려요.",
                love="주도적으로 다가갈수록 인연이 가까워져요. 연인과는 서로의 시간을 존중할수록 단단해져요.",
                job="독립적인 업무, 창업, 프리랜서 활동과 기운이 잘 맞아요. 동료와 경쟁하기보다 협력을 택하면 더 멀리 가요.",
                money="들어오는 만큼 나가는 기운도 강해요. 공동 투자나 보증은 신중하게 판단하세요.",
                health="활동량이 늘어나는 해라 체력 관리가 곧 운 관리예요. 무리한 운동보다 꾸준한 운동이 좋아요.",
                act="혼자보다 함께하는 운동이나 모임", d=(0, -3, 0, 3)),
    "식상": dict(adj=1, total="띠의 기운이 올해 천간을 생해 주는 흐름이라 표현력과 재능이 밖으로 드러나는 해예요. 미뤄 둔 일을 시작하기 좋아요.",
                love="매력이 자연스럽게 드러나 호감을 사기 쉬워요. 솔직한 표현은 좋지만 말의 온도는 따뜻하게 지켜 주세요.",
                job="기획, 콘텐츠, 영업처럼 나를 보여 주는 일에서 성과가 나요. 새 분야 도전이나 이직도 고려해 볼 만해요.",
                money="재능과 아이디어가 수입으로 이어질 수 있어요. 부업이나 취미 판매를 작게 시작해 보세요.",
                health="에너지를 많이 쓰는 해라 쉬는 시간을 일정에 먼저 넣어 두세요.",
                act="글쓰기, SNS, 창작 같은 표현하는 활동", d=(3, 3, 1, -2)),
    "재성": dict(adj=2, total="띠의 기운이 올해 천간을 다스리는 흐름이라 재물과 활동 운이 살아나는 해예요. 움직이는 만큼 기회가 따라와요.",
                love="새로운 만남이 많아지고 인기가 오르는 해예요. 마음에 드는 사람에게는 먼저 연락해 보세요.",
                job="성과가 숫자로 드러나는 일, 영업이나 사업에 유리해요.",
                money="돈의 흐름이 활발한 해예요. 들어온 돈은 목적별 통장으로 나눠 지키세요.",
                health="바쁘게 다니느라 식사와 수면이 흐트러지기 쉬워요. 기본 생활 리듬을 지키세요.",
                act="새로운 사람 만나기, 가까운 여행", d=(4, 2, 6, -2)),
    "관성": dict(adj=-2, total="올해 천간이 띠의 기운을 다잡는 흐름이라 책임과 역할이 커지는 해예요. 부담도 있지만 그만큼 인정받을 기회예요.",
                love="진지한 인연이 찾아오기 쉬워요. 결혼이나 미래 약속을 이야기하기 좋은 해예요.",
                job="승진, 합격, 직책처럼 공식적인 변화가 생기기 쉬워요. 원칙과 꾸준함이 무기예요.",
                money="안정적인 수입 흐름을 만들기 좋아요. 무리한 투자보다 꾸준한 저축이 잘 맞아요.",
                health="긴장과 스트레스가 쌓이기 쉬워요. 어깨와 목을 자주 풀어 주고 충분히 쉬세요.",
                act="규칙적인 생활, 자격증·업무 실력 관리", d=(2, 6, 0, -4)),
    "인성": dict(adj=3, total="올해 천간이 띠의 기운을 도와주는 흐름이라 주변의 도움과 배움 운이 좋은 해예요.",
                love="소개나 지인을 통한 인연이 좋아요. 편안하고 따뜻한 관계가 깊어져요.",
                job="시험, 자격증, 공부에 특히 좋은 해예요. 윗사람의 도움으로 기회가 열려요.",
                money="문서, 계약, 집과 관련된 일이 순조롭기 쉬워요. 급하게 쫓기보다 차근차근 모으세요.",
                health="회복력이 좋은 해예요. 규칙적인 생활만 지켜도 컨디션이 오래가요.",
                act="공부, 독서, 배우고 싶던 강의", d=(1, 3, 0, 4)),
}

REL = {
    "yukhap": dict(tag="육합", score=92, tier="good",
                   total="{yb} {tb} 육합을 이뤄, 열두 띠 가운데 손꼽히게 사람 복이 좋은 해예요. 귀인을 만나고 협력으로 일이 풀려요.",
                   love="인연운이 특히 좋아요. 싱글이라면 소개를 마다하지 말고, 연인이 있다면 한 단계 나아가기 좋은 해예요.",
                   job="협업과 추천으로 기회가 찾아와요. 함께 일하는 사람이 곧 행운이에요.",
                   money="사람을 통해 돈이 들어오는 흐름이에요. 좋은 정보를 나누는 관계를 소중히 하세요.",
                   caution=["좋은 흐름에 방심하고 과속하기", "거절을 못 해서 일이 몰리기", "지키기 어려운 약속"],
                   people="올해 새로 알게 되는 사람, 협업 파트너"),
    "samhap": dict(tag="삼합", score=88, tier="good",
                   total="{yb} {tb} 삼합으로 통해, 하는 일에 힘이 실리고 같은 방향을 보는 사람이 모이는 해예요.",
                   love="가치관이 맞는 사람과 인연이 닿기 쉬워요. 함께하는 목표가 있으면 관계가 깊어져요.",
                   job="팀으로 움직이는 일에서 성과가 나요. 긴 호흡의 프로젝트를 시작하기 좋아요.",
                   money="꾸준히 모은 것이 결실을 맺어요. 함께 공부하는 재테크 모임도 도움이 돼요.",
                   caution=["혼자 결정하고 통보하기", "무리한 확장", "작은 약속 어기기"],
                   people="뜻이 맞는 동료, 오래 알고 지낸 친구"),
    "same": dict(tag="내 띠의 해", score=80, tier="mid",
                 total="올해가 바로 {t}띠의 해예요. 익숙한 기운 속에서 나다움을 찾기 좋지만, 같은 기운이 겹쳐 고집이 세지기 쉬워요.",
                 love="나와 닮은 사람에게 끌리는 해예요. 서로 다른 점을 인정하면 관계가 오래가요.",
                 job="새 분야보다 하던 일을 깊게 파고들 때 실력이 빛나요.",
                 money="익숙한 방식이 가장 안전해요. 잘 모르는 투자는 쉬어 가세요.",
                 caution=["내 생각만 고집하기", "같은 실수 반복하기", "변화를 무조건 피하기"],
                 people="나와 다른 시각을 가진 친구"),
    "normal": dict(tag="무난한 해", score=76, tier="mid",
                   total="{yb} {tb} 특별히 부딪히는 관계가 아니라, 내가 가꾸는 만큼 결과가 따라오는 해예요.",
                   love="자연스러운 흐름에 맡기되, 마음이 가는 사람에게는 먼저 연락해 보세요.",
                   job="계획을 세워 한 단계씩 밟아 가면 연말에 뚜렷한 성장이 보여요.",
                   money="수입과 지출의 균형을 잡기 좋은 해예요. 가계부 습관을 만들어 보세요.",
                   caution=["계획 없이 흘러가기", "남의 말에 휩쓸린 결정", "작은 지출 방치하기"],
                   people="꾸준히 응원해 주는 가족과 친구"),
    "chung": dict(tag="충 · 변화의 해", score=68, tier="care",
                  total="{yb} {tb} 충을 이뤄 이사, 이직, 환경 변화처럼 움직임이 많은 해예요. 변화를 기회로 삼으면 오히려 크게 도약해요.",
                  love="관계에 변화가 생기기 쉬워요. 감정적인 결정보다 대화가 먼저예요.",
                  job="부서 이동, 이직, 새 업무처럼 변화가 찾아와요. 준비된 사람에게는 기회예요.",
                  money="지출 변동이 커질 수 있어요. 비상금을 먼저 만들어 두면 든든해요.",
                  caution=["충동적인 이직·이사 결정", "감정 섞인 말다툼", "큰돈 오가는 거래 서두르기"],
                  people="차분하게 조언해 주는 선배"),
    "wonjin": dict(tag="원진 · 소통의 해", score=66, tier="care",
                   total="{yb} {tb} 원진 관계라, 사소한 오해와 서운함이 쌓이기 쉬운 해예요. 마음을 표현하는 습관만 들이면 무난하게 지나가요.",
                   love="말하지 않으면 모르는 해예요. 서운한 건 그때그때 부드럽게 말해 주세요.",
                   job="소통 실수만 줄이면 실력을 인정받아요. 중요한 내용은 글로 남겨 두세요.",
                   money="남과 얽힌 돈거래는 줄이는 게 좋아요. 내 계획대로 차곡차곡 모으세요.",
                   caution=["오해를 쌓아 두기", "돈 빌려주기", "확인 없이 넘어가기"],
                   people="속마음을 편하게 털어놓을 수 있는 친구"),
}

AGE = {  # (최소 나이, 이름, {tier: 문장})
    "list": [
        (70, "70대 이상", {"good": "가족 행사와 모임에서 웃을 일이 많아요. 가벼운 산책을 생활로 만들면 더욱 좋아요.",
                          "mid": "익숙한 일상 속 작은 즐거움이 복이 되는 해예요. 정기 검진은 미루지 마세요.",
                          "care": "먼 이동이나 큰 결정은 가족과 의논하세요. 몸의 신호에 귀 기울이면 편안한 해예요."}),
        (60, "60대", {"good": "취미나 새로운 배움에서 즐거움을 찾는 해예요. 오랜 인연과 다시 연락이 닿기도 해요.",
                     "mid": "모아 둔 것을 지키며 여유를 즐기기 좋은 해예요.",
                     "care": "자금은 보수적으로 운용하고 건강은 꼼꼼히 챙기면 무난해요."}),
        (50, "50대", {"good": "그동안 쌓은 경험이 인정받는 해예요. 제2의 커리어를 준비하기에도 좋아요.",
                     "mid": "가정과 일의 균형을 잡기 좋은 해예요.",
                     "care": "변화가 생겨도 서두르지 말고 한 템포 쉬어 판단하세요."}),
        (40, "40대", {"good": "커리어와 재테크 모두 한 단계 올라설 기회가 와요.",
                     "mid": "꾸준함이 성과로 이어지는 해예요. 가족과의 시간도 챙겨 주세요.",
                     "care": "책임이 늘어 바쁜 해예요. 우선순위를 정하면 한결 가벼워져요."}),
        (30, "30대", {"good": "결혼, 승진, 이직 같은 인생의 큰 결정에 힘이 실려요.",
                     "mid": "실력을 다지고 기반을 만드는 해예요.",
                     "care": "급한 결정보다 준비 기간을 두면 변화가 기회가 돼요."}),
        (18, "청년(18~29세)", {"good": "취업, 연애, 새로운 도전 모두 반가운 소식이 기대돼요.",
                     "mid": "작은 경험을 많이 쌓을수록 내년이 달라져요.",
                     "care": "주변 말에 흔들리기보다 내 속도로 가면 돼요."}),
        (10, "10대", {"good": "공부에 집중력이 붙고 좋은 친구를 만나는 해예요.",
                     "mid": "꾸준한 생활 습관이 실력이 되는 해예요.",
                     "care": "환경 변화가 있을 수 있어요. 마음을 털어놓을 어른이 곁에 있으면 든든해요."}),
        (0, "어린이 (부모님 참고)", {"good": "새로운 친구와 활동에서 즐거움이 커지는 해예요.",
                                 "mid": "규칙적인 생활 리듬이 성장의 힘이 돼요.",
                                 "care": "새 환경에 적응할 시간이 필요할 수 있어요. 따뜻한 격려가 가장 큰 힘이에요."}),
    ]
}


# 띠 성향으로 보는 포인트: (강점, 주의할 습관, 올해 활용법)
TIPS = [
    ("정보를 빨리 읽고 기회를 먼저 잡는 감각이 강점이에요.", "여러 일을 한꺼번에 벌이면 힘이 흩어지기 쉬워요.", "올해는 가장 자신 있는 한 가지에 집중하면 결과가 선명해져요."),
    ("한번 맡은 일은 끝까지 해내는 끈기가 강점이에요.", "변화를 늦게 받아들여 기회를 놓칠 때가 있어요.", "올해는 익숙한 방식에 작은 변화 하나를 더해 보세요."),
    ("앞장서서 길을 여는 추진력이 강점이에요.", "속도가 빨라 주변을 놓치기 쉬워요.", "올해는 함께 가는 사람의 속도를 한 번씩 확인해 주세요."),
    ("분위기를 부드럽게 만드는 섬세함이 강점이에요.", "싫은 소리를 못 해 혼자 끙끙 앓기 쉬워요.", "올해는 내 마음을 솔직하게 말하는 연습이 운을 키워요."),
    ("큰 그림을 그리고 사람을 이끄는 힘이 강점이에요.", "자존심 때문에 도움을 청하지 못할 때가 있어요.", "올해는 '함께 하자'는 말을 먼저 꺼내 보세요."),
    ("상황을 꿰뚫어 보는 직감과 신중함이 강점이에요.", "생각이 길어져 실행이 늦어지기 쉬워요.", "올해는 결정 기한을 스스로 정해 두면 좋아요."),
    ("어디서든 활력을 불어넣는 에너지가 강점이에요.", "흥미가 식으면 마무리가 약해지기 쉬워요.", "올해는 시작한 일의 끝을 확인하는 습관이 큰 차이를 만들어요."),
    ("사람을 편안하게 해 주는 배려심이 강점이에요.", "남을 챙기느라 내 몫을 놓치기 쉬워요.", "올해는 나를 먼저 챙기는 시간을 일정에 넣어 두세요."),
    ("재치와 순발력으로 문제를 푸는 능력이 강점이에요.", "쉽게 지루해져 꾸준함이 흔들릴 때가 있어요.", "올해는 재미를 붙일 수 있는 루틴 하나를 만들어 보세요."),
    ("꼼꼼하게 챙기고 부지런히 움직이는 성실함이 강점이에요.", "완벽을 추구하다 스스로 지치기 쉬워요.", "올해는 80점이면 충분하다는 마음이 오히려 결과를 키워요."),
    ("의리와 솔직함으로 신뢰를 얻는 것이 강점이에요.", "옳고 그름을 너무 분명히 가르다 부딪히기 쉬워요.", "올해는 한 번 더 들어 주는 여유가 사람을 모아요."),
    ("너그럽고 복을 나누는 마음이 강점이에요.", "좋은 게 좋은 거라며 결정을 미루기 쉬워요.", "올해는 중요한 일일수록 날짜를 정해 마무리해 보세요."),
]


def tag_phrase(tag):
    return tag if tag.endswith("해") else f"{tag}의 해"


def clamp(v):
    return max(50, min(98, v))


def year_info(Y):
    i = (Y - 4) % 60
    return dict(stem=i % 10, branch=i % 12, ko=STEMS[i % 10] + BR[i % 12], hj=STEMS_HJ[i % 10] + BR_HJ[i % 12])


def months(Y):
    """그해 입춘(인월)부터 다음 해 소한(축월)까지 12개월: (표시 월, 월건 한글, 지지)"""
    ys = year_info(Y)["stem"]
    first = ((ys % 5) * 2 + 2) % 10
    out = []
    for k in range(12):
        st, br = (first + k) % 10, (2 + k) % 12
        out.append((MONTH_OF[br], STEMS[st] + BR[br], br))
    return out


def samjae(b, yb):
    start = (2 - 3 * (b % 4)) % 12
    return {start: "들삼재", (start + 1) % 12: "눌삼재", (start + 2) % 12: "날삼재"}.get(yb)


def sign(Y, b):
    yi = year_info(Y)
    yb = yi["branch"]
    t = TTI[b][0]
    rel = relation(b, yb)
    R = dict(REL[rel])
    if rel == "normal" and b in NORMAL_BY_SIGN:
        R["love"], R["job"], R["money"], R["caution"] = NORMAL_BY_SIGN[b]
    kind = element_kind(yi["stem"] // 2, BR_EL[b])
    K = ELK[kind]
    he = helper_el(BR_EL[b], kind)
    ybw = f"올해의 지지 {BR[yb]}({BR_HJ[yb]}){josa(BR[yb], '과', '와')}"
    tbw = f"{t}띠의 {BR[b]}({BR_HJ[b]}){josa(BR[b], '이', '가')}"
    total_rel = R["total"].format(yb=ybw, tb=tbw, t=t)
    score = R["score"] + K["adj"]
    dl, dj, dm, dh = K["d"]
    seed = (Y * 7 + b * 13) % 5 - 2
    scores = dict(total=clamp(score), love=clamp(score + dl + seed), job=clamp(score + dj - seed),
                  money=clamp(score + dm + (seed // 2)), health=clamp(score + dh))
    good, care = [], []
    for label, gz, mb in months(Y):
        r = relation(b, mb)
        if r in ("yukhap", "samhap"):
            good.append(f"{label}({gz}월)")
        elif r in ("chung", "wonjin"):
            care.append(f"{label}({gz}월)")
    years = [y for y in range(Y - 78, Y) if (y - 4) % 12 == b]
    ages = []
    for y in years:
        age = Y - y
        grp = next(g for g in AGE["list"] if age >= g[0])
        ages.append((y, age, grp[1], grp[2][R["tier"]]))
    return dict(b=b, t=t, emoji=TTI[b][1], slug=TTI[b][2], rel=rel, R=R, kind=kind, K=K, he=he,
                total=f"{TRAIT[b]} {t}띠에게 {Y}년은 '{tag_phrase(R['tag'])}'예요. {total_rel} {K['total']}",
                scores=scores, good=good, care=care, ages=ages, samjae=samjae(b, yb), years=years)


def esc(s):
    return html.escape(str(s))


HEAD = """<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{base}og.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <header class="site">
    <div class="wrap">
      <a class="logo" href="../">찰떡<span>궁합</span></a>
      <nav class="top"><a href="./">{Y} 띠별 운세</a><a href="../guide.html">운세 보는 법</a></nav>
    </div>
  </header>
  <main class="wrap">
"""

FOOT = """  </main>
  <footer class="site">
    <a href="../">오늘의 사주 · 궁합</a>
    <a href="../guide.html">운세 보는 법 · FAQ</a>
    <a href="../about.html">소개 · 문의</a>
    <a href="../privacy.html">개인정보처리방침</a>
    <p>© 2026 찰떡궁합. 모든 결과는 재미를 위한 참고용이에요.</p>
  </footer>
</body>
</html>
"""


def bar(name, v):
    return (f'<div class="bar"><span>{name}</span><div class="meter"><div style="width:{v}%"></div></div><b>{v}</b></div>')


def page(Y, s, all_signs, rank):
    yi = year_info(Y)
    t, R, K = s["t"], s["R"], s["K"]
    yrs = "·".join(str(y)[2:] for y in s["years"])
    title = f"{Y}년 {t}띠 운세 · {yi['ko']}년 신년운세 ({yrs}년생) - 찰떡궁합"
    desc = (f"{Y}년 {yi['ko']}년 {t}띠 신년운세. '{tag_phrase(R['tag'])}'인 {t}띠의 총운과 연애운·취업운·금전운·건강운, "
            f"출생연도별 운세, 좋은 달과 조심할 달까지 무료로 정리했어요.")
    url = f"{BASE}{Y}/{s['slug']}.html"
    out = [HEAD.format(title=esc(title), desc=esc(desc), url=url, base=BASE, Y=Y)]
    out.append(f'''    <section class="hero ny-hero">
      <p class="crumb"><a href="./">{Y} 띠별 운세</a> › {t}띠</p>
      <div class="ny-emoji">{s["emoji"]}</div>
      <h1>{Y}년 {t}띠 운세</h1>
      <p>{yi["ko"]}({yi["hj"]})년 · {EL_ADJ[yi["stem"] // 2]} {TTI[yi["branch"]][0]}의 해 · {", ".join(str(y) for y in s["years"])}년생</p>
    </section>
    <section class="card">
      <div class="scorebox">
        <div class="score"><span>{s["scores"]["total"]}</span><small>점</small></div>
        <div class="meter"><div style="width:{s["scores"]["total"]}%"></div></div>
        <p class="ny-tags"><span class="badge">{esc(R["tag"])}</span> <span class="badge">올해 천간: {s["kind"]}</span>{' <span class="badge">' + s["samjae"] + "</span>" if s["samjae"] else ""} <span class="badge">열두 띠 중 {rank}위</span></p>
      </div>
      <p>{esc(s["total"])}</p>
      <div class="bars">{bar("총운", s["scores"]["total"])}{bar("연애운", s["scores"]["love"])}{bar("취업·직장운", s["scores"]["job"])}{bar("금전운", s["scores"]["money"])}{bar("건강운", s["scores"]["health"])}</div>
''')
    if s["samjae"]:
        out.append(f'      <p class="note">※ {s["samjae"]}: 민간에서 전해 오는 삼재 풍속으로 보면 {Y}년은 {t}띠의 {s["samjae"]}예요. '
                   f'{"삼재가 마무리되는 해라, 정리하고 마무리를 잘하는 해로 가볍게 받아들이면 돼요." if s["samjae"] == "날삼재" else "과학적 근거가 있는 것은 아니니 조심하는 마음가짐 정도로만 참고하세요."}</p>\n')
    out.append("    </section>\n")
    st = STYLE[s["b"]]
    parts = [("💗 연애운", "love", R["love"], K["love"] + " " + st[0]), ("💼 취업·직장운", "job", R["job"], K["job"] + " " + st[1]),
             ("💰 금전운", "money", R["money"], K["money"] + " " + st[2])]
    out.append('    <section class="card">\n')
    for title_, key, a, b in parts:
        out.append(f'      <div class="part"><h3><span>{title_}</span><b>{s["scores"][key]}점</b></h3><p>{esc(a)} {esc(b)}</p></div>\n')
    myel = BR_EL[s["b"]]
    organ = ["간과 눈", "심장", "비위(비장과 위)", "폐와 호흡기", "신장(콩팥)"][myel]
    out.append(f'      <div class="part"><h3><span>🌿 건강운</span><b>{s["scores"]["health"]}점</b></h3><p>{esc(K["health"])} {esc(st[3])} '
               f'{t}띠의 오행인 {EL[myel]}({EL_HJ[myel]}){josa(EL[myel], "은", "는")} 전통적으로 {organ}에 대응한다고 봐요.</p>'
               f'<p class="note">※ 전통 오행에 따른 생활 습관 팁이며 의학적 진단이 아니에요. 몸이 불편하면 꼭 전문의와 상담하세요.</p></div>\n')
    out.append("    </section>\n")
    tp = TIPS[s["b"]]
    out.append(f'''    <section class="card"><h2 class="ny-h2">{t}띠 성향으로 보는 {Y}년 포인트</h2>
      <ul class="ny-tips"><li><b>강점</b>{esc(tp[0])}</li><li><b>주의할 습관</b>{esc(tp[1])}</li><li><b>{Y}년 활용법</b>{esc(tp[2])}</li></ul>
    </section>
''')
    # 출생연도별
    out.append(f'    <section class="card"><h2 class="ny-h2">출생연도별 {Y}년 {t}띠 운세</h2><ul class="ny-ages">\n')
    for y, age, grp, line in s["ages"]:
        out.append(f'      <li><b>{y}년생</b> <span>{grp} · {Y}년에 만 {age}세 무렵</span><p>{esc(line)}</p></li>\n')
    out.append('    </ul><p class="note">※ 띠는 입춘(2월 4일 무렵)을 기준으로 바뀌어요. 1월~2월 초에 태어났다면 앞 띠일 수 있어요.</p></section>\n')
    # 좋은 달 · 조심할 달
    out.append(f'''    <section class="card"><h2 class="ny-h2">좋은 달 · 조심할 달</h2>
      <p><b>🍀 힘이 실리는 달</b><br>{", ".join(s["good"]) or "특별히 튀는 달 없이 고르게 흘러가요."}</p>
      <p><b>🌙 쉬어 가는 달</b><br>{", ".join(s["care"]) or "크게 조심할 달 없이 무난해요."}</p>
      <p class="note">달은 1일이 아니라 절기(매달 4~8일 무렵)에 바뀌어요. 그달의 지지가 {t}띠와 육합·삼합이면 힘이 실리는 달, 충·원진이면 쉬어 가는 달로 봤어요.</p>
    </section>
''')
    # 조심할 것 · 가까이할 것
    he = s["he"]
    out.append(f'''    <section class="card">
      <div class="box caution"><p class="rtitle">⚠️ {Y}년에 조심할 것</p><ul>{"".join(f"<li>{esc(c)}</li>" for c in R["caution"])}</ul></div>
      <div class="box near"><p class="rtitle">🍀 가까이하면 좋은 것</p><div class="neargrid">
        <div><span>사람</span><b>{esc(R["people"])}, {esc(st[4])}</b></div><div><span>행동</span><b>{esc(K["act"])}, {esc(st[5])}</b></div>
        <div><span>색</span><b>{" · ".join(COLORS[he])}</b></div><div><span>방향</span><b>{DIRS[he]}</b></div>
        <div><span>음식</span><b>{FOODS[he]}</b></div><div><span>숫자</span><b>{", ".join(map(str, NUMBERS[he]))}</b></div>
      </div><p class="note">색·방향·음식·숫자는 올해 {t}띠의 기운을 고르게 맞춰 주는 {EL[he]}({EL_HJ[he]}) 오행에서 골랐어요.</p></div>
    </section>
''')
    out.append(f'''    <section class="card ny-cta">
      <p><b>띠는 같아도 생일마다 운세는 달라요.</b><br>생년월일로 보는 나만의 {Y} 신년운세, 이번 달 운세, 오늘의 사주를 무료로 확인해 보세요.</p>
      <a class="btn" href="../?p=year">내 생년월일로 {Y} 신년운세 보기</a>
    </section>
    <section class="card"><h2 class="ny-h2">다른 띠 {Y}년 운세</h2><div class="ny-grid">
      {"".join(f'<a href="{o["slug"]}.html"{" aria-current=page" if o["b"] == s["b"] else ""}>{o["emoji"]} {o["t"]}띠</a>' for o in all_signs)}
    </div></section>
''')
    out.append(FOOT.format(Y=Y))
    return "".join(out)


def index_page(Y, ranked):
    yi = year_info(Y)
    title = f"{Y}년 띠별 운세 순위 · {yi['ko']}년 무료 신년운세 - 찰떡궁합"
    desc = (f"{Y}년 {yi['ko']}년({EL_ADJ[yi['stem'] // 2]} {TTI[yi['branch']][0]}의 해) 열두 띠 운세 순위와 띠별 신년운세. "
            f"연애운·취업운·금전운·건강운, 출생연도별 운세, 좋은 달까지 무료로 확인하세요.")
    url = f"{BASE}{Y}/"
    out = [HEAD.format(title=esc(title), desc=esc(desc), url=url, base=BASE, Y=Y)]
    out.append(f'''    <section class="hero ny-hero">
      <h1>{Y}년 띠별 운세 순위</h1>
      <p>{yi["ko"]}({yi["hj"]})년 · {EL_ADJ[yi["stem"] // 2]} {TTI[yi["branch"]][0]}의 해 · 사주에서 새해는 입춘(2월 4일 무렵)에 시작돼요</p>
    </section>
    <section class="card">
      <p>{Y}년의 지지 {BR[yi["branch"]]}({BR_HJ[yi["branch"]]}){josa(BR[yi["branch"]], "과", "와")} 각 띠가 어떤 관계인지(육합·삼합·충·원진),
      올해 천간 {STEMS[yi["stem"]]}{EL[yi["stem"] // 2]}({STEMS_HJ[yi["stem"]]})의 기운이 각 띠에 어떻게 작용하는지를 함께 따져 순위를 매겼어요. 순위가 낮아도 걱정 마세요. 띠마다 {Y}년을 잘 보내는 방법을 함께 담았어요.</p>
      <ol class="ny-rank">
''')
    for rank, s in enumerate(ranked, 1):
        medal = {1: "🥇", 2: "🥈", 3: "🥉"}.get(rank, f"{rank}위")
        out.append(f'        <li><a href="{s["slug"]}.html"><span class="ny-medal">{medal}</span><span class="ny-name">{s["emoji"]} {s["t"]}띠</span>'
                   f'<span class="ny-tag">{esc(s["R"]["tag"])}{" · " + s["samjae"] if s["samjae"] else ""}</span><b>{s["scores"]["total"]}점</b></a></li>\n')
    out.append(f'''      </ol>
      <p class="note">재미로 보는 운세예요 🙂 같은 띠라도 생년월일에 따라 운세가 달라요.</p>
    </section>
    <section class="card ny-cta">
      <p><b>내 생일로 보는 {Y} 신년운세</b><br>생년월일만 넣으면 월별 흐름 그래프와 분야별 풀이까지 무료로 보여 드려요. 결제나 광고 시청 없이, 입력한 정보는 저장하지 않아요.</p>
      <a class="btn" href="../?p=year">내 {Y} 신년운세 보기</a>
    </section>
''')
    out.append(FOOT.format(Y=Y))
    return "".join(out)


def main():
    Y = int(sys.argv[1]) if len(sys.argv) > 1 else 2027
    root = Path(__file__).resolve().parent.parent
    out = root / str(Y)
    out.mkdir(exist_ok=True)
    signs = [sign(Y, b) for b in range(12)]
    ranked = sorted(signs, key=lambda s: (-s["scores"]["total"], s["b"]))
    rank_of = {s["b"]: i for i, s in enumerate(ranked, 1)}
    for s in signs:
        (out / f"{s['slug']}.html").write_text(page(Y, s, signs, rank_of[s["b"]]), encoding="utf-8")
    (out / "index.html").write_text(index_page(Y, ranked), encoding="utf-8")
    for s in ranked:
        print(f"{rank_of[s['b']]:>2}위 {s['t']}띠 {s['scores']['total']}점 {s['R']['tag']} / 천간 {s['kind']} / 삼재 {s['samjae']} / 좋은달 {s['good']} / 조심 {s['care']}")


if __name__ == "__main__":
    main()
