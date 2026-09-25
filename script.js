

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const XP_PER_LEVEL = 60;
const state = {
  current: 0,
  xp: 0,
  awarded: new Set(),   // claves ya premiadas (evita sumar XP repetido)
  badges: new Set(),
  quizBest: null        // mejor porcentaje en la evaluación final
};

const BADGES = [
  { id: "explorador", icon: "🧭", name: "Explorador", how: "Revisa las 10 tarjetas de los correctos" },
  { id: "calculista", icon: "🧮", name: "Calculista", how: "Resuelve un reto de dosis" },
  { id: "detective", icon: "🔎", name: "Detective clínico", how: "Acierta al menos 2 decisiones del caso" },
  { id: "guardian", icon: "🛡️", name: "Guardián del turno", how: "Termina el simulador con al menos una vida" },
  { id: "seguro", icon: "🏅", name: "Enfermería segura", how: "Obtén 70 % o más en la evaluación" }
];

function levelOf(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }

function addXP(amount, key) {
  if (key) {
    if (state.awarded.has(key)) return false;
    state.awarded.add(key);
  }
  state.xp += amount;
  $("#xpValue").textContent = state.xp;
  $("#xpLevel").textContent = "Nivel " + levelOf(state.xp);
  $("#xpFill").style.width = ((state.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100) + "%";
  return true;
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

function unlock(id) {
  if (state.badges.has(id)) return;
  state.badges.add(id);
  const b = BADGES.find(x => x.id === id);
  toast("Insignia desbloqueada: " + b.name);
}


/* ---------- 2. DATOS DE CONTENIDO ---------- */

const CORRECTOS = [
  { t: "Paciente correcto", d: "Verifica al menos dos identificadores (nombre completo y documento o fecha de nacimiento) con la pulsera y, si es posible, pregunta al paciente." },
  { t: "Medicamento correcto", d: "Compara la etiqueta con la orden al tomarlo, al prepararlo y antes de administrarlo. Revisa alergias y cuida los nombres parecidos." },
  { t: "Dosis correcta", d: "Confirma la dosis ordenada y recalcula si hace falta. Ante una dosis dudosa o inusual, consulta antes de administrar." },
  { t: "Vía correcta", d: "Comprueba que la vía indicada sea adecuada para la presentación del fármaco y para el estado del paciente." },
  { t: "Hora correcta", d: "Administra dentro de la ventana de tiempo que fija el protocolo. Algunos fármacos son críticos en el horario." },
  { t: "Registro correcto", d: "Documenta de inmediato: fármaco, dosis, vía, hora y observaciones. Nunca registres antes de administrar." },
  { t: "Educación correcta", d: "Explica para qué es el medicamento, qué efectos esperar y qué signos de alarma debe avisar el paciente." },
  { t: "Indicación correcta", d: "Asegúrate de que el medicamento corresponde al diagnóstico o al motivo por el cual fue prescrito." },
  { t: "Derecho a rechazar", d: "El paciente puede negarse. Averigua el motivo, respeta su decisión, registra el rechazo e informa al equipo." },
  { t: "Respuesta correcta", d: "Evalúa el efecto esperado y las posibles reacciones adversas después de administrar, y comunica cualquier cambio." }
];

const RETOS = [
  { t: "Orden: amoxicilina 500 mg por vía oral. Disponible: suspensión de 250 mg en 5 mL. ¿Cuántos mL administras?", a: 10 },
  { t: "Orden: furosemida 40 mg IV. Disponible: 10 mg por cada mL. ¿Cuántos mL preparas?", a: 4 },
  { t: "Orden: ketorolaco 30 mg IV. Disponible: ampolla de 60 mg en 2 mL. ¿Cuántos mL administras?", a: 1 },
  { t: "Orden: ceftriaxona 1 g IV. Disponible: 500 mg en 5 mL. ¿Cuántos mL necesitas?", a: 10 }
];

const RUTA = [
  { t: "Prescripción y verificación", s: "Antes de preparar",
    d: "Lee la orden completa: fármaco, dosis, vía, frecuencia y fecha. Compárala con la historia clínica y con las alergias registradas. Si algo es ilegible o dudoso, aclara con el prescriptor.",
    a: "Nunca interpretes una orden ilegible: pregunta." },
  { t: "Preparación", s: "En el área limpia",
    d: "Realiza higiene de manos, reúne el material y prepara un paciente a la vez. Revisa fecha de vencimiento, concentración y aspecto del fármaco. Rotula todo lo que prepares.",
    a: "Evita distracciones e interrupciones mientras preparas." },
  { t: "Identificación del paciente", s: "Junto a la cama",
    d: "Verifica dos identificadores con la pulsera. Pregunta por alergias y explica el procedimiento con lenguaje sencillo.",
    a: "Si la pulsera falta o es ilegible, no administres hasta identificar al paciente." },
  { t: "Administración", s: "Con técnica segura",
    d: "Aplica la técnica propia de la vía, respeta la velocidad de infusión y observa al paciente. Confirma que el medicamento fue tomado o que la administración se completó.",
    a: "No dejes medicamentos junto a la cama sin una indicación expresa." },
  { t: "Registro y vigilancia", s: "Después de administrar",
    d: "Documenta de inmediato y vigila el efecto esperado y las reacciones adversas. Comunica cualquier cambio y reporta errores o casi errores.",
    a: "Reportar un casi error ayuda a evitar el siguiente." }
];

const PARES = [
  { v: "Oral", e: "Tableta que se absorbe en el tubo digestivo" },
  { v: "Sublingual", e: "Nitroglicerina que se disuelve bajo la lengua" },
  { v: "Subcutánea", e: "Insulina aplicada en el tejido graso" },
  { v: "Intramuscular", e: "Vacuna aplicada en el deltoides" },
  { v: "Intravenosa", e: "Fármaco que entra directo al torrente sanguíneo" }
];

const VF = [
  { s: "Basta con preguntar su nombre al paciente para confirmar su identidad.", r: false,
    w: "Se usan al menos dos identificadores verificados con la pulsera y, cuando es posible, se pregunta también al paciente." },
  { s: "Si una dosis no es clara, se consulta antes de administrar.", r: true,
    w: "Ante cualquier duda se detiene el proceso y se aclara con el prescriptor o con farmacia." },
  { s: "El registro puede hacerse al final del turno para ahorrar tiempo.", r: false,
    w: "Se registra de inmediato para evitar que otra persona repita la dosis." },
  { s: "El paciente puede rechazar un medicamento; se registra el rechazo y se informa al equipo.", r: true,
    w: "Es un derecho del paciente. La enfermera indaga el motivo, respeta la decisión y comunica." }
];

const CASO = [
  { q: "Antes de preparar el medicamento, ¿qué haces primero?",
    options: [
      "Le preguntas su nombre a la paciente y preparas la dosis.",
      "Lees la orden completa y la comparas con la historia clínica, incluidas las alergias.",
      "Le preguntas a una compañera qué antibiótico se usa en neumonía.",
      "Preparas la ceftriaxona y revisas la historia mientras la administras."
    ], answer: 1,
    why: "La orden se verifica contra la historia clínica y las alergias antes de preparar; así detectas riesgos a tiempo." },
  { q: "En la historia aparece alergia a la penicilina (urticaria) y el fármaco ordenado es una cefalosporina. ¿Qué haces?",
    options: [
      "Administras lentamente y observas a la paciente.",
      "Administras la mitad de la dosis por precaución.",
      "No administras y consultas al prescriptor o a farmacia antes de continuar.",
      "Cambias por otro antibiótico que consideras más seguro."
    ], answer: 2,
    why: "Puede existir reacción cruzada. No se administra hasta aclararlo, y la enfermera no modifica ni sustituye órdenes por iniciativa propia." },
  { q: "El prescriptor confirma la orden y deja indicada la vigilancia. Después de administrar, ¿qué haces?",
    options: [
      "Registras al final del turno junto con los demás medicamentos.",
      "Registras solo si la paciente presenta una reacción.",
      "Registras de inmediato fármaco, dosis, vía y hora, y vigilas signos de reacción alérgica.",
      "Delegas el registro en el turno siguiente."
    ], answer: 2,
    why: "El registro inmediato evita duplicar dosis, y la vigilancia permite actuar rápido si aparece una reacción." }
];

const ESCENARIO = [
  { context: "02:10. El paciente de la cama 4 refiere dolor 8/10. Hay una orden de morfina 2 mg IV cada 4 horas si hay dolor. La última dosis se administró hace 90 minutos.",
    q: "¿Qué haces?",
    options: [
      "Administras la dosis: el paciente está sufriendo.",
      "Evalúas el dolor y sus posibles causas, explicas que aún no corresponde la dosis y notificas al médico para revisar la analgesia.",
      "Administras el doble a las 4 horas para compensar.",
      "Le pides a una compañera que la administre para no ser tú quien la adelante."
    ], answer: 1,
    why: "Adelantar una dosis es una desviación de la orden. La respuesta segura es evaluar, comunicar y pedir una revisión de la analgesia." },
  { context: "03:00. Vas a preparar heparina. Al tomar la ampolla notas que la caja se parece mucho a la de otro fármaco del mismo cajón.",
    q: "¿Qué haces?",
    options: [
      "Confías en el color de la caja.",
      "Verificas nombre, concentración y vencimiento contra la orden y, si persiste la duda, pides una segunda verificación.",
      "Preparas ambas y decides después cuál usar.",
      "Le preguntas al paciente cuál es la que le dan siempre."
    ], answer: 1,
    why: "Los medicamentos de aspecto o nombre parecido son una causa frecuente de error. Leer la etiqueta y pedir doble verificación reduce el riesgo." },
  { context: "04:20. Tienes un antibiótico oral ordenado para las 04:00. El paciente duerme profundamente.",
    q: "¿Qué haces?",
    options: [
      "Lo dejas dormir y omites la dosis sin registrar.",
      "Dejas el medicamento sobre la mesa para que lo tome al despertar.",
      "Verificas la identidad, lo despiertas con suavidad, administras dentro de la ventana que permite el protocolo y registras la hora real.",
      "Duplicas la dosis en la siguiente toma."
    ], answer: 2,
    why: "La hora correcta se cumple dentro de la ventana definida por la institución. Dejar el medicamento sin supervisión o duplicar dosis son prácticas inseguras." },
  { context: "05:15. Un paciente rechaza su antihipertensivo porque dice que le produce mareo.",
    q: "¿Qué haces?",
    options: [
      "Disimulas el medicamento en la comida.",
      "Insistes hasta que lo tome.",
      "Respetas su decisión, indagas el motivo, controlas su presión arterial, registras el rechazo e informas al prescriptor.",
      "No registras nada para evitar problemas."
    ], answer: 2,
    why: "El paciente tiene derecho a rechazar. Tu papel es informar, evaluar, registrar y comunicar al equipo." },
  { context: "06:30. Al preparar la entrega de turno notas que administraste metformina a su hora pero no lo registraste.",
    q: "¿Qué haces?",
    options: [
      "Lo dejas sin registrar, ya se administró.",
      "Registras una hora distinta para que cuadre con el horario.",
      "Registras con la hora real de administración, según la política de la institución, y lo comunicas en la entrega de turno.",
      "Le pides a la enfermera del turno siguiente que repita la dosis."
    ], answer: 2,
    why: "La información fiel evita dosis duplicadas. Cambiar horas o repetir la dosis pone en riesgo al paciente." }
];

const EVALUACION = [
  { q: "¿Qué verificas antes de preparar cualquier medicamento?",
    options: [
      "Que el medicamento esté disponible en el carro de medicación.",
      "La orden completa y los datos del paciente en la historia clínica.",
      "Que el paciente esté despierto.",
      "La opinión de un colega."
    ], answer: 1, why: "Todo parte de la orden completa contrastada con la historia clínica del paciente." },
  { q: "¿Qué combinación identifica de forma segura a un paciente?",
    options: [
      "Número de cama y diagnóstico.",
      "Nombre completo y documento o fecha de nacimiento, verificados en la pulsera.",
      "Solo el apellido dicho por un familiar.",
      "El nombre escrito en la puerta de la habitación."
    ], answer: 1, why: "Se usan al menos dos identificadores propios del paciente, verificados en la pulsera." },
  { q: "Orden: 1 g de ceftriaxona IV. Disponible: 500 mg en 5 mL. ¿Cuántos mL necesitas?",
    options: ["5 mL", "10 mL", "15 mL", "2,5 mL"], answer: 1,
    why: "1 g son 1000 mg. 1000 mg ÷ (500 mg / 5 mL) = 10 mL." },
  { q: "Un paciente con alergia registrada a la penicilina tiene una orden de amoxicilina. ¿Qué haces?",
    options: [
      "Administras con vigilancia estrecha.",
      "No administras y consultas al prescriptor.",
      "Administras la mitad de la dosis.",
      "Cambias el antibiótico por otro."
    ], answer: 1, why: "La amoxicilina es una penicilina. Se detiene el proceso y se consulta antes de administrar." },
  { q: "La “hora correcta” significa:",
    options: [
      "Administrar siempre a la hora exacta, sin importar el estado del paciente.",
      "Administrar cuando haya tiempo durante el turno.",
      "Administrar dentro de la ventana de tiempo que fija el protocolo para esa orden.",
      "Adelantar la dosis para cumplir con otras tareas."
    ], answer: 2, why: "Cada institución define ventanas de tiempo según el tipo de fármaco; algunos son críticos en el horario." },
  { q: "¿Cuándo se registra una administración?",
    options: [
      "Antes de administrarla, para ahorrar tiempo.",
      "Inmediatamente después de administrarla.",
      "Al final del turno.",
      "Solo si hubo complicaciones."
    ], answer: 1, why: "El registro inmediato evita duplicaciones y mantiene la historia clínica fiel." },
  { q: "¿Qué incluye la educación correcta al paciente sobre su medicamento?",
    options: [
      "Solo el nombre comercial.",
      "Nada, para no preocuparlo.",
      "Para qué sirve, los efectos esperados y los signos de alarma que debe avisar.",
      "Únicamente el horario de la siguiente dosis."
    ], answer: 2, why: "Un paciente informado colabora y detecta a tiempo las reacciones." },
  { q: "Descubres que administraste una dosis mayor a la ordenada. ¿Qué haces primero?",
    options: [
      "Esperas a ver si aparece algún síntoma.",
      "Registras la dosis ordenada para no alarmar.",
      "Reduces por tu cuenta la próxima dosis.",
      "Vigilas al paciente, avisas de inmediato al prescriptor o supervisor y reportas el evento según el protocolo."
    ], answer: 3, why: "La seguridad del paciente va primero: vigilar, comunicar y reportar. Ocultar el error agrava el riesgo." }
];


/* ---------- 3. NAVEGACIÓN ---------- */

const slides = $$(".slide");
const btnPrev = $("#btnPrev");
const btnNext = $("#btnNext");

function updateNav() {
  const last = slides.length - 1;
  btnPrev.disabled = state.current === 0;
  btnNext.disabled = state.current === last;
  const title = slides[state.current].dataset.title;
  $("#navStatus").textContent = "Etapa " + (state.current + 1) + " de " + slides.length + ": " + title;
  $("#ecgClip").style.width = (state.current / last * 100) + "%";
}

function go(n) {
  n = Math.max(0, Math.min(slides.length - 1, n));
  slides.forEach((s, i) => s.classList.toggle("active", i === n));
  state.current = n;
  updateNav();
  if (n === slides.length - 1) renderResults();
  window.scrollTo({ top: 0 });
  const h = slides[n].querySelector(".focus-target");
  if (h) h.focus({ preventScroll: true });
}

function sizeEcg() {
  n$("#ecg").style.setProperty("--ecg-w", $("#ecg").clientWidth + "px");
}

btnPrev.addEventListener("click", () => go(state.current - 1));
btnNext.addEventListener("click", () => go(state.current + 1));
$("#btnStart").addEventListener("click", () => go(1));
$("#btnHome").addEventListener("click", () => go(0));
window.addEventListener("resize", sizeEcg);


/* ---------- 4. CONTENIDOS INTERACTIVOS ---------- */

function initCards() {
  const grid = $("#cardGrid");
  const seen = new Set();

  grid.innerHTML = CORRECTOS.map((c, i) => `
    <button type="button" class="flip" aria-pressed="false" data-i="${i}">
      <span class="flip-inner">
        <span class="flip-face front">
          <span class="flip-title">${c.t}</span>
          <span class="flip-hint">Toca para ver qué verificar</span>
        </span>
        <span class="flip-face back" aria-hidden="true">${c.d}</span>
      </span>
    </button>`).join("");

  grid.addEventListener("click", e => {
    const btn = e.target.closest(".flip");
    if (!btn) return;
    const on = btn.classList.toggle("flipped");
    btn.setAttribute("aria-pressed", String(on));
    $(".back", btn).setAttribute("aria-hidden", String(!on));
    $(".front", btn).setAttribute("aria-hidden", String(on));

    const i = Number(btn.dataset.i);
    if (on && !seen.has(i)) {
      seen.add(i);
      addXP(5, "card-" + i);
      $("#cardCount").textContent = seen.size + " de " + CORRECTOS.length;
      if (seen.size === CORRECTOS.length) unlock("explorador");
    }
  });
}

function initTabs() {
  const tabs = $$('[role="tab"]');
  const select = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const step = e.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });
}

