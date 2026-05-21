/**
 * 妮妮訂單查詢系統 - 前端邏輯
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("JS 啟動成功！目前的頁面是：", window.location.pathname);
// --- 1. 側邊選單通用邏輯 (每一頁都有用) ---
    const menuToggle = document.getElementById('menu-toggle'); // 三條線按鈕
    console.log("漢堡鈕物件狀態：", menuToggle); // 如果顯示 null，就是 HTML ID 寫錯了
    const menuClose = document.getElementById('menu-close');   // 側邊欄內的叉叉
    const sideMenu = document.getElementById('side-menu');     // 選單容器
    const overlay = document.getElementById('overlay');       // 霧面背景

    // 打開選單
    if (menuToggle && sideMenu && overlay) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('active');
            overlay.classList.add('active');
        });
    }

   // 關閉選單 (寫成一個 function 讓叉叉和霧面背景都能用)
    const closeMenu = () => {
        if (sideMenu) sideMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    };

    if (menuClose) menuClose.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);


    // --- 2. 只有特定頁面才跑的邏輯 (用 if 防呆) ---
    
    // 只有首頁有公告
    if (document.getElementById('notice-list')) {
        loadNotices();
    }

    // 現貨賣場
    initShop();
    const shopModalClose = document.getElementById('shop-modal-close');
    if (shopModalClose) shopModalClose.addEventListener('click', closeShopModal);
    const shopModal = document.getElementById('shop-modal');
    if (shopModal) shopModal.addEventListener('click', e => { if (e.target === shopModal) closeShopModal(); });

// --- 初始化輪播圖：從 banners.json 讀取 ---
    const swiperElement = document.querySelector('.swiper');
    if (swiperElement) {
        fetch('https://raw.githubusercontent.com/kaguya19980101-debug/nini-data/main/banners.json')
            .then(r => r.json())
            .then(banners => {
                const wrapper = document.querySelector('.swiper-wrapper');
                wrapper.innerHTML = banners.map(b => `
                    <div class="swiper-slide">
                        ${b.clickable && b.url
                            ? `<a href="${b.url}" target="_blank"><img src="${b.img}" alt="${b.alt}"></a>`
                            : `<img src="${b.img}" alt="${b.alt}">`
                        }
                    </div>
                `).join('');
                new Swiper('.swiper', {
                    loop: true,
                    autoplay: { delay: 3000, disableOnInteraction: false },
                    pagination: { el: '.swiper-pagination', clickable: true },
                });
            })
            .catch(() => {
                // 讀取失敗時 swiper 保持空白，不影響其他功能
            });
    }
    
    // --- 2. 查詢按鈕處理 ---
    const submitBtn = document.getElementById('submit-query');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const community = document.getElementById('community-name').value.trim();
            const phone = document.getElementById('phone-number').value.trim();

            if (!community || !phone) {
                showToast('請把社群名稱和手機號碼填完整喔！');
                return;
            }

            window.location.href = `query.html?community=${encodeURIComponent(community)}&phone=${encodeURIComponent(phone)}`;
        });
    }
    
    // 💡 加分題：如果是從首頁跳過來的，自動幫他查一次
    autoQueryOnLoad();
    // 在原本的選單邏輯下方加入這段 布告欄談窗開關
    const confirmBtn = document.getElementById('modal-confirm');
    const modal = document.getElementById('notice-modal');

    if (confirmBtn) confirmBtn.onclick = closeNoticeModal;
    
    // 點擊彈窗以外的區域（背景遮罩）也要能關閉
    window.onclick = (event) => {
        if (event.target == modal) {
            closeNoticeModal();
        }
    };
});

// 自動查詢功能
function autoQueryOnLoad() {
    const params = new URLSearchParams(window.location.search);
    const comm = params.get('community');
    const phone = params.get('phone');
    
    if (comm && phone && document.getElementById('cards-container')) {
        // 把網址帶過來的參數填入輸入框
        document.getElementById('community-name').value = comm;
        document.getElementById('phone-number').value = phone;
        // 直接啟動查詢
        fetchDataFromGAS(comm, phone);
    }
}
/**
 * 通用查詢函式
 */
