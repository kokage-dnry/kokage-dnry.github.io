---
date: "2023-11-30"
posted: "2024-02-10"
title: "HTB Sau Write-up"
tags: ["Hack The Box", "PHP", "OS Command Injection", "Docker", "Cacti", "CVE-2022-46169", "CVE-2021-41091", "Capabilities"]
---

# HTB Sau Write-up

Hack The BoxのSau [Easy] をプレイしたのでそのWrite-upです。

## 1. nmap

次の`nmap`コマンドの結果は以下。

```
$ sudo nmap -A -p- -T4 -sV -sC -oN nmap_ipaddr.txt 10.10.11.224
```

![](./img/Sau02.png)

画像の結果から、55555にてWebサービスが稼働していることがわかる。
また、通常であればWebサービスをホスティングしている80番ポートは`filtered`となっており、実際にアクセスすることはできない。

---

## 2. Request Basketsに対する攻撃

1で調べた結果から、55555/TCP でWebサービスがホストされていることはわかるが、http://10.10.11.224:55555 にはアクセスすることはできない。一方で、`href="/web">Found</a>.`との記載があるため、 http://10.10.11.224:55555/web にアクセスすると成功する。
その結果が以下の通り。

![](./img/Sau03.png)

Request Basketsでは、画像中央部のフォームからバスケットの名称を入力してCraeteボタンにてSubmitすると右側のMy Basketsに生成したバスケットが表示される。


### 2.1 Request Basketsの概要

Request Baskestsとは[公式サイト](https://rbaskets.in/readme.html)によると
> Request Baskets is a web service to collect arbitrary HTTP requests and inspect them via RESTful API or simple web UI. It is strongly inspired by ideas and application design of the RequestHub project and reproduces functionality offered by RequestBin service.

と記載されており、RESTful APIやWebベースのUIにより任意のHTTPリクエストを収集・検査するものとなっている。
先の画面でバスケットを生成したが、生成したバスケットに対して送信したリクエストが保存されていき、右側のバスケット一覧をクリックするあるいはAPIを叩くことにより保存されたリクエストを確認・検査することができる。
さらに、バスケットに`forwarded_url`を指定することで、指定先のURLにリクエストを転送することができるため、外部サイトのリクエスト監視も可能となる。


### 2.2 Request Basketsの脆弱性(CVE-2023-27163)の概要

2.1の説明でバスケットに対し`forwarded_url`を指定することで外部にリクエストを送信することもできると記載したが、利用する脆弱性にはこの`forwarded_url`の部分に脆弱性があり、これを利用してSSRFを発生させることができる。
詳細は、[参考サイト - request-baskets SSRF details](https://notes.sjtu.edu.cn/s/MUUhEymt7)に記載されているが、ステップとしては次の通り。

- `forwarded_url`にSSRFの攻撃対象(`127.0.0.1:80`など)を指定してバスケット(名前を`test`とする)を生成する。
- 先に生成したバスケットにアクセスする。
- `forwarded_url`に指定したURLからリクエストが返ってくる。

![](./img/Sau04.png)


### 2.3 Request Basketsの脆弱性(CVE-2023-27163)の利用

2.2の参考サイトの通りにリクエストを送信すれば攻撃は可能であるが、今回は[PoC](https://github.com/entr0pie/CVE-2023-27163)があったため、これを利用した。
![](./img/Sau05.png)

まずは、`git clone https://github.com/entr0pie/CVE-2023-27163`にてPoCをダウンロードした。

そして、SSRF先のURL（このURLが`forwarded_url`に指定される）を`http://127.0.0.1:80`に指定してExploitを実行した。
![](./img/Sau08.png)

ここで、バスケットの名前はランダムで`nwhaaw`と決められ、http://10.10.11.224:55555/nwhaaw にアクセスると次のようなサイトが表示された。これが、ターゲットのサーバーが80番ポートでホストしているサイトでありSSRFが成功したと言える。

![](./img/Sau10.png)

---
## 3. Maltrail v0.53の脆弱性を利用したRCE

2.3でSSRFを実行したサイトにはMaltrail v0.53が使用されていることがわかる。
そこでMaltrail v0.53の脆弱性を検索した。
すると、RCEの脆弱性とExploitが見つかった。

![](./img/Sau11.png)

![](./img/Sau12.png)

これを`git clone https://github.com/spookier/Maltrail-v0.53-Exploit`によりダウンロードして`exploit.py`を実行した。
`exploit.py`ではReverse shellのコネクションを貼るため、事前準備として`nc -lnvp 4444`でReverse shellの接続をListenした。
次に、`exploit.py`を実行するが、http://10.10.11.224:55555/nwhaaw に送信したリクエストがhttp://10.10.11.224:80 に転送されるため送信先はhttp://10.10.11.224:80 を指定する。
そして、第一引数と第二引数にはそれぞれ攻撃者のIPアドレスとReverse shellを待ち受けるポート番号を指定した。

![](./img/Sau17.png)

すると、Reverse shellの接続を確認できた。
そして、`id`コマンドでユーザの確認、`cat /home/puma/user.txt`でUserフラグの値を確認できた。

![](./img/Sau18.png)

---
## 4. systemdの脆弱性(CVE-2023-26604)を利用した権限昇格

一般ユーザ権限からrootを取得するための調査の一番簡単な方法としてパスワードなしsudoを利用した権限昇格があるため`sudo -l`コマンドにてパスワードなしsudoを実行した。

![](./img/Sau19.png)

画像の通り`sudo /user/bin/systemctl status trail.service`がパスワードなしでroot権限で実行できることがわかった。
ここで、画像のように"systemctl status sudo exploit"で検索すると、ちょうど[権限昇格の脆弱性](https://security.sios.jp/vulnerability/systemd-security-vulnerability-20230307/)がヒットした。

![](./img/Sau20.png)

この脆弱性に関しては上記のリンクのサイトでは次のように記載されている。
> 247より前のsystemdでは、sudoの設定ファイル(/etc/sudoers)等により制限されたローカルの権限昇格をすり抜けて権限昇格が行えてしまう場合があります。例えば、systemdはLESSECUREを1に設定していないため、lessプログラムから他のプログラム(shell等)が起動される可能性があります。ターミナルの設定によりsystemctlの出力がlessに引き渡された場合には、lessがrootとして実行されているため、そのlessを経由して他のプログラムが起動されてしまいます。

そして、実際にこれを利用したPrivilege Escalationの流れも記載されている。
`sudo /usr/bin/systemctl status [サービス名]`を実行すると、この出力が`less`に渡される。そのため、`!sh`のように`! shell-command`のような形式でコマンドを指定すると任意コマンドを実行できる。
![](./img/Sau21.png)

![](./img/Sau22.png)

これを実際のターゲットで実行した流れが以下。実際にroot権限とrootフラグを獲得できた。

![](./img/Sau23.png)

![](./img/Sau24.png)

![](./img/Sau25.png)

---

## 5. まとめ
HTB Sauで用いたテクニックや知識を整理以下のように整理した。
- User
  - Enumeration
    - Nmapの
    - GitDumpによるGitファイルの一括抽出
  - Web Exploitation
    - Request BasketsのSSRF脆弱性(CVE-2023-27163)を利用
    - SSRFによる内部サーバーへのアクセス
    - Maltrail v0.53のOS Command Injection脆弱性
    - SSRFとOS Command Injectionの組み合わせによるRCE
- Root
  - Enumeration
    - `suod -l`によるパスワードなしsudoが可能なコマンドの確認
    - 247以前のsystemdにおけるLESSECURE設定不備と`sudo`を併用した権限昇格(CVE-2023-26604)