function fmt(n) {
  return (Math.round(n * 100) / 100).toLocaleString("es");
}

function initCalc() {
  const dose = $("#calcDose"), mg = $("#calcMg"), ml = $("#calcMl"), out = $("#calcOut");

  const update = () => {
    const d = parseFloat(dose.value), a = parseFloat(mg.value), b = parseFloat(ml.value);
    out.textContent = (d > 0 && a > 0 && b > 0)
      ? "Debes administrar " + fmt(d / (a / b)) + " mL."
      : "Ingresa los tres datos para calcular el volumen.";
  };
  [dose, mg, ml].forEach(el => el.addEventListener("input", update));

  // Reto de dosis
  let idx = 0;
  const text = $("#chText"), ans = $("#chAns"), fb = $("#chFb");
  const showChallenge = () => {
    text.textContent = RETOS[idx].t;
    ans.value = "";
    fb.textContent = "";
  };
  $("#chCheck").addEventListener("click", () => {
    const v = parseFloat(ans.value.replace(",", "."));
    if (Number.isNaN(v)) { fb.textContent = "Escribe un número para comprobar."; return; }
    if (Math.abs(v - RETOS[idx].a) < 0.01) {
      fb.textContent = "Correcto. " + fmt(RETOS[idx].a) + " mL es el volumen a administrar.";
      addXP(20, "calc");
      unlock("calculista");
    } else {
      fb.textContent = "Todavía no. Revisa las unidades y aplica: dosis ÷ concentración.";
    }
  });
  $("#chNew").addEventListener("click", () => { idx = (idx + 1) % RETOS.length; showChallenge(); });
  ans.addEventListener("keydown", e => { if (e.key === "Enter") $("#chCheck").click(); });
  showChallenge();
}


