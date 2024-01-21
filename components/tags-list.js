import utilStyles from '../styles/utils.module.css'
import Link from 'next/link'

export default function TagsList({ tagsList }) {
  const lists = []
  try {
    for (const [i, tag] of tagsList.entries()) {
      lists.push(<li className={utilStyles.tagsList}><Link href={`/tag/${tag}`}>{ tag }</Link></li>)
    }
  } catch {
    console.log("This article don't have tags.")
  }

  return (
    <div>
      { lists }
    </div>
  )
}
