/**
 * NekoSales Analytics - Anime Dashboard & Slide Manager
 * Supports:
 * - 7 Themed Presentation Slides with categorized chart explanations
 * - Outlier 'ขยะเปียก' management (Filtered Age > 52.2)
 * - Region Button Group + Province Button Group & List Select
 * - Cute anime sounds, falling sakura animation, and Chart.js integration
 */

(function () {
  'use strict';

  const data = window.SALES_DATA;
  if (!data) {
    console.error('Data not found! Please check data.js');
    return;
  }

  // --- Audio FX (Web Audio API Synthesizer) ---
  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playCuteSound(type = 'pop') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'chime') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio not permitted or failed
    }
  }

  // --- Sakura Canvas Animation ---
  let sakuraActive = true;
  const canvas = document.getElementById('sakura-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let petals = [];

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Petal {
    constructor() {
      this.reset();
    }
    reset() {
      if (!canvas) return;
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * -100;
      this.size = Math.random() * 8 + 6;
      this.speedX = Math.random() * 1.5 - 0.75;
      this.speedY = Math.random() * 1.4 + 0.8;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.04;
      this.alpha = Math.random() * 0.4 + 0.5;
    }
    update() {
      if (!canvas) return;
      this.x += this.speedX + Math.sin(this.angle) * 0.4;
      this.y += this.speedY;
      this.angle += this.spin;
      if (this.y > canvas.height || this.x < -20 || this.x > canvas.width + 20) {
        this.reset();
        this.y = -10;
      }
    }
    draw() {
      if (!ctx) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 182, 193, ${this.alpha})`;
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size);
      ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  function initSakura() {
    if (!canvas) return;
    petals = [];
    const count = Math.min(35, Math.floor(window.innerWidth / 40));
    for (let i = 0; i < count; i++) {
      petals.push(new Petal());
    }
  }

  function animateSakura() {
    if (ctx && canvas && sakuraActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.update();
        p.draw();
      });
    }
    requestAnimationFrame(animateSakura);
  }

  initSakura();
  animateSakura();

  // --- Chart.js Theme Defaults (Anime Pastel Colors) ---
  const animeColors = {
    pink: '#FF85A2',
    pinkLight: '#FFD1DC',
    pinkDeep: '#FF477E',
    purple: '#9D84B7',
    purpleLight: '#E7DEEE',
    blue: '#64B5F6',
    blueLight: '#E3F2FD',
    mint: '#4FD1C5',
    mintLight: '#E6FFFA',
    yellow: '#F6AD55',
    yellowLight: '#FEFCBF',
    red: '#E53E3E',
    palette: [
      '#FF85A2', '#9D84B7', '#64B5F6', '#4FD1C5', '#F6AD55', '#FC8181', '#B794F4', '#48BB78'
    ]
  };

  Chart.defaults.font.family = "'Prompt', 'Kanit', sans-serif";
  Chart.defaults.color = '#4A5568';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(45, 55, 72, 0.9)';
  Chart.defaults.plugins.tooltip.titleColor = '#FFF';
  Chart.defaults.plugins.tooltip.bodyColor = '#FFD1DC';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;

  // Chart Registry to destroy & recreate cleanly
  const activeCharts = {};

  function renderChart(canvasId, type, config) {
    if (activeCharts[canvasId]) {
      activeCharts[canvasId].destroy();
    }
    const canvasEl = document.getElementById(canvasId);
    if (!canvasEl) return null;
    const ctx2d = canvasEl.getContext('2d');
    activeCharts[canvasId] = new Chart(ctx2d, {
      type: type,
      data: config.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: config.legendPos || 'bottom',
            labels: { boxWidth: 12, padding: 14 }
          },
          ...config.plugins
        },
        scales: config.scales || {}
      }
    });
    return activeCharts[canvasId];
  }

  // --- Populate KPI Cards ---
  function populateKPIs() {
    const meta = data.meta;
    document.getElementById('kpi-total-rev').textContent = '฿' + (meta.totalRevenue).toLocaleString('th-TH');
    document.getElementById('kpi-clean-orders').textContent = meta.cleanRecords.toLocaleString('th-TH') + ' รายการ';
    document.getElementById('kpi-trash-orders').textContent = meta.trashRecords.toLocaleString('th-TH') + ' รายการ';
    document.getElementById('kpi-trash-rev').textContent = '฿' + (meta.trashRevenue).toLocaleString('th-TH');
    document.getElementById('kpi-avg-age').textContent = meta.meanAge + ' ปี';
  }

  // --- Slide Deck Navigation ---
  let currentSlide = 1;
  const totalSlides = 7;

  function showSlide(slideNum) {
    if (slideNum < 1) slideNum = 1;
    if (slideNum > totalSlides) slideNum = totalSlides;
    currentSlide = slideNum;

    // Update slides visibility
    document.querySelectorAll('.slide-card').forEach((el) => el.classList.remove('active'));
    const target = document.getElementById(`slide-${currentSlide}`);
    if (target) target.classList.add('active');

    // Update indicator
    const counterEl = document.getElementById('slide-counter-text');
    if (counterEl) counterEl.textContent = `สไลด์ที่ ${currentSlide} / ${totalSlides}`;

    const prevBtn = document.getElementById('btn-prev-slide');
    const nextBtn = document.getElementById('btn-next-slide');
    if (prevBtn) prevBtn.disabled = currentSlide === 1;
    if (nextBtn) nextBtn.disabled = currentSlide === totalSlides;

    // Trigger chart renders for current slide
    renderSlideCharts(currentSlide);
  }

  function renderSlideCharts(slideNum) {
    if (slideNum === 1) {
      // Slide 1: Regional Sales Bar & Order Share
      renderChart('chart-slide1-region-rev', 'bar', {
        data: {
          labels: data.regions.map((r) => r.name),
          datasets: [{
            label: 'ยอดขายรวม (บาท)',
            data: data.regions.map((r) => r.revenue),
            backgroundColor: [
              '#FF85A2', '#9D84B7', '#F6AD55', '#4FD1C5', '#64B5F6'
            ],
            borderRadius: 8
          }]
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => '฿' + (v / 1000000).toFixed(1) + 'M'
            }
          }
        }
      });

      renderChart('chart-slide1-region-orders', 'doughnut', {
        data: {
          labels: data.regions.map((r) => r.name),
          datasets: [{
            data: data.regions.map((r) => r.orders),
            backgroundColor: [
              '#FF85A2', '#9D84B7', '#F6AD55', '#4FD1C5', '#64B5F6'
            ]
          }]
        }
      });
    } else if (slideNum === 2) {
      // Slide 2: Outlier / Trash Management
      // Age Distribution with Cutoff
      const ageLabels = data.ageDistribution.map((a) => a.range).concat(['53-63 ปี (ขยะเปียก)']);
      const ageCounts = data.ageDistribution.map((a) => a.count).concat([data.meta.trashRecords]);
      const ageColors = data.ageDistribution.map(() => '#9D84B7').concat(['#E53E3E']);

      renderChart('chart-slide2-age-cutoff', 'bar', {
        data: {
          labels: ageLabels,
          datasets: [{
            label: 'จำนวนลูกค้า (คน)',
            data: ageCounts,
            backgroundColor: ageColors,
            borderRadius: 6
          }]
        }
      });

      // Categories inside Trash
      const trashCatCounts = {};
      data.trash.forEach((t) => {
        trashCatCounts[t.category] = (trashCatCounts[t.category] || 0) + 1;
      });

      renderChart('chart-slide2-trash-categories', 'polarArea', {
        data: {
          labels: Object.keys(trashCatCounts),
          datasets: [{
            data: Object.values(trashCatCounts),
            backgroundColor: [
              'rgba(229, 62, 62, 0.75)',
              'rgba(246, 173, 85, 0.75)',
              'rgba(157, 132, 183, 0.75)',
              'rgba(79, 209, 197, 0.75)',
              'rgba(100, 181, 246, 0.75)',
              'rgba(255, 133, 162, 0.75)',
              'rgba(183, 148, 244, 0.75)'
            ]
          }]
        }
      });
    } else if (slideNum === 3) {
      // Slide 3: Regional Province Counts & Top Provinces
      const topProvs = [];
      data.regions.forEach((r) => {
        r.provinces.forEach((p) => topProvs.push(p));
      });
      topProvs.sort((a, b) => b.revenue - a.revenue);
      const top10 = topProvs.slice(0, 10);

      renderChart('chart-slide3-top-provinces', 'bar', {
        data: {
          labels: top10.map((p) => p.name),
          datasets: [{
            label: 'ยอดขายรวม (บาท)',
            data: top10.map((p) => p.revenue),
            backgroundColor: '#FF85A2',
            borderRadius: 6
          }]
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '฿' + (v / 1000).toFixed(0) + 'k' }
          }
        }
      });

      renderChart('chart-slide3-avg-basket', 'bar', {
        data: {
          labels: data.regions.map((r) => r.name),
          datasets: [{
            label: 'ยอดเฉลี่ยต่อบิล (AOV)',
            data: data.regions.map((r) => r.avgOrder),
            backgroundColor: '#64B5F6',
            borderRadius: 6
          }]
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '฿' + v }
          }
        }
      });
    } else if (slideNum === 4) {
      // Slide 4: Category Revenues & Volumes
      renderChart('chart-slide4-cat-revenue', 'bar', {
        data: {
          labels: data.categories.map((c) => c.name),
          datasets: [{
            label: 'ยอดขายหมวดหมู่ (บาท)',
            data: data.categories.map((c) => c.revenue),
            backgroundColor: animeColors.palette,
            borderRadius: 6
          }]
        },
        scales: {
          x: { ticks: { maxRotation: 25 } },
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '฿' + (v / 1000000).toFixed(1) + 'M' }
          }
        }
      });

      renderChart('chart-slide4-cat-orders', 'doughnut', {
        data: {
          labels: data.categories.map((c) => c.name),
          datasets: [{
            data: data.categories.map((c) => c.orders),
            backgroundColor: animeColors.palette
          }]
        }
      });
    } else if (slideNum === 5) {
      // Slide 5: Channels & Payment Methods
      renderChart('chart-slide5-channels', 'pie', {
        data: {
          labels: data.channels.map((c) => c.name),
          datasets: [{
            data: data.channels.map((c) => c.orders),
            backgroundColor: ['#FF85A2', '#64B5F6', '#4FD1C5', '#F6AD55']
          }]
        }
      });

      renderChart('chart-slide5-payments', 'doughnut', {
        data: {
          labels: data.payments.map((p) => p.name),
          datasets: [{
            data: data.payments.map((p) => p.orders),
            backgroundColor: ['#4FD1C5', '#FF85A2', '#F6AD55', '#9D84B7', '#CBD5E0']
          }]
        }
      });
    } else if (slideNum === 6) {
      // Slide 6: Demographics (Age & Gender)
      renderChart('chart-slide6-ages', 'line', {
        data: {
          labels: data.ageDistribution.map((a) => a.range),
          datasets: [{
            label: 'ยอดขายตามช่วงอายุ (บาท)',
            data: data.ageDistribution.map((a) => a.revenue),
            borderColor: '#FF477E',
            backgroundColor: 'rgba(255, 133, 162, 0.2)',
            fill: true,
            tension: 0.35,
            pointRadius: 6,
            pointBackgroundColor: '#FF477E'
          }]
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '฿' + (v / 1000000).toFixed(1) + 'M' }
          }
        }
      });

      renderChart('chart-slide6-gender', 'doughnut', {
        data: {
          labels: data.gender.map((g) => g.name),
          datasets: [{
            data: data.gender.map((g) => g.count),
            backgroundColor: ['#FF85A2', '#64B5F6', '#CBD5E0']
          }]
        }
      });
    } else if (slideNum === 7) {
      // Slide 7: Fulfillment & Order Status
      renderChart('chart-slide7-status', 'pie', {
        data: {
          labels: data.status.map((s) => s.name),
          datasets: [{
            data: data.status.map((s) => s.orders),
            backgroundColor: ['#38A169', '#E53E3E', '#DD6B20']
          }]
        }
      });

      renderChart('chart-slide7-timeline', 'line', {
        data: {
          labels: data.timeline.map((t) => t.month),
          datasets: [{
            label: 'ยอดขายรายเดือน (บาท)',
            data: data.timeline.map((t) => t.revenue),
            borderColor: '#9D84B7',
            backgroundColor: 'rgba(157, 132, 183, 0.25)',
            fill: true,
            tension: 0.3
          }]
        },
        scales: {
          x: { ticks: { maxRotation: 45 } },
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => '฿' + (v / 1000).toFixed(0) + 'k' }
          }
        }
      });
    }
  }

  // --- Regional & Provincial Explorer System ---
  let selectedRegion = 'ทั้งหมด';
  let selectedProvince = 'ทั้งหมด';

  function initRegionExplorer() {
    const regionButtons = document.querySelectorAll('.region-btn');
    regionButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        playCuteSound('pop');
        regionButtons.forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        selectedRegion = this.getAttribute('data-region');
        updateProvinceSelector(selectedRegion);
        renderSelectedAreaAnalysis();
      });
    });

    const provSelect = document.getElementById('province-select');
    if (provSelect) {
      provSelect.addEventListener('change', function () {
        playCuteSound('pop');
        selectedProvince = this.value;
        syncProvinceChips(selectedProvince);
        renderSelectedAreaAnalysis();
      });
    }

    // Default setup
    updateProvinceSelector('ทั้งหมด');
    renderSelectedAreaAnalysis();
  }

  function getAllProvinces() {
    const list = [];
    data.regions.forEach((r) => {
      r.provinces.forEach((p) => list.push(p));
    });
    list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    return list;
  }

  function getProvincesForRegion(regionName) {
    if (regionName === 'ทั้งหมด') return getAllProvinces();
    const reg = data.regions.find((r) => r.name === regionName);
    return reg ? reg.provinces : [];
  }

  function updateProvinceSelector(regionName) {
    const provs = getProvincesForRegion(regionName);
    const selectEl = document.getElementById('province-select');
    const chipsContainer = document.getElementById('province-chips-container');

    // Update Dropdown
    if (selectEl) {
      selectEl.innerHTML = '<option value="ทั้งหมด">🌸 ทุกจังหวัดในภูมิภาคนี้ (All Provinces)</option>';
      provs.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = `${p.name} (${p.orders} คำสั่งซื้อ - ฿${p.revenue.toLocaleString()})`;
        selectEl.appendChild(opt);
      });
      selectEl.value = 'ทั้งหมด';
      selectedProvince = 'ทั้งหมด';
    }

    // Update Button Group / Chips
    if (chipsContainer) {
      chipsContainer.innerHTML = '';
      const allChip = document.createElement('button');
      allChip.className = 'prov-chip active';
      allChip.textContent = '✨ ทุกจังหวัด';
      allChip.addEventListener('click', () => {
        playCuteSound('pop');
        selectedProvince = 'ทั้งหมด';
        if (selectEl) selectEl.value = 'ทั้งหมด';
        syncProvinceChips('ทั้งหมด');
        renderSelectedAreaAnalysis();
      });
      chipsContainer.appendChild(allChip);

      provs.forEach((p) => {
        const chip = document.createElement('button');
        chip.className = 'prov-chip';
        chip.textContent = p.name;
        chip.setAttribute('data-province', p.name);
        chip.addEventListener('click', () => {
          playCuteSound('pop');
          selectedProvince = p.name;
          if (selectEl) selectEl.value = p.name;
          syncProvinceChips(p.name);
          renderSelectedAreaAnalysis();
        });
        chipsContainer.appendChild(chip);
      });
    }
  }

  function syncProvinceChips(provName) {
    document.querySelectorAll('.prov-chip').forEach((chip) => {
      if (provName === 'ทั้งหมด') {
        if (chip.textContent.includes('ทุกจังหวัด')) chip.classList.add('active');
        else chip.classList.remove('active');
      } else {
        if (chip.getAttribute('data-province') === provName) chip.classList.add('active');
        else chip.classList.remove('active');
      }
    });
  }

  function renderSelectedAreaAnalysis() {
    const titleEl = document.getElementById('area-detail-title');
    const badgeEl = document.getElementById('area-detail-badge');
    const kpiRev = document.getElementById('area-kpi-rev');
    const kpiOrders = document.getElementById('area-kpi-orders');
    const kpiAOV = document.getElementById('area-kpi-aov');
    const kpiReview = document.getElementById('area-kpi-review');
    const kpiDeliv = document.getElementById('area-kpi-deliv');
    const topProdTbody = document.getElementById('area-top-products-tbody');

    let totalRev = 0, totalOrders = 0, avgReview = 0, avgDeliv = 0;
    let categoriesObj = {}, channelsObj = {}, paymentsObj = {};
    let topProducts = [];

    if (selectedProvince !== 'ทั้งหมด') {
      // Specific province
      const allP = getAllProvinces();
      const p = allP.find((item) => item.name === selectedProvince);
      if (p) {
        if (titleEl) titleEl.textContent = `📍 จังหวัด ${p.name}`;
        if (badgeEl) badgeEl.textContent = p.region;
        totalRev = p.revenue;
        totalOrders = p.orders;
        avgReview = p.avgReview;
        avgDeliv = p.avgDeliv;
        categoriesObj = p.categories;
        channelsObj = p.channels;
        paymentsObj = p.payments;
        topProducts = p.topProducts || [];
      }
    } else if (selectedRegion !== 'ทั้งหมด') {
      // Whole specific region
      const reg = data.regions.find((r) => r.name === selectedRegion);
      if (reg) {
        if (titleEl) titleEl.textContent = `🗺️ ${reg.name} (ภาพรวมทุกจังหวัด)`;
        if (badgeEl) badgeEl.textContent = `${reg.provinces.length} จังหวัด`;
        totalRev = reg.revenue;
        totalOrders = reg.orders;
        avgReview = reg.avgReview;
        avgDeliv = 2.4; // Average region delivery
        categoriesObj = reg.categories;
        channelsObj = reg.channels;
        paymentsObj = reg.payments;

        // Merge top products across region
        const prodMap = {};
        reg.provinces.forEach((p) => {
          (p.topProducts || []).forEach((tp) => {
            if (!prodMap[tp.product]) prodMap[tp.product] = { product: tp.product, total: 0, qty: 0 };
            prodMap[tp.product].total += tp.total;
            prodMap[tp.product].qty += tp.qty;
          });
        });
        topProducts = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 5);
      }
    } else {
      // Entire nation
      if (titleEl) titleEl.textContent = `🇹🇭 ประเทศไทย (ภาพรวมทุกภาค)`;
      if (badgeEl) badgeEl.textContent = '25 จังหวัด 5 ภูมิภาค';
      totalRev = data.meta.totalRevenue;
      totalOrders = data.meta.cleanRecords;
      avgReview = 4.2;
      avgDeliv = 2.3;

      data.categories.forEach((c) => { categoriesObj[c.name] = c.revenue; });
      data.channels.forEach((c) => { channelsObj[c.name] = c.orders; });
      data.payments.forEach((p) => { paymentsObj[p.name] = p.orders; });

      // National top products
      const prodMap = {};
      getAllProvinces().forEach((p) => {
        (p.topProducts || []).forEach((tp) => {
          if (!prodMap[tp.product]) prodMap[tp.product] = { product: tp.product, total: 0, qty: 0 };
          prodMap[tp.product].total += tp.total;
          prodMap[tp.product].qty += tp.qty;
        });
      });
      topProducts = Object.values(prodMap).sort((a, b) => b.total - a.total).slice(0, 5);
    }

    // Populate mini KPIs
    if (kpiRev) kpiRev.textContent = '฿' + totalRev.toLocaleString('th-TH');
    if (kpiOrders) kpiOrders.textContent = totalOrders.toLocaleString('th-TH');
    if (kpiAOV) kpiAOV.textContent = '฿' + Math.round(totalRev / (totalOrders || 1)).toLocaleString('th-TH');
    if (kpiReview) kpiReview.textContent = `${avgReview} ★`;
    if (kpiDeliv) kpiDeliv.textContent = `${avgDeliv} วัน`;

    // Populate top products table
    if (topProdTbody) {
      topProdTbody.innerHTML = '';
      if (topProducts.length === 0) {
        topProdTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:16px;">ไม่มีข้อมูล</td></tr>';
      } else {
        topProducts.forEach((p, idx) => {
          const tr = document.createElement('tr');
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '✨';
          tr.innerHTML = `
            <td><strong>${medal} ${p.product}</strong></td>
            <td>${p.qty.toLocaleString()} ชิ้น</td>
            <td><strong style="color:var(--sakura-deep)">฿${p.total.toLocaleString()}</strong></td>
          `;
          topProdTbody.appendChild(tr);
        });
      }
    }

    // Render Province Charts
    renderChart('chart-area-category', 'bar', {
      data: {
        labels: Object.keys(categoriesObj),
        datasets: [{
          label: 'ยอดขาย (บาท)',
          data: Object.values(categoriesObj),
          backgroundColor: animeColors.palette,
          borderRadius: 6
        }]
      },
      scales: {
        x: { ticks: { maxRotation: 30 } },
        y: { beginAtZero: true, ticks: { callback: (v) => '฿' + (v / 1000).toFixed(0) + 'k' } }
      }
    });

    renderChart('chart-area-channel', 'doughnut', {
      data: {
        labels: Object.keys(channelsObj),
        datasets: [{
          data: Object.values(channelsObj),
          backgroundColor: ['#FF85A2', '#64B5F6', '#4FD1C5', '#F6AD55']
        }]
      }
    });

    renderChart('chart-area-payment', 'pie', {
      data: {
        labels: Object.keys(paymentsObj),
        datasets: [{
          data: Object.values(paymentsObj),
          backgroundColor: ['#4FD1C5', '#FF85A2', '#F6AD55', '#9D84B7', '#CBD5E0']
        }]
      }
    });
  }

  // --- Populate Wet Waste (ขยะเปียก) Table ---
  function populateTrashTable() {
    const tbody = document.getElementById('trash-table-body');
    const searchInput = document.getElementById('trash-search-input');
    const countBadge = document.getElementById('trash-count-badge');
    if (!tbody) return;

    if (countBadge) {
      countBadge.textContent = `${data.trash.length} รายการ`;
    }

    function renderTable(list) {
      tbody.innerHTML = '';
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:24px; color:#A0AEC0;">ไม่พบข้อมูลที่ตรงกับคำค้นหา</td></tr>';
        return;
      }
      list.forEach((item) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${item.orderId}</strong></td>
          <td>${item.custId}</td>
          <td><span class="tag tag-trash" style="font-size:0.85rem; font-weight:800;">${item.age} ปี</span></td>
          <td>${item.gender}</td>
          <td>${item.province} <span class="tag tag-region">${item.region}</span></td>
          <td>${item.product} <br><small style="color:var(--text-muted)">(${item.category})</small></td>
          <td><strong>฿${item.total.toLocaleString()}</strong></td>
          <td><span class="tag ${item.status === 'สำเร็จ' ? 'tag-success' : 'tag-trash'}">${item.status}</span></td>
          <td><small style="color:#C53030;">${item.reason}</small></td>
        `;
        tbody.appendChild(tr);
      });
    }

    renderTable(data.trash);

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        if (!query) {
          renderTable(data.trash);
          return;
        }
        const filtered = data.trash.filter((t) => {
          return (
            t.orderId.toLowerCase().includes(query) ||
            t.custId.toLowerCase().includes(query) ||
            t.province.toLowerCase().includes(query) ||
            t.region.toLowerCase().includes(query) ||
            t.product.toLowerCase().includes(query) ||
            t.category.toLowerCase().includes(query) ||
            String(t.age).includes(query)
          );
        });
        renderTable(filtered);
      });
    }

    // Export CSV Button
    const exportBtn = document.getElementById('btn-export-trash');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        playCuteSound('chime');
        exportTrashCSV();
      });
    }
  }

  function exportTrashCSV() {
    const headers = ['รหัสคำสั่งซื้อ', 'วันที่', 'รหัสลูกค้า', 'เพศ', 'อายุ', 'จังหวัด', 'ภาค', 'หมวดหมู่', 'ชื่อสินค้า', 'ยอดรวมสุทธิ', 'วิธีชำระเงิน', 'สถานะ', 'เหตุผลคัดแยก'];
    const rows = data.trash.map((t) => [
      t.orderId, t.date, t.custId, t.gender, t.age, t.province, t.region, t.category, `"${t.product}"`, t.total, t.payment, t.status, `"${t.reason}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trash_records_wet_waste.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Modal: Slide Overview Thumbnails ---
  function initSlideModal() {
    const modal = document.getElementById('slide-overview-modal');
    const openBtn = document.getElementById('btn-open-slides-overview');
    const closeBtn = document.getElementById('btn-close-modal');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        playCuteSound('chime');
        modal.classList.add('active');
      });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        playCuteSound('pop');
        modal.classList.remove('active');
      });
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    document.querySelectorAll('.slide-thumb-card').forEach((card) => {
      card.addEventListener('click', function () {
        playCuteSound('pop');
        const sNum = parseInt(this.getAttribute('data-slide'), 10);
        showSlide(sNum);
        if (modal) modal.classList.remove('active');
        // Scroll to slide
        const el = document.getElementById('slide-manager-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // --- View Mode Tabs Switcher ---
  function initViewTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', function () {
        playCuteSound('pop');
        tabs.forEach((t) => t.classList.remove('active'));
        this.classList.add('active');
        const view = this.getAttribute('data-view');

        const slideSec = document.getElementById('slide-manager-section');
        const explorerSec = document.getElementById('region-explorer-section');
        const trashSec = document.getElementById('trash-section');

        if (view === 'all') {
          if (slideSec) slideSec.style.display = 'block';
          if (explorerSec) explorerSec.style.display = 'block';
          if (trashSec) trashSec.style.display = 'block';
        } else if (view === 'slides') {
          if (slideSec) slideSec.style.display = 'block';
          if (explorerSec) explorerSec.style.display = 'none';
          if (trashSec) trashSec.style.display = 'none';
        } else if (view === 'regions') {
          if (slideSec) slideSec.style.display = 'none';
          if (explorerSec) explorerSec.style.display = 'block';
          if (trashSec) trashSec.style.display = 'none';
        } else if (view === 'trash') {
          if (slideSec) slideSec.style.display = 'none';
          if (explorerSec) explorerSec.style.display = 'none';
          if (trashSec) trashSec.style.display = 'block';
        }
      });
    });
  }

  // --- Header Action Buttons ---
  function initHeaderControls() {
    const sakuraBtn = document.getElementById('btn-toggle-sakura');
    if (sakuraBtn) {
      sakuraBtn.addEventListener('click', function () {
        sakuraActive = !sakuraActive;
        this.classList.toggle('active', sakuraActive);
        this.title = sakuraActive ? 'ซากุระ: เปิดอยู่' : 'ซากุระ: ปิดอยู่';
        playCuteSound('pop');
        if (!sakuraActive && ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    }

    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        soundEnabled = !soundEnabled;
        this.classList.toggle('active', soundEnabled);
        this.title = soundEnabled ? 'เสียง: เปิดอยู่' : 'เสียง: ปิดอยู่';
        if (soundEnabled) playCuteSound('chime');
      });
    }

    const jumpTrashBtn = document.getElementById('btn-jump-to-trash');
    if (jumpTrashBtn) {
      jumpTrashBtn.addEventListener('click', () => {
        playCuteSound('chime');
        // Show trash tab or scroll to trash section
        const trashTab = document.querySelector('.tab-btn[data-view="trash"]');
        if (trashTab) trashTab.click();
        const trashSec = document.getElementById('trash-section');
        if (trashSec) {
          trashSec.style.display = 'block';
          trashSec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Slide Controls
    const prevBtn = document.getElementById('btn-prev-slide');
    const nextBtn = document.getElementById('btn-next-slide');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        playCuteSound('pop');
        showSlide(currentSlide - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        playCuteSound('pop');
        showSlide(currentSlide + 1);
      });
    }

    // Keyboard navigation for slides
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        showSlide(currentSlide + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        showSlide(currentSlide - 1);
      }
    });
  }

  // --- Main Bootstrapper ---
  window.addEventListener('DOMContentLoaded', () => {
    populateKPIs();
    initHeaderControls();
    initViewTabs();
    initSlideModal();
    initRegionExplorer();
    populateTrashTable();
    showSlide(1);
    console.log('🌸 NekoSales Analytics initialized successfully! ✨');
  });
})();
