import Layout from '@/components/Layout'
import utilStyles from '@/styles/utils.module.css'
import Link from 'next/link'
import Date from '@/components/date'
import { getAllPosts, getAllTags } from '@/lib/api'
import TagsList from '@/components/tags-list'
import { siteData } from '@/const/site'
import SideBar from '@/components/SideBar'

/**
 * ホームページのページコンポーネント
 * 
 * @param {object} 全ポストデータのが格納された連想配列
 * @returns ホームページのページコンポーネント
 */
export default function Home({ allPostsData, allTagsData }) {
  console.log("all tags data:", allTagsData)
  return (
    <Layout home>
      <div class="container">
        <div class="row o-2column">
          <div class="col-md-9">
            <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
              <h2 className={utilStyles.headingLg}>記事一覧</h2>
              <ul className={utilStyles.list}>
                {allPostsData.map(({ slug, date, title, posted }) => (
                  <li className={utilStyles.listItem} key={slug}>
                    <Link href={`/posts/${slug}`}>
                      {title}
                    </Link>
                    <br />
                    <small className={utilStyles.lightText}>
                      <Date dateString={posted} />
                    </small>
                  </li>
                ))}
              </ul>
            </section>
            </div>
            <div class="col-md-3">
              <SideBar allTagsData={allTagsData} />
            </div>
          </div>
        </div>
    </Layout>
  )
}

/**
 * Homeページコンポーネントに対して記事の一覧を渡す関数
 * @returns 
 */
export async function getStaticProps() {
  const allPostsData = getAllPosts([
    'title',
    'date',
    'slug',
    'posted'
  ])
  const allTagsData = getAllTags([
    'title',
    'date',
    'slug',
    'tags',
    'posted'
  ])
  console.log("all tags data:", allTagsData)
  return {
    props: {
      allPostsData,
      allTagsData
    }
  }
}