/* ---------- 5. INFOGRAFÍA DESPLEGABLE ---------- */

function initRoute() {
  const route = $("#route");
  route.innerHTML = RUTA.map((s, i) => `
    <article class="step">
      <h3>
        <button type="button" class="step-btn" id="stepBtn${i}" aria-expanded="false" aria-controls="stepPanel${i}">
          <span class="step-node" aria-hidden="true">${i + 1}</span>
          <span class="step-head">
            <span class="step-title">${s.t}</span>
            <span class="step-sub">${s.s}</span>
          </span>
          <span class="step-chev" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="step-panel" id="stepPanel${i}" role="region" aria-labelledby="stepBtn${i}">
        <div class="step-panel-inner">
          <div class="step-body">
            <p>${s.d}</p>
            <p class="alert"><strong>Alerta:</strong> ${s.a}</p>
          </div>
        </div>
      </div>
    </article>`).join("");

  const setOpen = (step, open) => {
    step.classList.toggle("open", open);
    const btn = $(".step-btn", step);
    btn.setAttribute("aria-expanded", String(open));
    if (open) addXP(5, "step-" + btn.id);
  };

  route.addEventListener("click", e => {
    const btn = e.target.closest(".step-btn");
    if (!btn) return;
    const step = btn.closest(".step");
    setOpen(step, !step.classList.contains("open"));
    syncExpandLabel();
  });

  const expandBtn = $("#btnExpand");
  const syncExpandLabel = () => {
    const all = $$(".step", route).every(s => s.classList.contains("open"));
    expandBtn.textContent = all ? "Contraer todo" : "Expandir todo";
  };
  expandBtn.addEventListener("click", () => {
    const all = $$(".step", route).every(s => s.classList.contains("open"));
    $$(".step", route).forEach(s => setOpen(s, !all));
    syncExpandLabel();
  });
}


