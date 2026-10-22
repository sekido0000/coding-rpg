import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Coding RPG",
  description:
    "GitHubリポジトリの活動に応じてキャラクターが成長するWebアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * ページ内リンク（「使い方を見る」など）で滑らかにスクロールする．
     * 動きを減らす設定の人には適用しない．
     * data-scroll-behaviorは，ページ移動の時だけ滑らかなスクロールを
     * 止めるためのNext.jsの指定．
     */
    <html
      lang="ja"
      className="motion-safe:scroll-smooth"
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}