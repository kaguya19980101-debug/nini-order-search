/**
 * 妮妮訂單查詢系統 - 前端邏輯
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 共用功能：側邊選單控制 ---
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('active');
            overlay.classList.add('active');
        });
    }

    const closeActions = [menuClose, overlay];
    closeActions.forEach(el => {
        if (el) {
            el.addEventListener('click', () => {
                sideMenu.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    });

        // 初始化輪播圖
    const swiper = new Swiper('.swiper', {
        loop: true,               // 循環播放
        autoplay: {
            delay: 3000,          // 3秒切換一次
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    });
    // --- 2. 查詢按鈕處理 ---
    const submitBtn = document.getElementById('submit-query');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            const community = document.getElementById('community-name').value.trim();
            const phone = document.getElementById('phone-number').value.trim();

            if (!community || !phone) {
                alert('妮妮提醒：資訊要填完整喔！');
                return;
            }

            const isQueryPage = window.location.pathname.includes('query.html');
            if (isQueryPage) {
                fetchDataFromGAS(community, phone);
            } else {
                window.location.href = `query.html?community=${encodeURIComponent(community)}&phone=${encodeURIComponent(phone)}`;
            }
        });
    }

    // --- 3. 自動觸發網址參數查詢 ---
    const urlParams = new URLSearchParams(window.location.search);
    const communityParam = urlParams.get('community');
    const phoneParam = urlParams.get('phone');

    if (communityParam && phoneParam) {
        const communityInput = document.getElementById('community-name');
        const phoneInput = document.getElementById('phone-number');
        if (communityInput) communityInput.value = communityParam;
        if (phoneInput) phoneInput.value = phoneParam;
        fetchDataFromGAS(communityParam, phoneParam);
    }


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

function fetchDataFromGAS(community, phone) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzsi7XRN0ZlzP5KX-_5D01Uleb8zBaux1hyAdnTI8yVh6q9NGN6LAx2uHNioVWVIgMe/exec';
    
    // 💡 修正處：這裡的 ID 必須跟 HTML 的 <div id="cards-container"> 一致
    const container = document.getElementById('cards-container'); 
    const resultSection = document.getElementById('result-section');
    const btn = document.getElementById('submit-query');

    if (btn) btn.innerText = '尋找中...';

    fetch(`${scriptURL}?community=${encodeURIComponent(community)}&phone=${encodeURIComponent(phone)}`)
        .then(response => response.json())
        .then(data => {
            console.log("收到資料:", data);
            if (data.status === 'success' && data.orders && data.orders.length > 0) {
                const sorted = data.orders.sort((a, b) => b.dateValue - a.dateValue);
                container.innerHTML = sorted.map(order => {
                const statusClass = order.status === '已完成' ? 'status-completed' : 'status-pending';
                
                // 💡 邏輯判斷：如果 balance 轉換成數字後大於 0，就加上醒目的 class
                const balanceAmount = parseFloat(order.balance) || 0;
                const balanceClass = balanceAmount > 0 ? 'has-balance' : '';

                return `
                    <div class="order-card">
                        <!-- 狀態標籤現在由 CSS 定位在右上角 -->
                        <div class="status-badge ${statusClass}">${order.status}</div>

                        <div class="card-header">
                            <span class="type-tag">${order.type || '一般'}</span>
                            <span class="order-date">${order.date}</span>
                        </div>

                        <div class="item-name">${order.item}</div> 

                        <div class="price-info">
                            <div class="price-item">
                                <i class="fas fa-tag"></i><span>價格</span>
                                <strong>$${order.price}</strong>
                            </div>
                            <div class="price-item">
                                <i class="fas fa-hand-holding-usd"></i><span>已付</span>
                                <strong>$${order.paid}</strong>
                            </div>
                            <div class="price-item">
                                <i class="fas fa-exclamation-circle"></i><span>剩餘</span>
                                <strong class="${balanceClass}">$${order.balance}</strong>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
                if (resultSection) resultSection.style.display = 'block';
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
            if (btn) btn.innerHTML = '<i class="fas fa-magic"></i> 開始查詢';
        });
}

let allNotices = [];
let currentPage = 1;
const rowsPerPage = 7;

// 載入公告資料公告資料公告資料公告資料公告資料公告資料
function loadNotices() {
    fetch('notices.json')
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
        div.innerHTML = `
            <div class="notice-tag">${item.tag}</div>
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

// 記得在 DOMContentLoaded 呼叫
document.addEventListener('DOMContentLoaded', () => {
    loadNotices();
    // ... 原本的選單邏輯
});
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