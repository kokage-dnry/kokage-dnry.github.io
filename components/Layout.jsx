import styles from '@/components/layout.module.css'
import utilStyles from '@/styles/utils.module.css'
import Link from 'next/link'
import Meta from '@/components/Meta'
import { siteData } from '@/const/site'
import Header from '@/components/Header'
import SideBar from '@/components/SideBar'

/**
 * 
 * @param {*} param0 
 * NOTE: 
 */
export default function Layout({ children, home }) {
  console.log("@Layout props children: ", children)
  console.log("@Layout props home: ", home)
  return (
    <>
      <Meta />
        <Header home = {home} />
        <main>{children}</main>
        {!home && (
          <div className={styles.backToHome}>
            <Link href="/">
              <p>← Back to home</p>
            </Link>
          </div>
        )}

    </>
  )
}
