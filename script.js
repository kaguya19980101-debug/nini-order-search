document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const menuClose = document.getElementById('menu-close');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');

    // 開啟選單
    menuToggle.addEventListener('click', () => {
        sideMenu.classList.add('active');
        overlay.classList.add('active');
    });

    // 關閉選單 (按 X 鈕)
    menuClose.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    });

    // 關閉選單 (點擊透明遮罩區)
    overlay.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // --- 共用功能：側邊選單 ---
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

    if (menuClose) {
        menuClose.addEventListener('click', () => {
            sideMenu.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // --- 查詢功能：僅在 query.html 執行 ---
    const submitBtn = document.getElementById('submit-query');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            const community = document.getElementById('community-name').value.trim();
            const phone = document.getElementById('phone-number').value.trim();

            if (!community || !phone) {
                alert('妮妮提醒：資訊要填完整才能幫你找喔！');
                return;
            }

            // 執行 fetch 與渲染卡片的邏輯 (同前次提供的內容)
            fetchDataFromGAS(community, phone); 
        });
    }
});

// 將 fetch 邏輯封裝成 function 方便維護
function fetchDataFromGAS(community, phone) {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzsi7XRN0ZlzP5KX-_5D01Uleb8zBaux1hyAdnTI8yVh6q9NGN6LAx2uHNioVWVIgMe/exec';
    const container = document.getElementById('cards-container');
    const resultSection = document.getElementById('result-section');
    const btn = document.getElementById('submit-query');

    btn.innerText = '尋找中...';

    fetch(`${scriptURL}?community=${encodeURIComponent(community)}&phone=${phone}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // 依日期排序 (新到舊)
                const sorted = data.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
                
               container.innerHTML = sorted.map(order => `
                <div class="order-card">
                    <div class="card-header">
                        <span class="type-tag">${order.type || '一般'}</span>
                        <span class="order-date">${order.date}</span>
                    </div>
                    <div class="item-name">${order.item}</div> 
                    <div class="status-badge ${order.status === '已完成' ? 'status-completed' : ''}">
                        ${order.status}
                    </div>
                    <div class="price-info">
                        <div class="price-item"><span>價格</span><strong>$${order.price}</strong></div>
                        <div class="price-item"><span>已付</span><strong>$${order.paid}</strong></div>
                        <div class="price-item"><span>剩餘</span><strong class="remaining">$${order.balance}</strong></div>
                    </div>
                </div>
            `).join('');
                resultSection.style.display = 'block';
            } else {
                alert('查無資料，請確認社群名稱與手機喔！');
            }
        })
        .finally(() => {
            btn.innerHTML = '<i class="fas fa-magic"></i> 開始查詢';
        });
}