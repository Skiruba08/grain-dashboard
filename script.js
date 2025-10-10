
// Load CSV and initialize dashboard
let RAW = [];
let WIDE = [];
const state = { region: 'All', subRegion: 'All', year: 'All' };

function fmt(x, digits=1) {
  if (x === null || x === undefined || isNaN(x)) return '—';
  return Number(x).toLocaleString(undefined, {maximumFractionDigits: digits});
}

function updateKpis(rows) {
  const prod = rows.reduce((s, r) => s + (Number(r.Production) || 0), 0);
  const dem  = rows.reduce((s, r) => s + (Number(r.TotalDemand) || 0), 0);
  const bal  = prod - dem;
  const ssr  = dem ? (prod/dem) : null;

  document.getElementById('kpiProductionValue').textContent = fmt(prod, 1);
  document.getElementById('kpiDemandValue').textContent     = fmt(dem, 1);
  document.getElementById('kpiBalanceValue').textContent    = fmt(bal, 1);
  document.getElementById('kpiSSRValue').textContent        = ssr==null? '—' : (ssr).toFixed(2);
}

function lineSeries(rows, yKey, name) {
  const byYear = new Map();
  rows.forEach(r => {
    const y = Number(r.Year);
    const v = Number(r[yKey]);
    if (!isFinite(y) || isNaN(v)) return;
    byYear.set(y, (byYear.get(y)||0) + v);
  });
  const years = Array.from(byYear.keys()).sort((a,b)=>a-b);
  const vals = years.map(y => byYear.get(y));
  return { x: years, y: vals, name, mode:'lines+markers' };
}

function buildTrend(rows) {
  const prod = lineSeries(rows, 'Production', 'Production');
  const dem  = lineSeries(rows, 'TotalDemand', 'Total Demand');
  const layout = {
    margin:{l:50,r:10,t:10,b:40},
    xaxis:{title:'Year', tickmode:'linear'},
    yaxis:{title:'MMT'},
    hovermode:'x unified'
  };
  Plotly.newPlot('trendChart', [prod, dem], layout, {displayModeBar:false, responsive:true});
}

function buildGap(rows) {
  const byYear = new Map();
  rows.forEach(r => {
    const y = Number(r.Year);
    const v = Number(r.SupplyGap);
    if (!isFinite(y) || isNaN(v)) return;
    byYear.set(y, (byYear.get(y)||0) + v);
  });
  const years = Array.from(byYear.keys()).sort((a,b)=>a-b);
  const vals = years.map(y => byYear.get(y));
  const trace = { x: years, y: vals, type:'bar', name:'Supply Gap' };
  const layout = {
    margin:{l:50,r:10,t:10,b:40},
    xaxis:{title:'Year', tickmode:'linear'},
    yaxis:{title:'MMT'},
    hovermode:'x'
  };
  Plotly.newPlot('gapChart', [trace], layout, {displayModeBar:false, responsive:true});
}

function applyFilters() {
  let filtered = [...WIDE];
  if (state.region !== 'All') filtered = filtered.filter(r => r.Region === state.region);
  if (state.subRegion !== 'All') filtered = filtered.filter(r => r.SubRegion === state.subRegion);
  if (state.year !== 'All') filtered = filtered.filter(r => Number(r.Year) === Number(state.year));

  updateKpis(filtered);
  buildTrend(filtered);
  buildGap(filtered);
}

function populateFilters() {
  const regionSel = document.getElementById('regionSelect');
  const subSel = document.getElementById('subRegionSelect');
  const yearSel = document.getElementById('yearSelect');

  const regions = Array.from(new Set(WIDE.map(r=>r.Region))).sort();
  const subregions = Array.from(new Set(WIDE.map(r=>r.SubRegion))).sort();
  const years = Array.from(new Set(WIDE.map(r=>Number(r.Year)))).sort((a,b)=>a-b);

  function fillSelect(sel, items, allLabel='All') {
    sel.innerHTML = '';
    const optAll = document.createElement('option'); optAll.value = 'All'; optAll.textContent = allLabel;
    sel.appendChild(optAll);
    items.forEach(v => { const o=document.createElement('option'); o.value=String(v); o.textContent=String(v); sel.appendChild(o); });
  }

  fillSelect(regionSel, regions);
  fillSelect(subSel, subregions);
  fillSelect(yearSel, years);

  regionSel.addEventListener('change', e => { state.region = e.target.value; applyFilters(); });
  subSel.addEventListener('change', e => { state.subRegion = e.target.value; applyFilters(); });
  yearSel.addEventListener('change', e => { state.year = e.target.value; applyFilters(); });
}

d3.csv('data/grain_clean.csv').then(rows => {
  WIDE = rows;
  populateFilters();
  applyFilters();
});