function fetchDataFromGAS(community, phone) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzsi7XRN0ZlzP5KX-_5D01Uleb8zBaux1hyAdnTI8yVh6q9NGN6LAx2uHNioVWVIgMe/exec';
    
    const container = document.getElementById('cards-container'); 
    const resultSection = document.getElementById('result-section');
    const btn = document.getElementById('submit-query');

    // 💡 1. 開始查詢：按鈕變灰並禁用 (loading 樣式)
    if (btn) {
        btn.classList.add('loading'); // 加上我們剛剛定義的灰色樣式
        btn.disabled = true;          // 實體禁用，防止重複連點
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 尋找中...'; 
    }

    fetch(`${scriptURL}?community=${encodeURIComponent(community)}&phone=${encodeURIComponent(phone)}`)
        .then(response => response.json())
        .then(data => {
            console.log("收到資料:", data);
            
            // 💡 檢查容器是否存在 (防呆)
            if (!container) return;

            if (data.status === 'success' && data.orders && data.orders.length > 0) {
                const sorted = data.orders.sort((a, b) => b.dateValue - a.dateValue);
                container.innerHTML = sorted.map(order => {
                    const statusMap = {
                        '已完成': 'status-done',
                        '已出貨': 'status-shipped',
                        '已抵台': 'status-arrived',
                        '運回中': 'status-transit',
                        '已購入': 'status-bought',
                        '待採買': 'status-pending',
                        '已取消': 'status-cancelled',
                    };
                    const statusClass = statusMap[order.status] || 'status-pending';
                    const balanceAmount = parseFloat(order.balance) || 0;
                    const hasBalance = balanceAmount > 0;

                    return `
                        <div class="order-card">
                            <div class="card-header">
                                <span class="type-tag">${order.type || '一般'}</span>
                                <span class="order-date">${order.date}</span>
                                <span class="status-badge ${statusClass}">${order.status}</span>
                            </div>
                            <div class="item-name">${order.item}</div> 
                            <div class="price-info">
                                <div class="price-item">
                                    <i class="fas fa-coins"></i><span>價格</span>
                                    <strong>$${order.price}</strong>
                                </div>
                                <div class="price-item">
                                    <i class="fas fa-check-circle"></i><span>已付</span>
                                    <strong>$${order.paid}</strong>
                                </div>
                                <div class="price-item ${hasBalance ? 'has-balance-item' : ''}">
                                    <i class="fas fa-wallet"></i><span>剩餘</span>
                                    <strong>$${order.balance}</strong>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                if (resultSection) resultSection.style.display = 'block';
                initFilter();
            } else {
                container.innerHTML = '<p style="text-align:center; padding:20px;">找不到您的訂單，請檢查輸入資訊喔！</p>';
                if (resultSection) resultSection.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('發生錯誤:', error);
            if (container) container.innerHTML = '<p style="text-align:center; color:red;">連線失敗，請檢查網路。</p>';
        })
        .finally(() => {
            // 💡 2. 結束查詢：恢復按鈕原本樣式
            if (btn) {
                btn.classList.remove('loading');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-magic"></i> 開始查詢';
            }
        });
}

let allNotices = [];
let currentPage = 1;
const rowsPerPage = 7;

// 載入公告資料公告資料公告資料公告資料公告資料公告資料
function loadNotices() {
    // 💡 先檢查有沒有公告欄，沒有的話就直接收工
    if (!document.getElementById('notice-list')) return;
    
    fetch('https://raw.githubusercontent.com/kaguya19980101-debug/nini-data/main/notices.json')
        .then(res => res.json())
        .then(data => {
            allNotices = data.sort((a, b) => b.id - a.id); // 按 ID 倒序排列
            displayNotices(currentPage);
        })
        .catch(err => console.error("公告讀取失敗:", err));
}

function displayNotices(page) {
    const listElement = document.getElementById('notice-list');
    const paginationElement = document.getElementById('pagination');
    listElement.innerHTML = "";
    
    // 計算分頁範圍
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedItems = allNotices.slice(start, end);

    // 渲染公告 (只顯示標題)[cite: 4]
    paginatedItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'notice-item';
        const tagClass = { NEW: 'notice-tag-new', INFO: 'notice-tag-info', SALE: 'notice-tag-sale' }[item.tag] || 'notice-tag-info';
        div.innerHTML = `
            <div class="notice-tag ${tagClass}">${item.tag}</div>
            <div class="notice-body">
                <span class="date">${item.date}</span>
                <p><strong>${item.title}</strong></p>
            </div>
        `;
        // 點擊可以 alert 顯示內容 (或展開)
       div.onclick = () => openNoticeModal(item); 
        listElement.appendChild(div);
    });
    // 渲染分頁按鈕
    renderPagination(allNotices.length, page);
}

function renderPagination(totalItems, page) {
    const paginationElement = document.getElementById('pagination');
    const pageCount = Math.ceil(totalItems / rowsPerPage);
    paginationElement.innerHTML = "";

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = (i === page) ? 'page-btn active' : 'page-btn';
        btn.onclick = () => {
            currentPage = i;
            displayNotices(currentPage);
        };
        paginationElement.appendChild(btn);
    }
}


/**
 * 彈窗控制功能[cite: 2, 4]
 */

// 顯示彈窗：把 JSON 裡的資料塞進 HTML 標籤裡
function openNoticeModal(item) {
    const modal = document.getElementById('notice-modal');
    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-date').innerText = item.date;
    document.getElementById('modal-text').innerText = item.content;
    
    modal.style.display = 'flex'; // 讓隱藏的彈窗顯示出來
}

// 關閉彈窗
function closeNoticeModal() {
    document.getElementById('notice-modal').style.display = 'none';
}

// ── 現貨賣場 ──────────────────────────────────────────
/**
 * 商品資料，新增商品只需在此陣列加一筆：
 * {
 *   id:    唯一編號,
 *   name:  商品名稱,
 *   tag:   分類標籤 (e.g. '扭蛋' / '週邊' / '生活'),
 *   desc:  簡短說明,
 *   price: 價格文字 (e.g. '$120'),
 *   img:   圖片路徑或 URL,
 *   url:   賣場連結,
 **/
function initShop() {
    if (!document.getElementById('shop-grid')) return;

    const grid       = document.getElementById('shop-grid');
    const empty      = document.getElementById('shop-empty');
    const countEl    = document.getElementById('shop-count');
    const searchInput = document.getElementById('shop-search');
    const clearBtn    = document.getElementById('shop-clear');

    let allItems = [];

    function renderItems(items) {
        grid.innerHTML = '';
        const show = items.length > 0;
        empty.style.display = show ? 'none' : 'flex';
        countEl.textContent = show ? `共 ${items.length} 件商品` : '';

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-card';
            card.innerHTML = `
                <div class="shop-card-img-wrap">
                    <img src="${item.img}" alt="${item.name}" loading="lazy"
                         onerror="this.src='images/shop/placeholder.jpg'">
                    <span class="shop-card-tag">${item.tag}</span>
                </div>
                <div class="shop-card-info">
                    <p class="shop-card-name">${item.name}</p>
                    <p class="shop-card-price">${item.price}</p>
                </div>
            `;
            card.addEventListener('click', () => openShopModal(item));
            grid.appendChild(card);
        });
    }

    function filter() {
        const q = searchInput.value.trim().toLowerCase();
        clearBtn.style.display = q ? 'flex' : 'none';
        const filtered = allItems.filter(i =>
            i.name.toLowerCase().includes(q) ||
            i.tag.toLowerCase().includes(q) ||
            i.desc.toLowerCase().includes(q)
        );
        renderItems(filtered);
    }

    searchInput.addEventListener('input', filter);
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        renderItems(allItems);
    });

    // 從 JSON 讀取
    fetch('https://raw.githubusercontent.com/kaguya19980101-debug/nini-data/main/shop.json')
        .then(r => r.json())
        .then(data => {
            allItems = data;
            renderItems(allItems);
        })
        .catch(() => {
            empty.style.display = 'flex';
            countEl.textContent = '';
        });
}

function openShopModal(item) {
    document.getElementById('shop-modal-img').src      = item.img;
    document.getElementById('shop-modal-title').textContent = item.name;
    document.getElementById('shop-modal-tag').textContent   = item.tag;
    document.getElementById('shop-modal-desc').textContent  = item.desc;
    document.getElementById('shop-modal-price').textContent = item.price;
    document.getElementById('shop-modal-link').href         = item.url;
    document.getElementById('shop-modal').style.display = 'flex';
}

function closeShopModal() {
    document.getElementById('shop-modal').style.display = 'none';
}

// 篩選邏輯
function initFilter() {
    const allChk = document.getElementById('filter-all');
    const statusChks = document.querySelectorAll('.filter-status');
    if (!allChk) return;

    // 計算各狀態筆數並更新標籤
    function updateCounts() {
        const cards = document.querySelectorAll('.order-card');
        const total = cards.length;

        // 全部
        const allSpan = allChk.closest('.filter-chip').querySelector('span');
        allSpan.innerHTML = `全部 <em class="chip-count">${total}</em>`;

        // 各狀態
        statusChks.forEach(chk => {
            const val = chk.value;
            const count = [...cards].filter(card => {
                const badge = card.querySelector('.status-badge');
                return badge && badge.textContent.trim() === val;
            }).length;
            const span = chk.closest('.filter-chip').querySelector('span');
            span.innerHTML = `${val} <em class="chip-count">${count}</em>`;
        });
    }

    function applyFilter() {
        const checked = [...statusChks].filter(c => c.checked).map(c => c.value);
        document.querySelectorAll('.order-card').forEach(card => {
            const badge = card.querySelector('.status-badge');
            const status = badge ? badge.textContent.trim() : '';
            card.style.display = checked.includes(status) ? 'block' : 'none';
        });
    }

    updateCounts();

    allChk.addEventListener('change', () => {
        statusChks.forEach(c => c.checked = allChk.checked);
        applyFilter();
    });

    statusChks.forEach(chk => {
        chk.addEventListener('change', () => {
            allChk.checked = [...statusChks].every(c => c.checked);
            applyFilter();
        });
    });
}

// Toast 提示
function showToast(msg) {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}