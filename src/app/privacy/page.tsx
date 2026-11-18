import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppLogo } from "@/components/layout/app-logo";
import { PendingLink } from "@/components/ui/pending-link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Coding RPG",
};

const ISSUES_URL = "https://github.com/sekido0000/coding-rpg/issues";

// 制定日・改定日（変える時はここを書き換える）
const ESTABLISHED_ON = "2026年11月18日";

function Article({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Items({ children }: { children: ReactNode }) {
  return <ol className="list-[decimal] space-y-2 pl-6">{children}</ol>;
}

/*
 * プライバシーポリシー．
 * 書いてある内容は，実際にコードで保存しているものと合わせる．
 * 集める情報や外部サービスを変えた時は，ここも直して改定日を更新する．
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <AppLogo />

          <PendingLink
            href="/"
            className="self-start rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white sm:self-auto"
          >
            トップページへ戻る
          </PendingLink>
        </div>

        <article className="text-sm leading-7 text-slate-300">
          <h1 className="text-3xl font-black text-white">プライバシーポリシー</h1>

          <p className="mt-6">
            Coding RPG 運営（以下「運営者」といいます．）は，運営者が提供する Web アプリケーション「Coding RPG」（以下「本サービス」といいます．）における利用者の個人情報その他の情報（以下「利用者情報」といいます．）の取扱いについて，個人情報の保護に関する法律（以下「個人情報保護法」といいます．）その他の関係法令を遵守し，以下のとおりプライバシーポリシー（以下「本ポリシー」といいます．）を定めます．
          </p>

          <Article title="第1条（取得する利用者情報）">
            <p>運営者は，本サービスの提供にあたり，次の利用者情報を取得します．</p>
            <Items>
              <li>
                GitHub アカウントに関する情報：本サービスへのログインに際して GitHub から提供される，ユーザー ID，ユーザー名，表示名，プロフィール画像の URL 及びメールアドレス
              </li>
              <li>
                連携したリポジトリに関する情報：GitHub App のインストールに関する識別子並びにリポジトリの名称，所有者，URL，公開・非公開の別及び既定のブランチ
              </li>
              <li>
                コミットに関する情報：連携したリポジトリに push されたコミットの件名（1行目），日時，変更されたファイルの数及び行数並びに本文の有無．なお，運営者は，経験値の計算のためにコミットの本文，変更内容（差分）及びファイル名を一時的に参照しますが，これらを保存しません．また，運営者がリポジトリの内容を変更することはありません．さらに，各連携リポジトリについて，キャラクターが生まれる前の90日間のコミット（最大50件）のメッセージ及び日時を参照し，その件数，コミットした日数，本文を書いたコミットの数及び内容が分からないメッセージのコミットの数のみを保存します（メッセージそのものは保存しません．）．
              </li>
              <li>
                本サービスの利用に伴って生成される情報：キャラクター，経験値，クエスト，ゴールド，装飾，装備，素材，称号，建物及びボス戦の記録その他本サービス内での活動の記録
              </li>
              <li>
                ご意見フォームにより送信された情報：送信内容及び送信時に表示していたページ
              </li>
              <li>
                技術的な情報：ログイン状態を維持するための Cookie．また，本サービスの配信に用いるサーバーにおいて，IP アドレス，ブラウザの種類等のアクセス記録が一時的に保存される場合があります．
              </li>
              <li>
                GitHub から送信される通知の識別子：同一の通知を重複して処理することを防ぐために取得し，取得から7日以内に削除します．
              </li>
              <li>
                本サービスの利用状況：キャラクターの詳細の表示，建物の中の表示，装飾・装備の付け替え，建物の建築・移動，クエストの表示，ボス戦への挑戦，工房及び雑貨店の表示並びにバッジの作成の，それぞれの日ごとの回数（キャラクターの詳細の表示については，キャラクターごとの回数）並びにボス戦の結果（ボス，★，勝敗，ターン数並びにパーティーのキャラクターの種類，レベル，役割及び付けている装備の数）
              </li>
              <li>
                バッジに関する情報：利用者がバッジを作成した場合，運営者は，キャラクターの種類，進化した姿及びレベルを，推測が困難な URL により誰でも閲覧できる画像として公開します．キャラクターの名前及びリポジトリの名称は公開しません．利用者は，いつでもバッジを停止することができます．
              </li>
            </Items>
          </Article>

          <Article title="第2条（利用目的）">
            <p>1　運営者は，取得した利用者情報を次の目的のために利用します．</p>
            <Items>
              <li>本サービスの提供，維持及び運営のため（ログインの管理，キャラクターの成長に関する処理及び画面の表示を含みます．）</li>
              <li>不正な利用の防止及びこれへの対応のため</li>
              <li>利用者からのご意見及びお問い合わせへの対応のため</li>
              <li>本サービスの改善及び新たな機能の検討のため</li>
              <li>
                本サービスの効果（利用者のコミットの習慣の変化等）を分析し，本サービスの改善に役立てるため
              </li>
            </Items>
            <p>
              2　運営者は，前項の利用目的の達成に必要な範囲を超えて，利用者情報を利用しません．利用目的を変更する場合は，変更前の利用目的と関連性を有すると合理的に認められる範囲内で行い，変更後の利用目的を本ポリシーにより公表します．
            </p>
            <p>
              3　利用者は，本サービスの「設定」において，第1項第5号の目的のために利用者情報を利用しないよう選択することができます．この場合，運営者は，第1条第3号に定めるコミットの集計値及び同条第8号に定める利用状況を削除し，以後これらを取得しません．
            </p>
            <p>
              4　運営者は，分析の結果を公表する場合，特定の利用者を識別できない統計的な形式に限ります．
            </p>
          </Article>

          <Article title="第3条（第三者提供）">
            <p>
              運営者は，次の各号のいずれかに該当する場合を除き，あらかじめ利用者の同意を得ることなく，個人情報を第三者に提供しません．
            </p>
            <Items>
              <li>法令に基づく場合</li>
              <li>人の生命，身体又は財産の保護のために必要がある場合であって，利用者の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上又は児童の健全な育成の推進のために特に必要がある場合であって，利用者の同意を得ることが困難であるとき</li>
              <li>国の機関若しくは地方公共団体又はその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって，利用者の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
            </Items>
          </Article>

          <Article title="第4条（外部サービスの利用）">
            <p>
              運営者は，本サービスの提供のため，次の外部サービスを利用し，利用者情報を当該サービスの提供するサーバーに保存し，又は当該サービスを通じて取り扱います．各外部サービスにおける情報の取扱いは，各事業者の定めるプライバシーポリシーに従います．
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-200">
                    <th className="py-2 pr-4 font-semibold">サービス</th>
                    <th className="py-2 pr-4 font-semibold">事業者（所在国）</th>
                    <th className="py-2 pr-4 font-semibold">用途</th>
                    <th className="py-2 font-semibold">主な保存場所</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4">Supabase</td>
                    <td className="py-2 pr-4">Supabase, Inc.（米国）</td>
                    <td className="py-2 pr-4">データベース及び認証</td>
                    <td className="py-2">日本（東京）</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4">Vercel</td>
                    <td className="py-2 pr-4">Vercel Inc.（米国）</td>
                    <td className="py-2 pr-4">本サービスの配信</td>
                    <td className="py-2">日本（東京）</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-4">GitHub</td>
                    <td className="py-2 pr-4">GitHub, Inc.（米国）</td>
                    <td className="py-2 pr-4">ログイン及びリポジトリの連携（利用者情報の取得元）</td>
                    <td className="py-2">―</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              なお，アクセス記録（ログ），バックアップその他の情報は，各事業者が管理する日本国外（主に米国）のサーバーにおいて処理され，又は保存される場合があります．
            </p>
          </Article>

          <Article title="第5条（安全管理措置）">
            <p>
              運営者は，利用者情報の漏えい，滅失又は毀損の防止その他の安全管理のために，次の措置を講じます．
            </p>
            <Items>
              <li>通信の暗号化（HTTPS）</li>
              <li>データベースにおけるアクセス制御（利用者本人の情報のみを閲覧可能とし，書き込みはサーバーからのみ行う設定）</li>
              <li>GitHub App の権限の，リポジトリの内容の読み取りに必要な範囲への限定</li>
              <li>本サービスの提供に必要のない情報の不保存</li>
              <li>
                外的環境の把握：運営者は，米国に所在する事業者の提供するサービスを利用しています（第4条）．運営者は，米国における個人情報の保護に関する制度を把握した上で，安全管理措置を講じます．
              </li>
            </Items>
          </Article>

          <Article title="第6条（利用者情報の削除）">
            <p>
              1　利用者は，本サービスの「データを全部消す」の機能により，いつでも自らの利用者情報を削除することができます．削除した利用者情報は復元できません．
            </p>
            <p>
              2　リポジトリの連携を解除した場合でも，当該リポジトリに係るキャラクター及び記録は削除されません．
            </p>
            <p>
              3　第1項の機能により削除できない場合は，第8条の窓口から削除を請求することができます．
            </p>
            <p>
              4　第1条第6号に定めるアクセス記録及び同条第7号に定める通知の識別子は，前3項にかかわらず，それぞれの定めに従って取り扱います．
            </p>
          </Article>

          <Article title="第7条（開示等の請求）">
            <p>
              利用者は，運営者に対し，個人情報保護法の定めるところにより，保有個人データの利用目的の通知，開示，内容の訂正，追加若しくは削除，利用の停止若しくは消去，第三者への提供の停止又は第三者提供記録の開示（以下「開示等」といいます．）を請求することができます．運営者は，請求者が本人であることを確認した上で，法令に従い遅滞なく対応します．開示等の請求に係る手数料は頂きません．
            </p>
          </Article>

          <Article title="第8条（お問い合わせ窓口）">
            <p>本ポリシーに関するお問い合わせ及び開示等の請求は，次の窓口で受け付けます．</p>
            <Items>
              <li>本サービス内の「ご意見」フォーム（ログインが必要です．）</li>
              <li>
                GitHub の Issues（
                <a
                  href={ISSUES_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sky-300 underline-offset-2 hover:underline"
                >
                  {ISSUES_URL}
                </a>
                ）．ただし，Issues の内容は一般に公開されるため，個人に関する内容は前号の窓口をご利用ください．
              </li>
            </Items>
          </Article>

          <Article title="第9条（運営者）">
            <p>運営者の名称：Coding RPG 運営（GitHub: sekido0000）</p>
            <p>
              運営者の氏名及び住所は，第8条の窓口からの請求に応じて，遅滞なく回答します．
            </p>
          </Article>

          <Article title="第10条（未成年の利用者）">
            <p>
              未成年の利用者は，親権者その他の法定代理人の同意を得た上で本サービスを利用してください．
            </p>
          </Article>

          <Article title="第11条（本ポリシーの変更）">
            <p>
              運営者は，法令の変更その他必要に応じて，本ポリシーを変更することがあります．変更後の本ポリシーは，本ページに掲載した時点から効力を生じます．重要な変更を行う場合は，本サービス内でお知らせします．
            </p>
          </Article>

          <p className="mt-12 text-right">制定日：{ESTABLISHED_ON}</p>
        </article>
      </div>
    </main>
  );
}
