(function () {
  const doc = document.documentElement
  doc.classList.remove('no-js')
  doc.classList.add('js')

  const DATA_URL = 'data/shops.json'
  const districtSelect = document.getElementById('districtFilter')
  const sortSelect = document.getElementById('sortSelect')
  const ratingSelect = document.getElementById('ratingFilter')
  const keywordInput = document.getElementById('keywordFilter')
  const resetButton = document.getElementById('resetFilters')
  const ctaTop = document.getElementById('ctaTop')
  const sectionsContainer = document.getElementById('districtSections')
  const heroStats = {
    count: document.querySelector('[data-stat="count"]'),
    best: document.querySelector('[data-stat="best"]'),
    reviews: document.querySelector('[data-stat="reviews"]')
  }

  const state = {
    stores: [],
    filtered: []
  }

  function parseNumber(value) {
    const num = typeof value === 'number' ? value : parseFloat(value)
    return Number.isFinite(num) ? num : 0
  }

  function inferDistrict(address) {
    if (!address) return '板橋區'
    const match = /(板橋|新莊|中和|永和|三重|新店|土城|樹林)/.exec(address)
    return match ? `${match[1]}區` : '板橋區'
  }

  function normalize(entries) {
    return entries
      .filter((entry) => entry && entry.qBF1Pd === undefined)
      .map((entry, index) => {
        const rating = parseNumber(entry.rating ?? entry['評分'])
        const reviews = parseInt(entry.reviews ?? entry['評分數'], 10) || 0
        return {
          id: index,
          name: entry.name ?? entry.qBF1Pd ?? '未命名店家',
          rating,
          reviews,
          address: entry.address ?? entry[''] ?? '',
          phone: entry.phone ?? entry.UsdlK ?? '',
          map_url: entry.map_url ?? entry.href ?? entry['hfpxzc href'] ?? '#',
          image_url: entry.image_url ?? entry['FQ2IWe src'] ?? '',
          district: entry.district || inferDistrict(entry.address ?? ''),
          raw: entry
        }
      })
  }

  function sortStores(stores, sortKey) {
    const comparator = sortKey === 'reviews'
      ? (a, b) => b.reviews - a.reviews || b.rating - a.rating
      : (a, b) => b.rating - a.rating || b.reviews - a.reviews
    return [...stores].sort(comparator)
  }

  function filterStores() {
    const district = districtSelect.value
    const minRating = parseNumber(ratingSelect.value)
    const keyword = keywordInput.value.trim().toLowerCase()

    let results = [...state.stores]
    if (district !== 'all') {
      results = results.filter((store) => store.district === district)
    }
    results = results.filter((store) => store.rating >= minRating)
    if (keyword) {
      results = results.filter((store) =>
        store.name.toLowerCase().includes(keyword) ||
        (store.address && store.address.toLowerCase().includes(keyword))
      )
    }

    results = sortStores(results, sortSelect.value)
    state.filtered = results
    renderSections(results)
    updateHero(results)
  }

  function renderSections(stores) {
    if (!sectionsContainer) return

    if (!stores.length) {
      sectionsContainer.innerHTML = '<div class="empty-state">找不到符合條件的店家，請調整篩選條件。</div>'
      return
    }

    const grouped = stores.reduce((acc, store) => {
      acc[store.district] = acc[store.district] || []
      acc[store.district].push(store)
      return acc
    }, {})

    sectionsContainer.innerHTML = ''

    Object.keys(grouped).forEach((district) => {
      const entries = grouped[district]
      const section = document.createElement('article')
      section.className = 'district-section'
      section.id = `district-${district}`
      section.appendChild(renderDistrictHeader(district, entries))
      section.appendChild(renderShopGrid(entries))
      section.appendChild(renderFaq())
      sectionsContainer.appendChild(section)
    })
  }

  function renderDistrictHeader(district, entries) {
    const header = document.createElement('div')
    header.className = 'district-header'
    const averageRating = (entries.reduce((sum, item) => sum + item.rating, 0) / entries.length) || 0
    const averageReviews = (entries.reduce((sum, item) => sum + item.reviews, 0) / entries.length) || 0

    header.innerHTML = `
      <div>
        <p class="eyebrow">${district}</p>
        <h2>${district} 精選花店</h2>
        <p>依評分、評價數排序，快速挑選「立即訂花」、「導航」或「打電話」。</p>
      </div>
      <div class="district-stats" aria-label="區域摘要">
        <div class="stat-card"><div class="label">平均評分</div><div class="value">${averageRating.toFixed(2)}</div></div>
        <div class="stat-card"><div class="label">平均評價數</div><div class="value">${Math.round(averageReviews)}</div></div>
        <div class="stat-card"><div class="label">收錄店家</div><div class="value">${entries.length}</div></div>
      </div>
    `

    return header
  }

  function renderShopGrid(entries) {
    const grid = document.createElement('div')
    grid.className = 'shop-grid'

    entries.forEach((store) => {
      const card = document.createElement('article')
      card.className = 'shop-card'
      const bg = store.image_url ? `background-image: url('${store.image_url}')` : 'background-image: linear-gradient(135deg, #fdf2f8, #ede9fe)'
      const callDisabled = !store.phone
      const directionsUrl = store.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}` : store.map_url

      card.innerHTML = `
        <div class="shop-card__image" style="${bg}"></div>
        <div class="shop-card__body">
          <div class="shop-card__title">
            <h3>${store.name}</h3>
            <span class="badge">${store.rating.toFixed(1)} ★</span>
          </div>
          <p class="meta">${store.reviews.toLocaleString()} 則評價</p>
          <p class="address">${store.address || '地址未提供'}</p>
          <div class="shop-card__cta">
            <a class="button button-primary" href="${store.map_url}" target="_blank" rel="noopener">立即訂花</a>
            <a class="button button-ghost" href="${directionsUrl}" target="_blank" rel="noopener">導航</a>
            <a class="button button-ghost" ${callDisabled ? 'aria-disabled="true"' : ''} ${callDisabled ? '' : `href="tel:${store.phone}"`}>打電話</a>
          </div>
        </div>
      `

      grid.appendChild(card)
    })

    return grid
  }

  function renderFaq() {
    const wrapper = document.createElement('div')
    wrapper.className = 'faq'
    const faqItems = [
      {
        q: '如何依評分挑店？',
        a: '排序預設依評分 (高→低)，若評分相同則看評價數。你也可以改用「評價數」排序。'
      },
      {
        q: '可以只看高於 4.5 分的店嗎？',
        a: '在「最低評分」選單選擇 4.5 以上，即可只留下高分店家。'
      },
      {
        q: 'CTA 有哪些？',
        a: '每張卡片提供「立即訂花」（連到地圖商家頁面）、「導航」（Google Maps 路徑）、「打電話」。'
      }
    ]

    wrapper.innerHTML = `
      <h3>常見 QA</h3>
      <div class="faq-list">
        ${faqItems.map((item) => `
          <div class="faq-item">
            <strong>${item.q}</strong>
            <p class="muted">${item.a}</p>
          </div>
        `).join('')}
      </div>
    `

    return wrapper
  }

  function updateHero(current) {
    if (!state.stores.length || !heroStats.count) return
    const target = current && current.length ? current : state.stores
    const highest = target.reduce((max, item) => item.rating > max ? item.rating : max, 0)
    const avgReviews = target.reduce((sum, item) => sum + item.reviews, 0) / target.length

    heroStats.count.textContent = `${target.length} 間`
    heroStats.best.textContent = `${highest.toFixed(1)} ★`
    heroStats.reviews.textContent = `${Math.round(avgReviews)} 則/店`
  }

  function populateDistrictOptions(stores) {
    const districts = Array.from(new Set(stores.map((store) => store.district)))
    districtSelect.innerHTML = `<option value="all">全部區域 (${stores.length})</option>` +
      districts.map((district) => `<option value="${district}">${district}</option>`).join('')
  }

  function attachEvents() {
    [districtSelect, sortSelect, ratingSelect].forEach((el) => el && el.addEventListener('change', filterStores))
    if (keywordInput) {
      keywordInput.addEventListener('input', () => {
        window.clearTimeout(keywordInput._debounce)
        keywordInput._debounce = window.setTimeout(filterStores, 150)
      })
    }
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        districtSelect.value = 'all'
        sortSelect.value = 'rating'
        ratingSelect.value = '0'
        keywordInput.value = ''
        filterStores()
      })
    }
    if (ctaTop) {
      ctaTop.addEventListener('click', () => {
        const firstButton = sectionsContainer.querySelector('.shop-card .button-primary')
        if (firstButton) firstButton.focus()
      })
    }
  }

  function boot() {
    fetch(DATA_URL)
      .then((res) => res.json())
      .then((data) => {
        state.stores = normalize(data)
        populateDistrictOptions(state.stores)
        attachEvents()
        filterStores()
      })
      .catch((error) => {
        console.error('載入資料失敗', error)
        if (sectionsContainer) {
          sectionsContainer.innerHTML = '<div class="empty-state">無法載入資料，請確認 data/shops.json 是否存在。</div>'
        }
      })
  }

  boot()
}())
