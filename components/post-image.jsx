import React, { createElement } from 'react'


const PostImage = function(slug) { return function (props) {
  console.log("@PostImage slug = ", slug)
  try {
    console.log("src=", props.src)
    let src = props.src
    const alt = props.alt
    const title = props.title
    //const image = require('../posts/' + slug + src).default
    if (src.split('/')[0] == '.') {
      src = src.substr(1)
    }
    const image = '/' + slug + src
    //const image = slug + src

    //return <Image
    return <img
        src={image}
        alt={alt}
        title={title}
    />
    
  } catch (e) {
    return createElement('img', props)
  }
  }
}


export default PostImage
