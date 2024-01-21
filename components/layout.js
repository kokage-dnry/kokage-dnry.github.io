import Head from 'next/head'
import styles from './layout.module.css'
import utilStyles from '../styles/utils.module.css'
import Link from 'next/link'

/**
 * ページ全体にわたるGlobalに適用されるLayoutを記述
 */

//const name = 'kokage'
const name = 'UNTITLED'
export const siteTitle = 'UNTITLED'

/**
 * 
 * @param {*} param0 
 * NOTE: 
 */
export default function Layout({ children, home }) {
  console.log("@Layout props children: ", children)
  console.log("@Layout props home: ", home)
  return (
    <div className={styles.container}>
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
            siteTitle
          )}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.zeit.co%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`}
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="tiwtter::card" content="summary_large_image" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@3.0.1/github-markdown.min.css" />
 
      </Head>
      <header className={styles.header}>
        {home ? (
          <>
            <h1 className={utilStyles.heading2Xl}>{name}</h1>
          </>
        ) : (
          <>
              <h1 className={utilStyles.heading2Xl}>
                <Link href="/">{name}</Link>
              </h1>
          </>
        )}
      </header>
      <main>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href="/">
            <p>← Back to home</p>
          </Link>
        </div>
      )}
    </div>
    
  )
}