/* ---------- 6. ACTIVIDADES ---------- */

function initMatch() {
  const box = $("#match"), fb = $("#matchFb");
  const left = PARES.map((p, i) => ({ id: i, text: p.v }));
  const right = shuffle(PARES.map((p, i) => ({ id: i, text: p.e })));

  box.innerHTML = `
    <div class="match-col" data-side="l">${left.map(x => `<button type="button" class="pill" data-id="${x.id}">${x.text}</button>`).join("")}</div>
    <div class="match-col" data-side="r">${right.map(x => `<button type="button" class="pill" data-id="${x.id}">${x.text}</button>`).join("")}</div>`;

  let pick = null;
  let matched = 0, mistakes = 0;

  box.addEventListener("click", e => {
    const el = e.target.closest(".pill");
    if (!el || el.classList.contains("done")) return;
    const side = el.parentElement.dataset.side;

    if (pick && pick.el === el) {              // deseleccionar
      el.classList.remove("selected");
      pick = null;
      return;
    }
    if (!pick || pick.side === side) {          // elegir o cambiar de elemento en la misma columna
      if (pick) pick.el.classList.remove("selected");
      pick = { side, el };
      el.classList.add("selected");
      return;
    }

    // Se eligió uno de cada columna: comprobar pareja
    const a = pick.el, b = el;
    a.classList.remove("selected");
    pick = null;
    if (a.dataset.id === b.dataset.id) {
      [a, b].forEach(x => { x.classList.add("done"); x.disabled = true; });
      matched++;
      addXP(6, "pair-" + a.dataset.id);
      fb.textContent = matched === PARES.length
        ? "¡Completo! Emparejaste las cinco vías con " + mistakes + (mistakes === 1 ? " error." : " errores.")
        : "Correcto. Sigue con la siguiente pareja.";
    } else {
      mistakes++;
      [a, b].forEach(x => {
        x.classList.add("wrong");
        setTimeout(() => x.classList.remove("wrong"), 600);
      });
      fb.textContent = "Esa pareja no coincide. Inténtalo de nuevo.";
    }
  });
}

