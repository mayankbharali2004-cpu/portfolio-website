// Total slides must mirror the number of sheets in the source workbook (5).
const TOTAL_SLIDES = 5;

let currentSlide = 1;
let deckData = null;
const loadedCss = new Set();
const chartInstances = {};

const slideContainer = document.getElementById('slideContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsEl = document.getElementById('dots');
const navControls = document.getElementById('navControls');

function loadCss(n) {
  // Remove old stylesheet if it exists to force a fresh reload
  const oldLink = document.querySelector(`link[href*="slide${n}.css"]`);
  if (oldLink) oldLink.remove();

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // Add cache-buster query param to force fresh CSS load
  link.href = `slides/slide${n}.css?v=${Date.now()}`;
  document.head.appendChild(link);
  loadedCss.add(n);
}

function destroyChart(key) {
  if (chartInstances[key]) {
    chartInstances[key].destroy();
    delete chartInstances[key];
  }
}

function formatCurrency(value) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}₹${Math.abs(rounded).toLocaleString('en-IN')}`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString('en-US');
}

function formatPercent(value, decimals = 2) {
  return (value * 100).toFixed(decimals) + '%';
}

// Smart percent: whole-number percents show no decimals (12%), fractional
// ones show two (0.25%) — mirrors how the sheet formats each row. Rounds off
// float noise first so e.g. 0.07*100 = 7.0000000001 still reads as "7%".
function formatPercentSmart(value) {
  const pct = Math.round(value * 100 * 1e4) / 1e4;
  return (Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(2)) + '%';
}

function formatByKind(value, kind) {
  if (kind === 'currency') return formatCurrency(value);
  if (kind === 'percent') return formatPercentSmart(value);
  return formatNumber(value);
}

function animateNumber(el, endValue, formatFn, duration = 900) {
  const startTime = performance.now();
  let frame;
  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatFn(endValue * eased);
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  // Backstop: guarantees the final value lands even if rAF is throttled
  // (e.g. the tab is backgrounded), so a KPI never gets stuck mid-count.
  setTimeout(() => {
    cancelAnimationFrame(frame);
    el.textContent = formatFn(endValue);
  }, duration + 100);
}

function initSlide1() {
  if (!deckData) return;
  const d = deckData.revenue;

  animateNumber(document.getElementById('kpiTraffic'), d.fy.totalTraffic, formatNumber);
  animateNumber(document.getElementById('kpiOrders'), d.fy.totalOrders, formatNumber);
  animateNumber(document.getElementById('kpiRevenue'), d.fy.revenue, formatCurrency);

  destroyChart('trafficRevenue');
  chartInstances.trafficRevenue = new Chart(document.getElementById('trafficRevenueChart'), {
    data: {
      labels: d.months,
      datasets: [
        {
          type: 'bar',
          label: 'Revenue',
          data: d.revenue,
          backgroundColor: '#4f8cff',
          borderRadius: 4,
          yAxisID: 'yRevenue',
          order: 2,
        },
        {
          type: 'line',
          label: 'Total Traffic',
          data: d.totalTraffic,
          borderColor: '#ffb454',
          backgroundColor: '#ffb454',
          tension: 0.35,
          pointRadius: 3,
          yAxisID: 'yTraffic',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#c7cedd', usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => (ctx.dataset.yAxisID === 'yRevenue'
              ? `Revenue: ${formatCurrency(ctx.raw)}`
              : `Traffic: ${formatNumber(ctx.raw)} visitors`),
          },
        },
      },
      scales: {
        x: { ticks: { color: '#8b93a7' }, grid: { display: false } },
        yRevenue: {
          position: 'left',
          ticks: { color: '#8b93a7', callback: (v) => formatCurrency(v) },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        yTraffic: {
          position: 'right',
          ticks: { color: '#8b93a7', callback: (v) => formatNumber(v) },
          grid: { display: false },
        },
      },
    },
  });

  destroyChart('ordersConversion');
  chartInstances.ordersConversion = new Chart(document.getElementById('ordersConversionChart'), {
    data: {
      labels: d.months,
      datasets: [
        {
          type: 'bar',
          label: 'Total Orders',
          data: d.totalOrders,
          backgroundColor: '#57c785',
          borderRadius: 4,
          yAxisID: 'yOrders',
          order: 2,
        },
        {
          type: 'line',
          label: 'Avg Conversion Rate',
          data: d.avgConversionRate,
          borderColor: '#ff6b6b',
          backgroundColor: '#ff6b6b',
          tension: 0.35,
          pointRadius: 3,
          yAxisID: 'yConversion',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#c7cedd', usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => (ctx.dataset.yAxisID === 'yConversion'
              ? `Avg Conversion: ${formatPercent(ctx.raw)}`
              : `Orders: ${formatNumber(ctx.raw)}`),
          },
        },
      },
      scales: {
        x: { ticks: { color: '#8b93a7' }, grid: { display: false } },
        yOrders: {
          position: 'left',
          ticks: { color: '#8b93a7' },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        yConversion: {
          position: 'right',
          min: 0.017,
          max: 0.019,
          ticks: { color: '#8b93a7', callback: (v) => formatPercent(v, 2) },
          grid: { display: false },
        },
      },
    },
  });
}

function initSlide2() {
  if (!deckData) return;
  const s = deckData.summary;

  animateNumber(document.getElementById('s2Visitors'), s.totalVisitors, formatNumber);
  animateNumber(document.getElementById('s2Orders'), s.totalOrders, formatNumber);
  animateNumber(document.getElementById('s2Revenue'), s.grossRevenue, formatCurrency);
  animateNumber(document.getElementById('s2GrossProfit'), s.grossProfit, formatCurrency);
  animateNumber(document.getElementById('s2GrossMargin'), s.grossMarginPct, (v) => formatPercent(v, 1));
  animateNumber(document.getElementById('s2OpEx'), s.totalOpEx, formatCurrency);
  animateNumber(document.getElementById('s2Ebit'), s.ebit, formatCurrency);
  animateNumber(document.getElementById('s2NetIncome'), s.netIncome, formatCurrency);
  animateNumber(document.getElementById('s2PaidCac'), s.paidCac, formatCurrency);

  // P&L bridge: the two deltas below aren't sheet fields, they're the gaps
  // between figures that already are (Gross Revenue - Gross Profit = cost of
  // sales & refunds; EBIT - Net Income = tax & other), and the meter bars are
  // each step's share of Gross Revenue as the 100% reference.
  const cogsDelta = s.grossRevenue - s.grossProfit;
  const otherDelta = s.ebit - s.netIncome;
  animateNumber(document.getElementById('s2CogsDelta'), cogsDelta, formatCurrency);
  animateNumber(document.getElementById('s2OtherDelta'), otherDelta, formatCurrency);

  const scale = (v) => `${Math.min(100, (Math.abs(v) / s.grossRevenue) * 100).toFixed(1)}%`;
  requestAnimationFrame(() => {
    document.getElementById('s2RevenueBar').style.width = scale(s.grossRevenue);
    document.getElementById('s2ProfitBar').style.width = scale(s.grossProfit);
    document.getElementById('s2EbitBar').style.width = scale(s.ebit);
    document.getElementById('s2NetBar').style.width = scale(s.netIncome);
  });
}

// Fallback constants, used only if an older cached deck_data.json predates
// the modelConstants block -- normally these come straight from the sheet
// (see extract_data.py's extract_model_constants) so the recompute below
// stays correct if any of them are ever edited in Excel, not just the five
// Bear/Base/Bull columns.
const FALLBACK_MODEL_CONSTANTS = {
  organicTraffic0: 800, paidTraffic0: 600, organicConv0: 0.025, paidConv0: 0.01,
  aovH1: 1499, aovH2: 2999, paymentFeePct: 0.03, platformFeePerOrder: 150,
  taxRate: 0.3, initialCapital: 5000000,
  salariesH1: 120000, salariesH2: 150000, softwareMonthly: 20000, otherH1: 10000, otherH2: 15000,
};

// Re-runs the workbook's own monthly cascade (12 Month Revenue -> Cash Runway
// Analysis sheets) for a given scenario's five input assumptions, since the
// source file only ever computes outputs for whichever scenario is toggled
// there ("Base") -- Bear/Bull have no precomputed FY figures anywhere in it.
// Verified against Base to reproduce the workbook's real FY totals exactly.
function runScenarioModel({ organicGrowth, paidGrowth, convImprovement, paidCpc, refundRate }) {
  const k = { ...FALLBACK_MODEL_CONSTANTS, ...(deckData && deckData.modelConstants) };

  let organicTraffic = k.organicTraffic0;
  let paidTraffic = k.paidTraffic0;
  let organicConv = k.organicConv0;
  let paidConv = k.paidConv0;

  let revenueFY = 0;
  let grossProfitFY = 0;
  let ebitFY = 0;
  let netIncomeFY = 0;
  let balance = k.initialCapital;

  for (let m = 1; m <= 12; m += 1) {
    if (m > 1) {
      organicTraffic *= 1 + organicGrowth;
      paidTraffic *= 1 + paidGrowth;
      organicConv *= 1 + convImprovement;
      paidConv *= 1 + convImprovement;
    }
    const totalOrders = Math.round(organicTraffic * organicConv) + Math.round(paidTraffic * paidConv);
    const aov = m <= 6 ? k.aovH1 : k.aovH2;
    const revenue = aov * totalOrders;
    const refund = revenue * refundRate;
    const cogs = k.paymentFeePct * revenue + k.platformFeePerOrder * totalOrders;
    const grossProfit = revenue - refund - cogs;
    const salaries = m <= 6 ? k.salariesH1 : k.salariesH2;
    const other = m <= 6 ? k.otherH1 : k.otherH2;
    const opex = paidCpc * paidTraffic + salaries + k.softwareMonthly + other;
    const ebt = grossProfit - opex;
    const tax = ebt > 0 ? ebt * k.taxRate : 0;
    const netIncome = ebt - tax;

    revenueFY += revenue;
    grossProfitFY += grossProfit;
    ebitFY += ebt;
    netIncomeFY += netIncome;
    balance += netIncome;
  }

  const cashAtFyEnd = balance;
  const totalCashBurned = k.initialCapital - cashAtFyEnd;
  const avgMonthlyBurn = totalCashBurned / 12;
  const runwayMonths = avgMonthlyBurn > 0 ? k.initialCapital / avgMonthlyBurn : null;

  return {
    revenueFY, grossProfitFY, ebitFY, netIncomeFY, cashAtFyEnd, runwayMonths,
  };
}

function initSlide3() {
  if (!deckData) return;
  const sc = deckData.scenario;
  const scenarios = [
    { key: 'bear', name: 'Bear', descriptor: 'Conservative' },
    { key: 'base', name: 'Base', descriptor: 'Expected' },
    { key: 'bull', name: 'Bull', descriptor: 'Optimistic' },
  ];

  const cardsWrap = document.getElementById('s3Cards');
  cardsWrap.innerHTML = '';
  scenarios.forEach((s, idx) => {
    const rows = sc.metrics.map((m) => `
      <div class="s3-metric">
        <span class="s3-metric__label">${m.label}</span>
        <span class="s3-metric__value">${formatByKind(m[s.key], m.kind)}</span>
      </div>`).join('');
    const card = document.createElement('div');
    card.className = `s3-card s3-card--${s.key} stagger-in`;
    card.style.setProperty('--i', idx + 1);
    card.dataset.scenario = s.name;
    card.innerHTML = `
      <div class="s3-card__head">
        <span class="s3-card__dot"></span>
        <div>
          <h3 class="s3-card__name">${s.name}</h3>
          <p class="s3-card__descriptor">${s.descriptor}</p>
        </div>
        <span class="s3-card__badge">Active</span>
      </div>
      <div class="s3-card__metrics">${rows}</div>`;
    cardsWrap.appendChild(card);
  });

  // Segmented toggle mirrors the sheet's "Scenario Toggle" cell, plus a
  // fourth "Custom" option that isn't one of the workbook's named cases.
  const toggle = document.getElementById('s3Toggle');
  toggle.innerHTML = [...scenarios.map((s) => s.name), 'Custom']
    .map((name) => `<button class="s3-toggle__btn" data-scenario="${name}">${name}</button>`)
    .join('');

  const customPanel = document.getElementById('s3Custom');

  function setActive(name) {
    const isCustom = name === 'Custom';
    cardsWrap.hidden = isCustom;
    customPanel.hidden = !isCustom;
    cardsWrap.querySelectorAll('.s3-card').forEach((c) => {
      c.classList.toggle('is-active', c.dataset.scenario === name);
    });
    toggle.querySelectorAll('.s3-toggle__btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.scenario === name);
    });
    document.getElementById('s3ActiveName').textContent = name;
  }

  toggle.querySelectorAll('.s3-toggle__btn').forEach((b) => {
    b.addEventListener('click', () => setActive(b.dataset.scenario));
  });
  cardsWrap.querySelectorAll('.s3-card').forEach((c) => {
    c.addEventListener('click', () => setActive(c.dataset.scenario));
  });

  setActive(sc.activeScenario);

  // Impact on Key Metrics: recompute each scenario's FY outputs from its own
  // five assumptions (metrics array order matches the sheet's rows 3-7).
  const [organicGrowth, paidGrowth, convImprovement, paidCpc, refundRate] = sc.metrics;
  const suffix = { bear: 'Bear', base: 'Base', bull: 'Bull' };
  Object.keys(suffix).forEach((key) => {
    const out = runScenarioModel({
      organicGrowth: organicGrowth[key],
      paidGrowth: paidGrowth[key],
      convImprovement: convImprovement[key],
      paidCpc: paidCpc[key],
      refundRate: refundRate[key],
    });
    const setCell = (id, text, cls) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      el.classList.remove('is-negative', 'is-positive', 's3-outputs-cell--value--prose');
      if (cls) el.classList.add(...cls.split(' '));
    };
    setCell(`s3Out${suffix[key]}Revenue`, formatCurrency(out.revenueFY));
    setCell(`s3Out${suffix[key]}Loss`, formatCurrency(out.netIncomeFY), out.netIncomeFY < 0 ? 'is-negative' : 'is-positive');
    setCell(`s3Out${suffix[key]}Cash`, formatCurrency(out.cashAtFyEnd));
    setCell(
      `s3Out${suffix[key]}Runway`,
      out.runwayMonths === null ? 'Cash-flow positive' : `${Math.round(out.runwayMonths)} mo`,
      out.runwayMonths === null ? 'is-positive s3-outputs-cell--value--prose' : null,
    );
  });

  // Custom what-if sandbox: same cascade model, but driven by live inputs
  // instead of a fixed scenario column. Defaults to Base's assumptions.
  const customInputs = {
    organicGrowth: document.getElementById('s3CustomOrganicGrowth'),
    paidGrowth: document.getElementById('s3CustomPaidGrowth'),
    convImprovement: document.getElementById('s3CustomConvImprove'),
    paidCpc: document.getElementById('s3CustomCpc'),
    refundRate: document.getElementById('s3CustomRefund'),
  };
  customInputs.organicGrowth.value = (organicGrowth.base * 100).toFixed(1);
  customInputs.paidGrowth.value = (paidGrowth.base * 100).toFixed(1);
  customInputs.convImprovement.value = (convImprovement.base * 100).toFixed(2);
  customInputs.paidCpc.value = paidCpc.base;
  customInputs.refundRate.value = (refundRate.base * 100).toFixed(1);

  function recomputeCustom() {
    const out = runScenarioModel({
      organicGrowth: (parseFloat(customInputs.organicGrowth.value) || 0) / 100,
      paidGrowth: (parseFloat(customInputs.paidGrowth.value) || 0) / 100,
      convImprovement: (parseFloat(customInputs.convImprovement.value) || 0) / 100,
      paidCpc: parseFloat(customInputs.paidCpc.value) || 0,
      refundRate: (parseFloat(customInputs.refundRate.value) || 0) / 100,
    });
    const setOut = (id, text, cls) => {
      const el = document.getElementById(id);
      el.textContent = text;
      el.classList.remove('is-negative', 'is-positive');
      if (cls) el.classList.add(cls);
    };
    setOut('s3CustomOutRevenue', formatCurrency(out.revenueFY));
    setOut('s3CustomOutNetIncome', formatCurrency(out.netIncomeFY), out.netIncomeFY < 0 ? 'is-negative' : 'is-positive');
    setOut('s3CustomOutCash', formatCurrency(out.cashAtFyEnd));
    setOut(
      's3CustomOutRunway',
      out.runwayMonths === null ? 'Cash-flow positive' : `${Math.round(out.runwayMonths)} mo`,
      out.runwayMonths === null ? 'is-positive' : null,
    );
  }

  Object.values(customInputs).forEach((input) => input.addEventListener('input', recomputeCustom));
  recomputeCustom();
}

function initSlide4() {
  if (!deckData) return;
  const cr = deckData.cashRunway;
  const s = cr.summary;

  animateNumber(document.getElementById('s4Runway'), s.runwayMonths, (v) => Math.round(v).toString());
  animateNumber(document.getElementById('s4InitialCap'), s.initialCapital, formatCurrency);
  animateNumber(document.getElementById('s4CashEnd'), s.cashAtFyEnd, formatCurrency);
  animateNumber(document.getElementById('s4Burned'), s.totalCashBurned, formatCurrency);

  // Calculate and display capital consumed percentage
  const burnedPct = (Math.abs(s.totalCashBurned) / s.initialCapital) * 100;
  const pctEl = document.getElementById('s4BurnedPct');
  if (pctEl) {
    pctEl.textContent = `${burnedPct.toFixed(1)}% of capital`;
  }

  animateNumber(document.getElementById('s4MonthlyBurn'), s.avgMonthlyBurn, formatCurrency);

  destroyChart('cashRunway');
  chartInstances.cashRunway = new Chart(document.getElementById('cashRunwayChart'), {
    data: {
      labels: cr.months,
      datasets: [
        {
          type: 'line',
          label: 'Closing Cash Balance',
          data: cr.closingBalance,
          borderColor: '#4f8cff',
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return 'rgba(79,140,255,0.15)';
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, 'rgba(79,140,255,0.35)');
            g.addColorStop(1, 'rgba(79,140,255,0.02)');
            return g;
          },
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#4f8cff',
          yAxisID: 'yBalance',
          order: 1,
        },
        {
          type: 'bar',
          label: 'Net Cash Flow',
          data: cr.netCashFlow,
          backgroundColor: cr.netCashFlow.map((v) => (v < 0 ? 'rgba(255,107,107,0.75)' : 'rgba(87,199,133,0.8)')),
          borderRadius: 3,
          yAxisID: 'yFlow',
          order: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#c7cedd', usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: '#8b93a7' }, grid: { display: false } },
        yBalance: {
          position: 'left',
          ticks: { color: '#8b93a7', callback: (v) => formatCurrency(v) },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        yFlow: {
          position: 'right',
          ticks: { color: '#8b93a7', callback: (v) => formatCurrency(v) },
          grid: { display: false },
        },
      },
    },
  });
}

// Builds the pool of real model figures that drift in the cover background.
function coverFigurePool() {
  const rev = deckData.revenue;
  const sum = deckData.summary;
  const cr = deckData.cashRunway;
  const figures = [
    formatCurrency(sum.grossRevenue),
    formatNumber(sum.totalVisitors),
    `${formatNumber(sum.totalOrders)} orders`,
    formatPercent(sum.grossMarginPct, 1),
    formatCurrency(sum.grossProfit),
    `${Math.round(cr.summary.runwayMonths)} mo runway`,
    formatCurrency(cr.summary.initialCapital),
    formatCurrency(sum.ebit),
    formatCurrency(sum.netIncome),
    `CAC ${formatCurrency(sum.paidCac)}`,
    '₹1,499',
    '₹2,999',
    '18%',
    '12%',
    '86.2%',
    '5% refund',
    '30% tax',
  ];
  // Monthly revenue points add texture and variety.
  rev.revenue.forEach((v) => figures.push(formatCurrency(v)));
  return figures;
}

function buildCoverBackground() {
  const bg = document.getElementById('s5Bg');
  if (!bg) return;
  bg.innerHTML = '';

  const figures = coverFigurePool();
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const tiers = [
    { cls: 's5-num--far', size: [16, 26], op: [0.12, 0.18] },
    { cls: 's5-num--mid', size: [26, 44], op: [0.14, 0.22] },
    { cls: 's5-num--near', size: [40, 72], op: [0.16, 0.26] },
  ];
  const tints = ['', '', '', 's5-num--green', 's5-num--warn'];

  // Create columns of scrolling numbers so they flow from top to bottom.
  // Each column has numbers that start at different offsets to create a waterfall effect.
  const COLS = 8;
  const NUMBERS_PER_COL = 6;

  for (let col = 0; col < COLS; col++) {
    for (let num = 0; num < NUMBERS_PER_COL; num++) {
      if (Math.random() < 0.15) continue; // leave some gaps
      const tier = tiers[Math.floor(rand(0, tiers.length))];
      const el = document.createElement('span');
      el.className = `s5-num ${tier.cls} ${pick(tints)}`.trim();
      el.textContent = pick(figures);

      // Horizontal position based on column (spread across width)
      const left = (col / COLS) * 100 + rand(-2, 2);
      el.style.left = `${Math.max(0, Math.min(left, 100))}%`;

      // Initial top position: stagger the numbers vertically so they fill the viewport
      el.style.top = `${(num / NUMBERS_PER_COL) * 100}%`;

      el.style.fontSize = `${rand(tier.size[0], tier.size[1]).toFixed(0)}px`;
      el.style.setProperty('--op', rand(tier.op[0], tier.op[1]).toFixed(3));

      // Scroll duration: 20-28 seconds for smooth continuous flow
      el.style.setProperty('--scroll-dur', `${rand(20, 28).toFixed(1)}s`);
      el.style.setProperty('--pulse-dur', `${rand(4, 7).toFixed(1)}s`);

      // Stagger the animation start per column to create waterfall waves
      const colDelay = (col / COLS) * -6;
      const numDelay = (num / NUMBERS_PER_COL) * -3;
      el.style.setProperty('--delay', `${(colDelay + numDelay).toFixed(1)}s`);

      // Start offset positions numbers at different heights in the scroll loop
      el.style.setProperty('--start-offset', `${num * 20}vh`);

      bg.appendChild(el);
    }
  }
}

function initSlide5() {
  if (!deckData) return;
  const a = deckData.about;

  buildCoverBackground();

  const grid = document.getElementById('s5Assumptions');
  grid.innerHTML = a.assumptions
    .map((item, idx) => `
      <div class="s5-chip stagger-in" style="--i:${idx + 3}">
        <span class="s5-chip__label">${item.label.trim()}</span>
        <span class="s5-chip__value">${formatByKind(item.value, item.kind)}</span>
      </div>`).join('');

  document.getElementById('s5Credit').textContent = a.credit.replace('~', '').trim();
}

const SLIDE_HOOKS = { 1: initSlide1, 2: initSlide2, 3: initSlide3, 4: initSlide4, 5: initSlide5 };

// Presentation order is decoupled from the content modules so slides can be
// re-sequenced without renaming files or rescoping CSS. Each entry is the
// module id (slideN.html / .slide-N / SLIDE_HOOKS[N]) shown at that position.
// Position 1 opens with About & Notes (module 5) as the cover slide.
const SLIDE_ORDER = [5, 1, 2, 3, 4];

function moduleFor(position) {
  return SLIDE_ORDER[position - 1];
}

async function loadSlide(position) {
  const moduleId = moduleFor(position);
  loadCss(moduleId);
  const cacheBust = `?v=${Math.random().toString(36).substring(7)}`;
  const res = await fetch(`slides/slide${moduleId}.html${cacheBust}`);
  const html = await res.text();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const slideEl = wrapper.firstElementChild;

  slideContainer.querySelectorAll('.slide').forEach((el) => el.remove());
  slideContainer.appendChild(slideEl);

  requestAnimationFrame(() => slideEl.classList.add('active'));

  if (SLIDE_HOOKS[moduleId]) SLIDE_HOOKS[moduleId]();
}

function updateNavState() {
  prevBtn.disabled = currentSlide === 1;
  nextBtn.disabled = currentSlide === TOTAL_SLIDES;
  dotsEl.querySelectorAll('.dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx + 1 === currentSlide);
  });
}

function buildDots() {
  dotsEl.innerHTML = '';
  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('aria-label', `Go to slide ${i}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsEl.appendChild(dot);
  }
}

