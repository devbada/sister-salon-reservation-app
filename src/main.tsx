import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// iOS WebView 수평 스크롤/바운스 방지
(function preventHorizontalScroll() {
  let touchStartX = 0;
  let touchStartY = 0;
  let isHorizontalScroll = false;

  // 터치 시작 시 초기 위치 저장
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isHorizontalScroll = false;
    }
  }, { passive: true });

  // 터치 이동 시 방향 판단 후 수평 이동 차단
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 첫 움직임에서 방향 결정 (5px 임계값)
    if (!isHorizontalScroll && (absDeltaX > 5 || absDeltaY > 5)) {
      // 수평 움직임이 더 크면 수평 스크롤로 판단
      if (absDeltaX > absDeltaY) {
        isHorizontalScroll = true;
      }
    }

    // 수평 스크롤로 판단되면 이벤트 차단
    if (isHorizontalScroll) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 페이지 전체가 왼쪽/오른쪽으로 움직이는 것 방지
    // body나 html의 scrollLeft가 0이 아니면 리셋
    if (window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
  }, { passive: false });

  // 터치 종료 시 플래그 리셋
  document.addEventListener('touchend', () => {
    isHorizontalScroll = false;
    // 스크롤 위치 정리
    if (window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
  }, { passive: true });

  // 스크롤 이벤트에서도 수평 스크롤 차단
  let lastScrollLeft = 0;
  window.addEventListener('scroll', () => {
    if (window.scrollX !== lastScrollLeft && window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
    lastScrollLeft = window.scrollX;
  }, { passive: true });

  // 리사이즈 시 스크롤 위치 초기화
  window.addEventListener('resize', () => {
    window.scrollTo(0, 0);
  }, { passive: true });

  // 추가: gesturestart, gesturechange, gestureend 차단 (iOS Safari 전용)
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('gestureend', (e) => {
    e.preventDefault();
  }, { passive: false });
})();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