function initTF() {
  const list = $("#tfList");
  list.innerHTML = VF.map((q, i) => `
    <div class="tf" data-i="${i}">
      <p>${q.s}</p>
      <div class="tf-actions">
        <button type="button" class="pill" data-v="true">Verdadero</button>
        <button type="button" class="pill" data-v="false">Falso</button>
      </div>
      <p class="tf-fb" aria-live="polite"></p>
    </div>`).join("");

  list.addEventListener("click", e => {
    const btn = e.target.closest("button[data-v]");
    if (!btn) return;
    const row = btn.closest(".tf");
    const q = VF[Number(row.dataset.i)];
    const ok = (btn.dataset.v === "true") === q.r;
    $$("button", row).forEach(b => {
      b.disabled = true;
      if ((b.dataset.v === "true") === q.r) b.classList.add("correct");
    });
    if (!ok) btn.classList.add("wrong");
    const fb = $(".tf-fb", row);
    fb.className = "tf-fb " + (ok ? "ok" : "bad");
    fb.textContent = (ok ? "Correcto. " : "No exactamente. ") + q.w;
    if (ok) addXP(5, "tf-" + row.dataset.i);
  });
}


/* ---------- 7. MOTOR DE CUESTIONARIOS ---------- */
/* Se reutiliza para el estudio de caso, el simulador de turno y la evaluación. */

