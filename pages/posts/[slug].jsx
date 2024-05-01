import Layout from '@/components/Layout'
import { getPostBySlug, getAllPosts } from '@/lib/api'
import Head from 'next/head'
import Date from '@/components/date'
import utilStyles from '@/styles/utils.module.css'
import PostBody from '@/components/post-body'
import TagsList from '@/components/tags-list'

export default function Post( { post, morePosts, preview }) {
  // console.log("@Post: post.content = ", post.content)  // logging for debug
  /* Comment out @2023.02.05
  const router = useRouter()
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }
  */
  return (
    <Layout>
      <article class="markdown-body">
        <h1 className={utilStyles.headingXl}>{post.title}</h1>
        <div className={utilStyles.lightText}>
          <Date dateString={post.posted} />
        </div>
        <div className={utilStyles.lightText}>
          <TagsList tagsList={post.tags} />
        </div>
        <div>
        <PostBody content={post.content} slug={post.slug} /> 
        </div>
      </article>
    </Layout>
  )
}


export async function getStaticPaths() {
  const posts = getAllPosts(['slug'])

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      }
    }),
    fallback: false,
  }
}

/**
 * slugからMarkdownのコンテンツデータとメタデータを取得する関数
 * @param {object} Next.jsに渡されるデータ。slugを含む。
 * @returns getPostBySlug関数によって取得したMarkdownデータをpropsとして返す。
 */
export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug, [
    'title',
    'date',
    'slug',
    'author',
    'content',
    'ogImage',
    'coverImage',
    'tags',
    'posted'
  ])

  return {
    props: {
      post,
    },
  }
}