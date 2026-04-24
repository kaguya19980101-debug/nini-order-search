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