function createQuiz(cfg) {
  const root = document.getElementById(cfg.root);
  let idx = 0, score = 0, lives = cfg.lives || 0, answered = false, order = [];

  const hearts = () => {
    if (!cfg.lives) return "";
    let h = "";
    for (let i = 0; i < cfg.lives; i++) h += `<span class="heart ${i < lives ? "on" : "off"}" aria-hidden="true">&#9829;</span>`;
    return `<span class="hearts" role="img" aria-label="${lives} vidas restantes">${h}</span>`;
  };

  function renderIntro() {
    root.innerHTML = `<div class="quiz-intro">${cfg.intro}<button class="btn primary" type="button" data-act="start">${cfg.startLabel}</button></div>`;
    $('[data-act="start"]', root).addEventListener("click", () => {
      idx = 0; score = 0; lives = cfg.lives || 0;
      renderQuestion();
    });
  }

  function renderQuestion() {
    answered = false;
    const q = cfg.questions[idx];
    order = shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer })));
    const isLast = idx === cfg.questions.length - 1;

    root.innerHTML = `
      <div class="quiz-head"><span>Pregunta ${idx + 1} de ${cfg.questions.length}</span><span data-hearts>${hearts()}</span></div>
      ${q.context ? `<p class="quiz-context">${q.context}</p>` : ""}
      <p class="quiz-q" id="${cfg.root}-q" tabindex="-1">${q.q}</p>
      <div class="quiz-options" role="group" aria-labelledby="${cfg.root}-q">
        ${order.map((o, i) => `<button type="button" class="opt" data-i="${i}"><span class="opt-letter">${"ABCD"[i]}</span><span>${o.text}</span></button>`).join("")}
      </div>
      <div class="quiz-fb" aria-live="polite"></div>
      <div class="quiz-actions"><button class="btn primary" type="button" data-act="next" hidden>${isLast ? "Ver resultado" : "Continuar"}</button></div>`;

    const opts = $$(".opt", root);
    const fb = $(".quiz-fb", root);
    const next = $('[data-act="next"]', root);

    opts.forEach(btn => btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const chosen = order[Number(btn.dataset.i)];
      opts.forEach((b, i) => { b.disabled = true; if (order[i].correct) b.classList.add("correct"); });

      if (chosen.correct) {
        score++;
        addXP(cfg.xp, cfg.root + "-" + idx);
        fb.className = "quiz-fb ok";
        fb.innerHTML = "<strong>Correcto.</strong> " + q.why;
      } else {
        btn.classList.add("incorrect");
        if (cfg.lives) { lives--; $("[data-hearts]", root).innerHTML = hearts(); }
        fb.className = "quiz-fb bad";
        fb.innerHTML = "<strong>No es la mejor opción.</strong> " + q.why;
      }
      if (cfg.lives && lives === 0) next.textContent = "Ver resultado";
      next.hidden = false;
      next.focus();
    }));

    next.addEventListener("click", () => {
      if (cfg.lives && lives === 0) return renderEnd(true);
      idx++;
      idx >= cfg.questions.length ? renderEnd(false) : renderQuestion();
    });

    $(".quiz-q", root).focus({ preventScroll: true });
  }

  function renderEnd(failed) {
    const total = cfg.questions.length;
    const pct = Math.round(score / total * 100);
    root.innerHTML = `
      <div class="quiz-end">
        <h3 tabindex="-1">${failed ? "Te quedaste sin vidas" : "Terminaste esta etapa"}</h3>
        <p class="quiz-score">${score} de ${total} respuestas acertadas (${pct} %)</p>
        <p>${cfg.endMessage({ score, total, pct, lives, failed })}</p>
        <button class="btn ghost" type="button" data-act="retry">Intentar de nuevo</button>
      </div>`;
    $('[data-act="retry"]', root).addEventListener("click", () => {
      idx = 0; score = 0; lives = cfg.lives || 0;
      renderQuestion();
    });
    $("h3", root).focus({ preventScroll: true });
    if (cfg.onComplete) cfg.onComplete({ score, total, pct, lives, failed });
  }

  renderIntro();
}

