import { redirect } from "next/navigation";

/*
 * ログインはトップページのボタンから直接GitHubへ移動する．
 * 以前のURLで来た時のために，トップページへ戻す．
 */
export default function LoginPage() {
  redirect("/");
}
