import { Helmet } from "react-helmet-async";

interface PageHeadProps {
  title?: string;
  description?: string;
  ogType?: string;
}

const SITE_NAME = "Numa - ロードマップ共有サービス";
const DEFAULT_DESCRIPTION =
  "熟練者が初心者向けにマインドマップ形式のロードマップを作成・公開・共有するサービス";

function PageHead({
  title,
  description = DEFAULT_DESCRIPTION,
  ogType = "website",
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
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

export default PageHead;
