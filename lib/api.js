/**
 * @fileoverview サーバーサイドプログラムとクライアントサイドとのAPIの役割をする
 * 
 * 主に記事情報を取得しクライアントサイドプログラムに提供する
 * 
 * 
 */

import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const postsDirectory = join(process.cwd(), 'posts')

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory)
}

/**
 * slugと取得したいメタデータを指定して受け取る関数。
 * slugは記事のタイトルやID、contentはgray-matterにより展開したMarkdwonデータ
 * @param {string} データを取得する対象のslug
 * @param {object} slugとcontent以外で取得して呼び出し元に返したいメタデータ
 * @returns {object} slug, contentとそれ以外の第二引数で指定したメタデータを連想配列として格納したもの
 */
export function getPostBySlug(slug, fields) {
  const fullPath = join(postsDirectory, `${slug}/${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const items = {}

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = slug
    }
    if (field === 'content') {
      items[field] = content
    }

    if (typeof data[field] !== 'undefined') {
      items[field] = data[field]
    }
  })

  return items
}

/**
 * ポストの中から引数に指定したfieldのMarkdownデータを取得する関数
 * @param {object} fields getPostBySlugで取得するMarkdownメタデータを表す配列
 * @returns 全てのポストの情報を日付順（新しい順）で並べた配列を返す。情報とはfieldsで指定した値のことを指す。
 */
export function getAllPosts(fields) {
  const slugs = getPostSlugs()
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .sort((post1, post2) => (post1.posted > post2.posted ? -1 : 1))
    //.sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
  return posts
}


/**
 * Tagでフィルターしたポスト一覧を取得する
 * getAllPostsをタグでフィルターしたもの
 * @param {string} tag 抽出したいタグを表す文字列
 * @param {object} fileds getPostBySlug関数で取得するMarkdownメタデータを表す配列
 * @returns 
 */
export function getTagFilteredPosts(tag, fields) {
  const slugs = getPostSlugs()
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
  const filtered = []
  for (let post of posts) {
    if (post.tags != undefined) {
      console.log("@getTagFilteredPosts: post.tags=", post.tags)
      console.log("@getTagFilteredPosts: typeof(post.tags)=", typeof(post.tags))
      console.log("@getTagFilteredPosts: post.tags.indexOf(tag)=", post.tags.indexOf(tag))
      if (post.tags.indexOf(tag) >= 0) {
        filtered.push(post)
      }
    }
  }
  console.log("@getTagFilteredPosts",posts)
  return filtered
}

export function getAllTags(fields) {
  const slugs = getPostSlugs()
  const posts = slugs.map((slug) => getPostBySlug(slug, fields))

  let tags = new Set()
  for (let post of posts) {
    if (post.tags !== undefined) {
      tags = new Set([...tags, ...post.tags])
    }
  }

  console.log("@getAllTag: tags=", tags)
  return Array.from(tags)
}
