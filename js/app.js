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

  let dayOff = 0;
  document.querySelectorAll(".datepick .chip").forEach((c) => c.addEventListener("click", () => {
    dayOff = +c.dataset.off;
    document.querySelectorAll(".datepick .chip").forEach((x) => x.classList.toggle("on", x === c));
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
    const t = seoulDate(dayOff);
    const r = sajuResult({ y: +m[1], m: +m[2], d: +m[3], time }, t);
    const avg = Math.round(r.scores.reduce((a, b) => a + b, 0) / r.scores.length);
    $("sDate").textContent = `${t.y}년 ${t.m}월 ${t.d}일(${WD[t.wd]}) · ${todayLabel(r.td)}`;
    $("sTitle").textContent = r.title;
    $("sMe").textContent = `나는 ${r.me.ko}(${r.me.hj})일주 · ${r.dayMaster.nick}` +
      (r.hourPillar ? ` · ${r.hourPillar.branchName}(${r.hourPillar.hj}시주)` : "");
    $("sScore").textContent = avg;
    $("sMeter").style.width = avg + "%";
    $("sGod").textContent = `오늘의 기운: ${r.god}`;
    $("sTotal").textContent = r.total;
    const names = ["총운", "애정운", "금전운", "일·학업운"];
    $("sBars").innerHTML = "";
    r.scores.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "bar";
      row.innerHTML = `<span></span><div class="meter"><div></div></div><b></b>`;
      row.children[0].textContent = names[i];
      row.children[1].firstChild.style.width = s + "%";
      row.children[2].textContent = s;
      $("sBars").appendChild(row);
    });
    $("sLove").textContent = r.love;
    $("sMoney").textContent = r.money;
    $("sWork").textContent = r.work;
    $("sColor").textContent = r.color;
    $("sNumber").textContent = r.number;
    $("sAction").textContent = r.action;
    $("sWord").textContent = r.word;
    $("sWhy").textContent =
      `태어난 날의 천간인 일간이 ${r.me.ko[0]}${r.meElement}(${r.me.hj[0]})이고, ${dayOff ? "내일" : "오늘"} 일진의 천간이 ${r.td.ko[0]}(${r.td.hj[0]})이라 ` +
      `둘은 '${r.god}' 관계예요. ${r.dayMaster.desc} 행운의 색은 내 일간을 도와주는 오행의 색이에요.` +
      (r.hourPillar
        ? ` 태어난 시간은 ${r.hourPillar.branchName}라서 시주는 ${r.hourPillar.ko}(${r.hourPillar.hj})이고, 시주와 오늘 일진의 관계도 점수에 반영했어요.`
        : " 태어난 시간을 넣으면 시주까지 반영해서 더 자세히 볼 수 있어요.");
    $("sajuResult").hidden = false;
    $("sShareMsg").textContent = "";
    $("sajuResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("goSaju").addEventListener("click", runSaju);

  $("sShare").addEventListener("click", async () => {
    // 생년월일은 링크에 넣지 않음
    const url = location.origin + location.pathname;
    const text = `오늘 내 사주 운세 ${$("sScore").textContent}점 나왔어! 너도 생년월일로 확인해 봐 👉`;
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
  }
})();
