import Head from 'next/head'
import GoogleTagManager from '@/components/GoogleTagManager'
import { twitter } from '@/const/site'
import utilStyles from '@/styles/utils.module.css'
import TagsList from '@/components/tags-list'

export default function SideBar({ allTagsData }) {
  return (
    <>
    <div className={utilStyles.profileBox}>
      <div className={utilStyles.headingMd}>
        自己紹介
      </div>
      <img src="/profile/kokage_profile.jpg" className={utilStyles.profileImg}/>
      <p className={utilStyles.authorName}>kokage</p>
      <p className={utilStyles.profileText}>
        本業は電気関係の仕事をしている社会人です。趣味でやっているコンピュータ関係でアウトプットの場が欲しくてブログを作成しました。このブログの作成もそうですが、色々なことにちょこちょこ手を出してて中途半端なところも多いがよろしくお願いします。<br/>
        間違い等はX(旧Twitter)で教えていただけると幸いです。
      </p>
      <div>
        <a class="twitter-timeline" href={twitter.user_url}>Tweets by {twitter.username}</a>
        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"> </script>
      </div>
    </div>
    <div>
      タグ一覧
        <TagsList tagsList={allTagsData} />
    </div>
    </>
  );
}

