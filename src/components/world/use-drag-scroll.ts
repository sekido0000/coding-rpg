"use client";

import { useEffect, type RefObject } from "react";

// これ以上動かしたら「ドラッグ」とみなし，離した時のクリックを取り消す（ピクセル）．
// 押す時に少し手が動いただけでクリックが取り消されないよう，余裕を持たせる
const DRAG_THRESHOLD = 12;

/*
 * 世界を見渡す操作．
 * - マウス：ドラッグで動かす
 * - ホイール：縦に動かせない時は，横に動かす（Ctrl＋ホイールは拡大・縮小に使う）
 * - スマホ：指でのスクロール（ブラウザの標準の動き）をそのまま使う
 *
 * ドラッグした後にキャラクターや建物の上で指を離しても，
 * クリック（詳細画面への移動など）にならないようにする．
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let start: {
      x: number;
      y: number;
      left: number;
      top: number;
    } | null = null;
    let isDragging = false;

    const onPointerDown = (event: PointerEvent) => {
      // スマホの指は，ブラウザのスクロールに任せる
      if (event.pointerType !== "mouse" || event.button !== 0) {
        return;
      }

      // 建築モードで建物をドラッグする時は，世界を動かさない
      if (
        event.target instanceof Element &&
        event.target.closest("[data-build-draggable]")
      ) {
        return;
      }

      start = {
        x: event.clientX,
        y: event.clientY,
        left: element.scrollLeft,
        top: element.scrollTop,
      };
      isDragging = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!start) {
        return;
      }

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (!isDragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
        return;
      }

      isDragging = true;
      element.dataset.dragging = "true";
      element.scrollLeft = start.left - dx;
      element.scrollTop = start.top - dy;
    };

    const onPointerUp = () => {
      start = null;
      delete element.dataset.dragging;
    };

    // ドラッグの直後のクリックは取り消す
    const onClick = (event: MouseEvent) => {
      if (isDragging) {
        event.preventDefault();
        event.stopPropagation();
        isDragging = false;
      }
    };

    const onWheel = (event: WheelEvent) => {
      // Ctrl＋ホイール（ピンチ）は拡大・縮小に使うので，ここでは動かさない
      if (event.ctrlKey) {
        return;
      }

      const canScrollVertically =
        element.scrollHeight > element.clientHeight;

      if (
        !canScrollVertically &&
        Math.abs(event.deltaY) > Math.abs(event.deltaX)
      ) {
        event.preventDefault();
        element.scrollLeft += event.deltaY;
      }
    };

    // リンクの画像などを掴んで引きずらないようにする
    const onDragStart = (event: DragEvent) => {
      event.preventDefault();
    };

    element.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    element.addEventListener("click", onClick, true);
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("dragstart", onDragStart);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("click", onClick, true);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("dragstart", onDragStart);
    };
  }, [ref]);
}
