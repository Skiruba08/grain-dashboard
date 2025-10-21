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

function lineSeries(rows, yKey, name, color) {
  const byYear = new Map();
  rows.forEach(r => {
    const y = Number(r.Year);
    const v = Number(r[yKey]);
    if (!isFinite(y) || isNaN(v)) return;
    byYear.set(y, (byYear.get(y)||0) + v);
  });
  const years = Array.from(byYear.keys()).sort((a,b)=>a-b);
  const vals = years.map(y => byYear.get(y));
  return { 
    x: years, 
    y: vals, 
    name, 
    mode:'lines+markers',
    line: { width: 3, color },
    marker: { size: 6, color },
    hovertemplate: '<b>Year</b>: %{x}<br><b>'+name+'</b>: %{y:,.1f} MMT<extra></extra>'
  };
}

function buildTrend(rows) {
  const prod = lineSeries(rows, 'Production', 'Production', '#1f77b4');
  const dem  = lineSeries(rows, 'TotalDemand', 'Total Demand', '#ff7f0e');
  const layout = {
    margin:{l:80,r:16,t:10,b:72},
    xaxis:{title:{text:'Year',font:{size:13},standoff:20},tickmode:'linear',dtick:1,tickangle:-45},
    yaxis:{title:{text:'Production / Demand (MMT)',font:{size:13},standoff:20},tickformat:',.1f',rangemode:'tozero',gridcolor:'rgba(0,0,0,0.08)'},
    legend:{orientation:'h',y:-0.25},
    hovermode:'x unified',
    hoverlabel:{bgcolor:'white',bordercolor:'rgba(0,0,0,0.25)'}
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
  const trace = { 
    x: years, 
    y: vals, 
    type:'bar', 
    name:'Supply Gap',
    hovertemplate:'<b>Year</b>: %{x}<br><b>Supply Gap</b>: %{y:,.1f} MMT<extra></extra>'
  };
  const layout = {
    margin:{l:80,r:16,t:10,b:72},
    xaxis:{title:{text:'Year',font:{size:13},standoff:20},tickmode:'linear',dtick:1,tickangle:-45},
    yaxis:{title:{text:'Supply Gap (MMT)',font:{size:13},standoff:20},tickformat:',.1f',zeroline:true,gridcolor:'rgba(0,0,0,0.08)'},
    hovermode:'x',
    hoverlabel:{bgcolor:'white',bordercolor:'rgba(0,0,0,0.25)'}
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
