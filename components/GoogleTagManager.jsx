import Script from 'next/script'
import { gta4Tags } from '@/const/site'

export default function GoogleTagManager() {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={gta4Tags.src}
      />
      <Script
        id="gtag-config"
        strategy="afterInteractive"
      >
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', '${gta4Tags.tag}');
      `}
      </Script>
    </>
  );
}