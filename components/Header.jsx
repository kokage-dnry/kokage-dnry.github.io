import Link from 'next/link'
import utilStyles from '@/styles/utils.module.css'
import styles from '@/components/layout.module.css'
import { siteData } from '@/const/site'

export default function Header({ home }) {
  return (
    <>
      <header className={styles.header}>
        {home ? (
          <>
            <h1 className={utilStyles.heading2Xl}>{siteData.name}</h1>
          </>
        ) : (
          <>
              <h1 className={utilStyles.heading2Xl}>
                <Link href="/">{siteData.name}</Link>
              </h1>
          </>
        )}
      </header>

      <div class="container">
        <div class="row o-1column">
          <title>{siteData.title}</title>
          <section className={utilStyles.headingMd}>
            <p>
              コンピュータ関連の備忘録を主に書いていこうと思います。時々、電気など関係ないことも書きます。
            </p>
          </section>
        </div>
      </div>
    </>
  )
}