---
date: "2023-12-09"
posted: "2024-04-07"
title: "HTB Keeper Write-up"
tags: ["Hack The Box", "Default Password", "Authentication Bypass", "CVE-2023-32784", "KeePass"]
---

# HTB Keeper Write-up

## 1. nmap

次の`nmap`コマンドの結果は以下。

```
$ sudo nmap -A -p- -T4 -sV -sC -oN nmap_ipaddr.txt 10.10.11.227
```

![](./img/Keeper02.png)

画像の結果から、稼働しているのはSSHとHTTPのみと言うことがわかる。

---

## 2. Request Trackerに対する攻撃

### 2.1 デフォルトパスワードによる認証回避
先のnmapの結果からサイトにアクセスするとサポートデスクへのリンクのみ表示される。
![](./img/Keeper03.png)

ここにアクセスすると次のログインフォームが現れる。
![](./img/Keeper04.png)

この画面から、このサイトではRequest Tracker v4.4.4+dfsg-2ubuntu1を使用していることがわかる。
このバージョンのRequest Trackerからはめぼしい脆弱性は見当たらない。そこで、デフォルトパスワードにてログインを試みる。[公式のREADME](https://docs.bestpractical.com/rt/4.4.3/README.html)を確認するとデフォルトのユーザ名とパスワードは root/password となっている。
![](./img/Keeper05.png)

これでログインを試みると成功する。
![](./img/Keeper06.png)
![](./img/Keeper07.png)

### 2.2 管理画面からのパスワード漏洩

ログイン後の管理者画面を見ていると`lnorgaard`ユーザのコメント欄に初期パスワードは`Welcome2023!`と書いてある。
![](./img/Keeper08.png)
![](./img/Keeper09.png)

この"lnograad/Welcome2023!"でSSHログインを試みるとログインに成功する。
![](./img/Keeper10.png)

---

## 3. KeePassの脆弱性によるパスワード入手

ログイン後、ホームディレクトリを見るといくつかのファイルが見つかった。
![](./img/Keeper11.png)

`KeePassDumpFull.dmp`と`passcode.kdbx`がどのようなファイルか調べるとどうやらKeePassパスワードデータベースに関連するファイルと言うことがわかった。
![](./img/Keeper12.png)

![](./img/Keeper13.png)

### 3.1 KeePass 2.X のマスターパスワード漏洩の脆弱性(CVE-2023-32784)

上記からKeePass 2.x系のファイルということがわかる。そこで脆弱性がないか調べたところ、プロセスメモリーのダンプから平文のマスターパスワードが得られるという脆弱性があった。

![](./img/Keeper14.png)
![](./img/Keeper15.png)
![](./img/Keeper16.png)

### 3.2 CVE-2023-32784に対するPoCによるパスワードの解析
[CVE-2023-32784のPoC](https://github.com/vdohney/keepass-password-dumper)がgithubにあることが検索するとわかる。
ただし、このPoCは.NET v7.x環境が必要ということがわかる。
※Linux用のPoCもあるが、こちらでは上手くいかなかった


![](./img/Keeper17.png)

### 3.3 Kaliへの.NET環境のインストール

先のPoCを動かすためにKaliにて.NETのインストールを行なった。
まずはホームディレクトリにインストール用のディレクトリ`.dotnet_install`を作成しインストール用のスクリプトをダウンロードする。

```
$ mkdir ~/.dotnet_install
$ cd ~/.dotnet_install
$ curl -L https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
```

次に、.NETを実際にインストールしていくが、今回のPoCはSDK 7.0.404用のため、次のコマンドを実行する。
```
$ chmod +x ./dotnet-install.sh
$ ./dotnet-install.sh --version 7.0.404
```

![](./img/Keeper23.png)

![](./img/Keeper24.png)

そして、Runtimeもインストールするが、RuntimeはVersion 7.0.14を指定する。

![](./img/Keeper25.png)

最後に、.NETへのパスを通す。この作業は`.bashrc`に記述するなどしておかないとターミナルを立ち上げるたびに毎回必要となる。

```
$ export DOTNET_ROOT=$HOME/.dotnet
$ export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools
```

![](./img/Keeper26.png)
![](./img/Keeper27.png)

### 3.3 PoCの実行

以上で.NETのインストールが完了したため、PoCをダウンロードして実行した。
PoCのディレクトリに移動し`dotnet run [ダンプファイルへのパス]`で実行した。

![](./img/Keeper28.png)

![](./img/Keeper29.png)

![](./img/Keeper30.png)

ダンプファイルからは次の文字列が見つかった。
`M{dgrød med fløde`という文字列が見つかった。

### 3.4 マスターパスワードの推定

PoCを実行して見つかった`M{dgrød med fløde`を検索すると`Rødgrød med fløde`というスウェーデンのお菓子がみつかった。

![](./img/Keeper31.png)

![](./img/Keeper32.png)

### 3.5 KeePassからの秘密鍵復旧

実際にKeePassでダンプファイルを開けるかを確認する。
WindowsにてKeePassを使用してダンプファイルを開くとマスターキーの入力を求められる。

![](./img/Keeper_win_01.jpg)

ここで、上記のパスワードを入力すると開くことができる。
そしてrootユーザについてみるとPuTTYの秘密鍵が見つかる。

![](./img/Keeper_win_02.jpg)

これをコピーしてKaliに送信する。

![](./img/Keeper_win_03.jpg)

![](./img/Keeper34.png)


### 3.6 PuTTYgenによる秘密鍵の変換

PuTTY形式の秘密鍵ではSSHに使用できないため、`puttygen`により変換した。

![](./img/Keeper35.png)

![](./img/Keeper36.png)

最後にこれを用いてrootとしてSSHログインすると成功する。

![](./img/Keeper37.png)

---
## 4. まとめ
HTB Keeperで用いたテクニックや知識を整理以下のように整理した。
- User
  - Web Exploitation
    - Request Trackerデフォルトパスワードによる認証突破
    - Request Trackerのユーザ管理画面からのパスワード漏洩
- Root
  - Exploit
    - KeePassの脆弱性(CVE-2023-32784)を利用したパスワードのヒント入手
    - 入手したパスワードのヒントからのパスワード推測
    - puttygenによる秘密鍵の変換(PuTTY→OpenSSH)