function initQuizzes() {
  createQuiz({
    root: "caseQuiz", questions: CASO, xp: 20,
    intro: "<p>Vas a tomar tres decisiones sobre el caso de la señora Marta Gómez. Cada acierto suma 20 XP.</p>",
    startLabel: "Iniciar caso",
    endMessage: ({ score }) => score === 3
      ? "Excelente análisis: verificaste, detectaste el riesgo y cerraste el ciclo con registro y vigilancia."
      : "Revisa los comentarios de cada decisión y vuelve a intentarlo para reforzar el razonamiento clínico.",
    onComplete: ({ score }) => { if (score >= 2) unlock("detective"); }
  });

  createQuiz({
    root: "scenarioQuiz", questions: ESCENARIO, xp: 20, lives: 3,
    intro: "<p>Estás a cargo de la ronda de medicación de la noche. Tienes <strong>3 vidas</strong>: pierdes una con cada decisión insegura. Cada acierto suma 20 XP.</p>",
    startLabel: "Iniciar turno",
    endMessage: ({ lives, failed }) => failed
      ? "Un turno seguro exige verificar y comunicar. Repasa los comentarios y vuelve a intentarlo."
      : "Terminaste el turno con " + lives + (lives === 1 ? " vida." : " vidas.") + " Tus decisiones protegieron a tus pacientes.",
    onComplete: ({ failed, lives }) => { if (!failed && lives >= 1) unlock("guardian"); }
  });

  createQuiz({
    root: "finalQuiz", questions: EVALUACION, xp: 10,
    intro: "<p>Son 8 preguntas de selección única. Cada acierto suma 10 XP y con 70 % o más obtienes la insignia final. Puedes repetir la evaluación.</p>",
    startLabel: "Iniciar evaluación",
    endMessage: ({ pct }) => pct >= 70
      ? "Aprobaste. Ya dominas los conceptos centrales de la administración segura de medicamentos."
      : "Aún no llegas al 70 %. Repasa los contenidos y las actividades, y vuelve a intentarlo.",
    onComplete: ({ pct }) => {
      state.quizBest = Math.max(state.quizBest ?? 0, pct);
      if (pct >= 70) unlock("seguro");
    }
  });
}


