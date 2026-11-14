/*
 * キャラクターの名前の決まり．
 * 作成画面の入力欄と，サーバーでの確認の両方で使う．
 */

// リポジトリワールドの吹き出しなどに収まる長さにする
export const CHARACTER_NAME_MAX_LENGTH = 12;

// 改行やタブなどの制御文字
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/*
 * 入力された名前を確かめ，前後の空白を取り除いて返す．
 * 使えない名前の時は null を返す．
 */
export function normalizeCharacterName(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim();

  // 絵文字などを1文字として数える
  const length = Array.from(name).length;

  if (
    length === 0 ||
    length > CHARACTER_NAME_MAX_LENGTH ||
    CONTROL_CHARACTERS.test(name)
  ) {
    return null;
  }

  return name;
}
