import Head from 'next/head'
import GoogleTagManager from '@/components/GoogleTagManager'
import { siteData } from '@/const/site'

export default function Meta() {
  console.log("siteData.title =" + siteData)
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous"></link>
        <meta
          name="description"
          content="kokage's blog"
        />
        <meta
          property="og:image"
          content={`https://og-image.now.sh/${encodeURI(
            siteData.title
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.zeit.co%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteData.title} />
        <meta name="tiwtter::card" content="summary_large_image" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@3.0.1/github-markdown.min.css" />
        
      </Head>
      <GoogleTagManager />
    </>
  );
}