/* ---------- 8. RESULTADOS ---------- */

function renderResults() {
  const box = $("#results");
  const quiz = state.quizBest === null
    ? `<p>Todavía no has completado la evaluación final.</p><button class="btn primary" type="button" data-go="7">Ir a la evaluación</button>`
    : `<p>Tu mejor resultado en la evaluación: <strong>${state.quizBest} %</strong>.</p>`;

  box.innerHTML = `
    <div class="stat-row">
      <div class="stat"><strong>${state.xp}</strong>puntos de experiencia</div>
      <div class="stat"><strong>${levelOf(state.xp)}</strong>nivel alcanzado</div>
      <div class="stat"><strong>${state.badges.size} de ${BADGES.length}</strong>insignias</div>
    </div>

    <h3>Tus insignias</h3>
    <div class="badges">
      ${BADGES.map(b => {
        const on = state.badges.has(b.id);
        return `<div class="badge ${on ? "" : "locked"}">
          <span class="badge-icon" aria-hidden="true">${b.icon}</span>
          <span><strong>${b.name}</strong><small>${on ? "Desbloqueada" : b.how}</small></span>
        </div>`;
      }).join("")}
    </div>

    <h3>Evaluación</h3>
    ${quiz}

    <div class="panel">
      <h3>Para reflexionar</h3>
      <p>¿Cuál de los diez correctos crees que se omite con más facilidad cuando hay prisa? ¿Qué harías tú para no saltártelo?</p>
    </div>

    <div class="row">
      <button class="btn ghost" type="button" data-go="0">Volver al inicio</button>
      <button class="btn ghost" type="button" data-act="restart">Reiniciar el OVA</button>
    </div>`;
}

$("#results").addEventListener("click", e => {
  const goBtn = e.target.closest("[data-go]");
  if (goBtn) return go(Number(goBtn.dataset.go));
  if (e.target.closest('[data-act="restart"]')) location.reload();
});


/* ---------- ARRANQUE ---------- */

initCards();
initTabs();
initCalc();
initRoute();
initMatch();
initTF();
initQuizzes();
sizeEcg();
updateNav();