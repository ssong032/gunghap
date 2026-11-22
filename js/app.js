// 화면 동작: 탭 전환, 선택 목록 채우기, 결과 표시, 공유 링크
(function () {
  const $ = (id) => document.getElementById(id);

  // 띠 선택 목록
  for (const sel of [$("ttiA"), $("ttiB")]) {
    TTI.forEach((t, i) => {
      const o = document.createElement("option");
      o.value = i;
      o.textContent = `${t.emoji} ${t.name}띠 (${ttiYears(i).map((y) => String(y).slice(2)).join("·")}년생)`;
      sel.appendChild(o);
    });
  }
  // MBTI 선택 목록
  for (const sel of [$("mbtiA"), $("mbtiB")]) {
    MBTI_TYPES.forEach((t) => {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = `${t} · ${MBTI_NICK[t]}`;
      sel.appendChild(o);
    });
  }
  $("ttiB").value = "1";
  $("mbtiB").value = "ENFP";
  $("mbtiA").value = "INFJ";

  // 탭
  function setMode(m) {
    document.querySelectorAll(".tab").forEach((b) => {
      const on = b.dataset.mode === m;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on);
    });
    $("panel-saju").hidden = m !== "saju";
    $("panel-tti").hidden = m !== "tti";
    $("panel-mbti").hidden = m !== "mbti";
    $("result").hidden = true;
    $("sajuResult").hidden = true;
  }

  // ---- 오늘의 사주 ----
  const WD = ["일", "월", "화", "수", "목", "금", "토"];
  const today = seoulDate(0);
  const todayGz = ganzhiName(ganzhiIndex(today.y, today.m, today.d));
  $("iljin").textContent = `오늘 ${today.m}월 ${today.d}일(${WD[today.wd]})은 ${todayLabel(todayGz)}`;

  // 볼 기간: d0 오늘 / d1 내일 / m 이번 달 / y 신년운세
  const FY = fortuneYear(today);
  const yChip = document.querySelector('.datepick .chip[data-p="y"]');
  if (FY) yChip.textContent = `${FY} 신년운세`; else yChip.remove();
  const GO_TEXT = { d0: "오늘의 사주 보기", d1: "내일의 사주 보기", m: "이달의 운세 보기", y: `${FY} 신년운세 보기` };
  let period = "d0";
  function setPeriod(p) {
    if (p === "y" && !FY) p = "d0";
    period = p;
    document.querySelectorAll(".datepick .chip").forEach((x) => x.classList.toggle("on", x.dataset.p === p));
    $("goSaju").textContent = GO_TEXT[p];
  }
  document.querySelectorAll(".datepick .chip").forEach((c) => c.addEventListener("click", () => {
    setPeriod(c.dataset.p);
    if (!$("sajuResult").hidden) runSaju();
  }));

  // 태어난 시간: 모름 / 직접 입력
  let timeKnown = false;
  function setTimeKnown(on) {
    timeKnown = on;
    document.querySelectorAll(".timepick .chip").forEach((x) => x.classList.toggle("on", (x.dataset.time === "known") === on));
    $("btime").hidden = !on;
    if (!on) $("btime").classList.remove("err");
  }
  document.querySelectorAll(".timepick .chip").forEach((c) => c.addEventListener("click", () => {
    setTimeKnown(c.dataset.time === "known");
    if (timeKnown) $("btime").focus();
  }));

  const store = {
    get() { try { return JSON.parse(localStorage.getItem("chaltteok_birth") || "null"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem("chaltteok_birth", JSON.stringify(v)); } catch (e) { /* 저장 불가 환경 */ } },
  };
  const saved = store.get();
  if (saved && saved.date) {
    $("birth").value = saved.date;
    if (saved.time) { $("btime").value = saved.time; setTimeKnown(true); }
  }

  function runSaju() {
    const v = $("birth").value;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m || +m[1] < 1920 || +m[1] > 2026) {
      $("birth").focus();
      $("birth").classList.add("err");
      return;
    }
    $("birth").classList.remove("err");
    const time = timeKnown ? $("btime").value : "";
    if (timeKnown && !birthHour(time)) {
      $("btime").focus();
      $("btime").classList.add("err");
      return;
    }
    $("btime").classList.remove("err");
    store.set({ date: v, time });
    const birth = { y: +m[1], m: +m[2], d: +m[3], time };
    const day = (r) => r.dayMaster ? r.dayMaster : DAY_MASTER[r.me.stem];
    const md = (t) => `${t.m}/${t.d}`;
    let view;
    if (period === "m") {
      const r = monthResult(birth, today, 0);
      if (!r) return;
      view = {
        r, label: "이달의 기운",
        date: `${r.mp.ko}(${r.mp.hj})월 · ${ELEMENT_ADJ[Math.floor(r.mp.stem / 2)]} ${TTI[r.mp.branch].name}의 달 · ${md(r.mp.start)} ${r.mp.jie} ~ ${md(r.mp.end)}`,
        lucky: [["🎯 이달의 실천", r.action]],
        word: r.word, wordTitle: "💬 이달의 한마디",
        why: `내 일간 ${r.me.ko[0]}(${r.me.hj[0]})과 이달 월건의 천간 ${r.mp.ko[0]}(${r.mp.hj[0]})이 '${r.god}' 관계예요. 사주에서 한 달은 절기(${r.mp.jie})부터 다음 절기 전날까지라, 이번 달은 ${md(r.mp.start)}~${md(r.mp.end)}이에요. 행운의 날은 이 기간 하루 운세 점수가 가장 높은 날이에요.`,
      };
    } else if (period === "y") {
      const r = yearResult(birth, FY);
      view = {
        r, label: `${FY}년의 기운`,
        date: `${FY}년 ${r.yp.ko}(${r.yp.hj})년 · ${ELEMENT_ADJ[Math.floor(r.yp.stem / 2)]} ${TTI[r.yp.branch].name}의 해 · 입춘부터`,
        lucky: [["🏷️ 올해의 키워드", r.keyword]],
        word: r.months.length ? `가장 힘이 실리는 달은 ${bestMonths(r.months)}이에요. 쉬어 가는 달(${lowMonth(r.months)})에는 무리하지 말고 재충전하세요.` : "",
        wordTitle: "📅 한 해 흐름 한 줄 요약",
        why: `내 일간 ${r.me.ko[0]}(${r.me.hj[0]})과 ${FY}년 세운의 천간 ${r.yp.ko[0]}(${r.yp.hj[0]})이 '${r.god}' 관계예요. 사주에서 한 해는 1월 1일이 아니라 입춘(2월 4일 무렵)에 바뀌어요. 월별 흐름은 달마다 바뀌는 월건과 내 일간의 관계로 계산했어요.`,
      };
    } else {
      const t = seoulDate(period === "d1" ? 1 : 0);
      const r = sajuResult(birth, t);
      view = {
        r, label: "오늘의 기운",
        date: `${t.y}년 ${t.m}월 ${t.d}일(${WD[t.wd]}) · ${todayLabel(r.td)}`,
        lucky: [["🎯 오늘의 실천", r.action]],
        word: r.word, wordTitle: "💬 오늘의 한마디",
        why: `태어난 날의 천간인 일간이 ${r.me.ko[0]}${r.meElement}(${r.me.hj[0]})이고, ${period === "d1" ? "내일" : "오늘"} 일진의 천간이 ${r.td.ko[0]}(${r.td.hj[0]})이라 ` +
          `둘은 '${r.god}' 관계예요. ${r.dayMaster.desc}` +
          (r.hourPillar
            ? ` 태어난 시간은 ${r.hourPillar.branchName}라서 시주는 ${r.hourPillar.ko}(${r.hourPillar.hj})이고, 시주와 오늘 일진의 관계도 점수에 반영했어요.`
            : " 태어난 시간을 넣으면 시주까지 반영해서 더 자세히 볼 수 있어요."),
      };
    }
    const r = view.r;
    const det = detailFor(r, (r.me.stem * 7 + today.d + (period === "y" ? 3 : period === "m" ? 5 : 0)));
    const avg = Math.round(det.scores.reduce((a, b) => a + b, 0) / det.scores.length);
    const hp = birthHour(time) ? sajuResult(birth, today).hourPillar : null;
    $("sDate").textContent = view.date;
    $("sTitle").textContent = r.title;
    $("sMe").textContent = `나는 ${r.me.ko}(${r.me.hj})일주 · ${day(r).nick}` + (hp ? ` · ${hp.branchName}(${hp.hj}시주)` : "");
    $("sScore").textContent = avg;
    $("sMeter").style.width = avg + "%";
    $("sGod").textContent = `${view.label}: ${r.god}`;
    $("sTotal").textContent = r.total;
    const names = ["총운", "연애운", "취업·직장운", "금전운", "건강운"];
    $("sBars").innerHTML = "";
    det.scores.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "bar";
      row.innerHTML = `<span></span><div class="meter"><div></div></div><b></b>`;
      row.children[0].textContent = names[i];
      row.children[1].firstChild.style.width = s + "%";
      row.children[2].textContent = s;
      $("sBars").appendChild(row);
    });
    // 분야별 상세 풀이
    const parts = [
      ["💗 연애운", det.scores[1], det.love.main, [["싱글이라면", det.love.single], ["연애 중이라면", det.love.couple]]],
      ["💼 취업·직장운", det.scores[2], det.job.main, [["취업·시험 준비 중이라면", det.job.seeker], ["직장인이라면", det.job.worker]]],
      ["💰 금전운", det.scores[3], det.money.main, [["들어오는 돈", det.money.income], ["나가는 돈", det.money.spend]]],
      ["🌿 건강운", det.scores[4], det.health.main, [["오행으로 보는 관리 포인트", det.health.element]]],
    ];
    $("sParts").innerHTML = "";
    parts.forEach(([title, score, main, subs]) => {
      const sec = document.createElement("div");
      sec.className = "part";
      sec.innerHTML = "<h3><span></span><b></b></h3><p></p><ul></ul>";
      sec.querySelector("h3 span").textContent = title;
      sec.querySelector("h3 b").textContent = score + "점";
      sec.querySelector("p").textContent = main;
      subs.forEach(([k, v]) => {
        const li = document.createElement("li");
        li.innerHTML = "<b></b> ";
        li.firstChild.textContent = k;
        li.appendChild(document.createTextNode(v));
        sec.querySelector("ul").appendChild(li);
      });
      if (title === "🌿 건강운") {
        const n = document.createElement("p");
        n.className = "note";
        n.textContent = "※ 전통 오행에 따른 생활 습관 팁이며 의학적 진단이 아니에요. 몸이 불편하면 꼭 전문의와 상담하세요.";
        sec.appendChild(n);
      }
      $("sParts").appendChild(sec);
    });
    // 조심할 것 · 가까이하면 좋은 것
    $("sCaution").innerHTML = "";
    det.caution.forEach((c) => { const li = document.createElement("li"); li.textContent = c; $("sCaution").appendChild(li); });
    $("sNear").innerHTML = "";
    det.near.forEach(([k, v]) => {
      const c = document.createElement("div");
      c.innerHTML = "<span></span><b></b>";
      c.children[0].textContent = k;
      c.children[1].textContent = v;
      $("sNear").appendChild(c);
    });
    $("sNearNote").textContent = `색·방향·음식·숫자는 이 시기의 '${r.god}' 기운을 고르게 맞춰 주는 ${det.helperEl}(${det.helperEl === "목" ? "木" : det.helperEl === "화" ? "火" : det.helperEl === "토" ? "土" : det.helperEl === "금" ? "金" : "水"}) 오행에서 골랐어요.`;
    // 기간별 한 줄 (실천·키워드)
    const lk = $("sLucky");
    lk.innerHTML = "";
    lk.style.gridTemplateColumns = "1fr";
    view.lucky.forEach(([k, val]) => {
      const c = document.createElement("div");
      c.innerHTML = "<span></span><b></b>";
      c.children[0].textContent = k;
      c.children[1].textContent = val;
      lk.appendChild(c);
    });
    // 이달의 행운의 날
    const dl = $("sDays");
    dl.hidden = !(r.kind === "month" && r.lucky.length);
    if (!dl.hidden) {
      $("sDaysList").innerHTML = "";
      r.lucky.forEach((x) => {
        const li = document.createElement("li");
        li.innerHTML = "<b></b><span></span>";
        li.children[0].textContent = `${x.t.m}월 ${x.t.d}일(${WD[x.t.wd]}) · ${x.gz.ko}일`;
        li.children[1].textContent = `${x.title} (${x.score}점)`;
        $("sDaysList").appendChild(li);
      });
    }
    // 신년운세 월별 흐름
    const fl = $("sFlow");
    fl.hidden = !(r.kind === "year" && r.months.length);
    if (!fl.hidden) {
      const best = new Set(topIdx(r.months, 2)), low = lowIdx(r.months);
      $("sFlowBars").innerHTML = "";
      r.months.forEach((x, i) => {
        const col = document.createElement("div");
        col.className = "fcol" + (best.has(i) ? " best" : i === low ? " low" : "");
        col.innerHTML = "<b></b><div class='fbar'><div></div></div><span></span>";
        col.children[0].textContent = x.score;
        col.children[1].firstChild.style.height = Math.max(8, (x.score - 50) * 2) + "%";
        col.children[2].textContent = `${x.mp.start.m}월`;
        col.title = `${x.mp.ko}월 (${md(x.mp.start)}~${md(x.mp.end)}) · ${x.god}`;
        $("sFlowBars").appendChild(col);
      });
    }
    $("sWordTitle").textContent = view.wordTitle;
    $("sWord").textContent = view.word;
    $("sWordBox").hidden = !view.word;
    $("sWhy").textContent = view.why;
    $("sFun").textContent = r.kind === "year" ? "재미로 보는 신년운세예요 🙂 매달 '이번 달' 운세도 확인해 보세요!"
      : r.kind === "month" ? "재미로 보는 운세예요 🙂 절기가 바뀌면 새 달 운세가 열려요!"
      : "재미로 보는 사주예요 🙂 매일 결과가 바뀌니 내일 또 확인해 보세요!";
    $("sajuResult").hidden = false;
    $("sShareMsg").textContent = "";
    $("sajuResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function topIdx(ms, n) { return ms.map((x, i) => [x.score, -i, i]).sort((a, b) => b[0] - a[0] || b[1] - a[1]).slice(0, n).map((x) => x[2]); }
  function lowIdx(ms) { return ms.map((x, i) => [x.score, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1])[0][1]; }
  function bestMonths(ms) { return topIdx(ms, 2).sort((a, b) => a - b).map((i) => `${ms[i].mp.start.m}월`).join("과 "); }
  function lowMonth(ms) { return `${ms[lowIdx(ms)].mp.start.m}월`; }
  $("goSaju").addEventListener("click", runSaju);

  $("sShare").addEventListener("click", async () => {
    // 생년월일은 링크에 넣지 않음
    const what = period === "y" ? `${FY} 신년운세` : period === "m" ? "이번 달 운세" : period === "d1" ? "내일 사주 운세" : "오늘 내 사주 운세";
    const url = location.origin + location.pathname + (period === "y" ? "?p=year" : period === "m" ? "?p=month" : "");
    const text = `${what} ${$("sScore").textContent}점 나왔어! 너도 생년월일로 확인해 봐 👉`;
    if (navigator.share) {
      try { await navigator.share({ title: document.title, text, url }); } catch (e) { /* 취소 */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(text + " " + url);
      $("sShareMsg").textContent = "링크를 복사했어요. 친구에게 붙여 넣어 보내 주세요!";
    } catch (e) {
      $("sShareMsg").textContent = url;
    }
  });
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  // 결과 표시
  let lastQuery = "";
  function show(res, query) {
    const g = gradeOf(res.score);
    $("rHeading").textContent = res.heading;
    $("rSub").textContent = res.sub || "";
    $("rSub").hidden = !res.sub;
    $("rScore").textContent = res.score;
    $("rGrade").textContent = g.label;
    $("rGrade").className = "grade " + g.cls;
    $("rBadge").textContent = res.badge;
    $("rTitle").textContent = res.title;
    const ul = $("rLines");
    ul.innerHTML = "";
    res.lines.forEach((l) => {
      const li = document.createElement("li");
      li.textContent = l;
      ul.appendChild(li);
    });
    $("rTip").textContent = res.tip;
    $("rMeter").style.width = res.score + "%";
    $("result").hidden = false;
    $("shareMsg").textContent = "";
    lastQuery = query;
    history.replaceState(null, "", "?" + query);
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function runTti() {
    const a = +$("ttiA").value, b = +$("ttiB").value;
    show(ttiResult(a, b), `m=tti&a=${a}&b=${b}`);
  }
  function runMbti() {
    const a = $("mbtiA").value, b = $("mbtiB").value;
    show(mbtiResult(a, b), `m=mbti&a=${a}&b=${b}`);
  }
  $("goTti").addEventListener("click", runTti);
  $("goMbti").addEventListener("click", runMbti);

  // 공유
  $("shareBtn").addEventListener("click", async () => {
    const url = location.origin + location.pathname + "?" + lastQuery;
    const text = `우리 궁합 ${$("rScore").textContent}점, ${$("rGrade").textContent}! 너도 확인해 봐 👉`;
    if (navigator.share) {
      try { await navigator.share({ title: document.title, text, url }); } catch (e) { /* 취소 */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(text + " " + url);
      $("shareMsg").textContent = "링크를 복사했어요. 친구에게 붙여 넣어 보내 주세요!";
    } catch (e) {
      $("shareMsg").textContent = url;
    }
  });
  $("retryBtn").addEventListener("click", () => {
    $("result").hidden = true;
    history.replaceState(null, "", location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 공유 링크로 들어왔을 때 결과 바로 보여 주기
  const q = new URLSearchParams(location.search);
  if (q.get("m") === "tti") {
    const a = +q.get("a"), b = +q.get("b");
    if (a >= 0 && a < 12 && b >= 0 && b < 12) {
      setMode("tti");
      $("ttiA").value = a; $("ttiB").value = b;
      runTti();
    }
  } else if (q.get("m") === "mbti") {
    const a = (q.get("a") || "").toUpperCase(), b = (q.get("b") || "").toUpperCase();
    if (MBTI_TYPES.includes(a) && MBTI_TYPES.includes(b)) {
      setMode("mbti");
      $("mbtiA").value = a; $("mbtiB").value = b;
      runMbti();
    }
  } else if (q.get("p") === "year" || q.get("p") === "month") {
    // 신년운세·이달의 운세 링크: 기간을 골라 두고, 저장된 생년월일이 있으면 바로 보여 줌
    setPeriod(q.get("p") === "year" ? "y" : "m");
    if ($("birth").value) runSaju();
  } else {
    setPeriod("d0");
  }
})();
