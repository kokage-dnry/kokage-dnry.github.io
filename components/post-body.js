import { Fragment, useEffect, useState } from 'react'
import markdownToReact from '../lib/markdownToReact'

/**
 * HTML形式の文字列を受け取りReactコンポーネントに変換して返す関数
 * @param {*} param0 
 * @returns 
 */
const PostBody = ({ content, slug }) => {
  const [component, setComponent] = useState(<Fragment />)
  useEffect(() => {
    (async () => {
      const contentComponent = await markdownToReact(content, slug)
      setComponent(contentComponent)
    })()
    return () => {}
  }, [content])
  return (
      <div>
        {component}
      </div>
  )
}

export default PostBody