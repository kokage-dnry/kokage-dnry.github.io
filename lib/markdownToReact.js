import { createElement, Fragment } from 'react'
import rehypeReact from 'rehype-react'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import PostImage from '@/components/post-image'

/**
 * markdownをReactコンポーネントに変換する
 * @param {}
 */
export default async function markdownToReact(markdown, slug) {
  const result = (await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeReact, {
      createElement,
      Fragment,
      components: {
        img: PostImage(slug)
      }
    })
    .process(markdown)).result
  return result
}