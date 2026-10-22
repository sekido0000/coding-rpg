/*
 * 読み込み中を表す回転アイコン．
 * 文字色（currentColor）に合わせて表示する．
 */
export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