async function goToSlide(n) {
  if (n < 1 || n > TOTAL_SLIDES || n === currentSlide) return;
  currentSlide = n;
  await loadSlide(n);
  updateNavState();
}

prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
  if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
  showNav();
});

let touchStartX = null;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
document.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) goToSlide(currentSlide + (dx < 0 ? 1 : -1));
  touchStartX = null;
});

let navHideTimer = null;
function showNav() {
  navControls.classList.remove('nav-hidden');
  clearTimeout(navHideTimer);
  navHideTimer = setTimeout(() => navControls.classList.add('nav-hidden'), 3000);
}
document.addEventListener('mousemove', showNav);

// Live sync: polls deck_data.json (regenerated by data/watch_excel.py on
// every save of the source workbook) and re-renders the current slide in
// place -- no manual refresh -- whenever the underlying numbers change.
const LIVE_SYNC_INTERVAL_MS = 2000;
let lastDataText = null;

function flashLiveSyncBadge() {
  const badge = document.getElementById('liveSyncBadge');
  if (!badge) return;
  badge.classList.add('visible');
  clearTimeout(flashLiveSyncBadge.timer);
  flashLiveSyncBadge.timer = setTimeout(() => badge.classList.remove('visible'), 2600);
}

async function checkForDataUpdate() {
  let text;
  try {
    const res = await fetch(`data/deck_data.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    text = await res.text();
  } catch {
    return; // transient read (e.g. workbook mid-save) -- retry next tick
  }
  if (text === lastDataText) return;
  const wasFirstLoad = lastDataText === null;
  lastDataText = text;
  try {
    deckData = JSON.parse(text);
  } catch {
    return; // partial write caught mid-save -- next tick will have the full file
  }
  if (wasFirstLoad) return;

  const moduleId = moduleFor(currentSlide);
  if (SLIDE_HOOKS[moduleId]) SLIDE_HOOKS[moduleId]();
  flashLiveSyncBadge();
}

async function init() {
  await checkForDataUpdate();
  buildDots();
  await loadSlide(currentSlide);
  updateNavState();
  showNav();
  setInterval(checkForDataUpdate, LIVE_SYNC_INTERVAL_MS);
}

init();
