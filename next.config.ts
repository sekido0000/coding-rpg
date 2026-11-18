import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * バッジの画像は，キャラクターのドット絵（public/characters の SVG）をファイルから読んで埋め込む．
   * サーバーの関数にこれらのファイルを含めておく（含めないと，配信先で読めない）．
   */
  outputFileTracingIncludes: {
    "/api/badge/**/*": ["./public/characters/**/*.svg"],
  },
};

export default nextConfig;
