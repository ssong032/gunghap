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
  let mode = "tti";
  function setMode(m) {
    mode = m;
    document.querySelectorAll(".tab").forEach((b) => {
      const on = b.dataset.mode === m;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on);
    });
    $("panel-tti").hidden = m !== "tti";
    $("panel-mbti").hidden = m !== "mbti";
    $("result").hidden = true;
  }
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
