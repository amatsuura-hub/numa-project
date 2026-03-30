import { Helmet } from "react-helmet-async";

interface PageHeadProps {
  title?: string;
  description?: string;
  ogType?: string;
  ogImage?: string;
}

const SITE_NAME = "Numa - ロードマップ共有サービス";
const DEFAULT_DESCRIPTION =
  "熟練者が初心者向けにマインドマップ形式のロードマップを作成・公開・共有するサービス";
const DEFAULT_OG_IMAGE = "/ogp-default.png";

function PageHead({
  title,
  description = DEFAULT_DESCRIPTION,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
}: PageHeadProps) {
  const pageTitle = title ? `${title} | Numa` : SITE_NAME;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Numa" />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

export default PageHead;
