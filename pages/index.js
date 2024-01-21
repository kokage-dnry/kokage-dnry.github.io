import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout.js'
import utilStyles from '../styles/utils.module.css'
import Link from 'next/link'
import Date from '../components/date.js'
import { getAllPosts, getAllTags } from '../lib/api.js'
import TagsList from '../components/tags-list.js'

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
        <div class="row o-1column">
          <title>{siteTitle}</title>
          <section className={utilStyles.headingMd}>
            <p>
              コンピュータ関連の備忘録を主に書いていこうと思います。時々、電気など関係ないことも書きます。
            </p>
          </section>
        </div>
      </div>
      <div class="container">
        <div class="row o-2column">
          <div class="col-md-9">
            <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
              <h2 className={utilStyles.headingLg}>記事一覧</h2>
              <ul className={utilStyles.list}>
                {allPostsData.map(({ slug, date, title }) => (
                  <li className={utilStyles.listItem} key={slug}>
                    <Link href={`/posts/${slug}`}>
                      {title}
                    </Link>
                    <br />
                    <small className={utilStyles.lightText}>
                      <Date dateString={date} />
                    </small>
                  </li>
                ))}
              </ul>
            </section>
            </div>
            <div class="col-md-3">
              <div className={utilStyles.profileBox}>
                <div className={utilStyles.headingMd}>
                  自己紹介
                </div>
                <img src="/profile/kokage_profile.jpg" className={utilStyles.profileImg}/>
                <p className={utilStyles.authorName}>kokage</p>
                <p className={utilStyles.profileText}>
                  本業は電気関係の仕事をしている社会人です。趣味でやっているコンピュータ関係でアウトプットの場が欲しくてブログを作成しました。このブログの作成もそうですが、色々なことにちょこちょこ手を出してて中途半端なところも多いですがよろしくお願いします。<br/>
                  間違い等はX(旧Twitter)で教えていただけると幸いです。
                </p>
                <div>
                  <a class="twitter-timeline" href="https://twitter.com/kokage_dnry99?ref_src=twsrc%5Etfw">Tweets by kokage_dnry99</a> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
                </div>
              </div>
              <div>
                タグ一覧
                <TagsList tagsList={allTagsData} />
              </div>
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
    'slug'
  ])
  const allTagsData = getAllTags([
    'title',
    'date',
    'slug',
    'tags'
  ])
  console.log("all tags data:", allTagsData)
  return {
    props: {
      allPostsData,
      allTagsData
    }
  }
}