import Layout, { siteTitle } from '@/components/Layout'
import { getTagFilteredPosts, getAllTags } from '@/lib/api'
import Date from '@/components/date'
import utilStyles from '@/styles/utils.module.css'
import Link from 'next/link'


export default function Tags( { tag, filteredPostsData }) {
  return (
    <Layout>
    <div class="container">
      <div class="row o-1column">
        <title>{siteTitle}</title>
        <section className={utilStyles.headingMd}>
          <p>
            タグ一覧
          </p>
        </section>
      </div>
    </div>
    <div class="container">
      <div class="row o-2column">
        <div class="col-md-9">
          <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
          <h2 className={utilStyles.headingLg}>"{ tag }"タグの記事一覧</h2>
          <ul className={utilStyles.list}>
            {filteredPostsData.map(({ slug, date, title, posted }) => (
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
      </div>
    </div>
    </Layout>
  )
}

/**
 * 全てのタグを取得してそのページをプレレンダリングさせる
 * @returns 
 */
export async function getStaticPaths() {
  //const posts = getAllPosts(['slug'])
  const tags = getAllTags(['slug','tags'])
  console.log("@[tag].getStaticPaths: tags=", tags)

  return {
    paths: tags.map((x) => {
      return {
        params: {
          tag: x,
        },
      }
    }),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const tag = params.tag
  const filteredPostsData = getTagFilteredPosts(tag, [
    'title',
    'date',
    'slug',
    'tags',
    'posted'
  ])

  return {
    props: {
      tag,
      filteredPostsData,
    },
  }
}