---
date: "2024-09-28"
posted: "2024-09-04"
title: "HTB BoardLight Write up"
tags: ["Hack The Box", "Sub-domain Enumeration", "Dolibarr", "CVE-2023-30253", "Remote Code Execution", "Enlightment", "CVE-2022-37706"]
---

# HTB Keeper Write-up

## 1. Network Enumeration

### 1. NmapによるEnumeration

次の`nmap`コマンドの結果は以下。

```
$ sudo nmap -A -p- -T4 -sV -sC -oN nmap_ipaddr.txt 10.10.11.11
```

![](./img/BoradLight02.JPG)

画像の結果から、稼働しているのはSSHとHTTPのみと言うことがわかる。
その他、filteredとなっているポートが複数あるが、これらはひとまず無視する。

---

## 2. Enumeration

### 2.1 Sub-Domain Enumeration
1にてHTTPとSSHが稼働していることがわかっため、まずはWebサイトにアクセスし、Web経由でRCEできないか確認する。
以下が`http://board.htb`にアクセスした画面

![](./img/BoardLight03.JPG)

ただ、Web関係のExploitができるページが見つからなかった。
そのため、ディレクトリとサブドメインのEnumerationを行う。
まずは`gobuster`によりSub-Domain Enumeartionを行った。
```
$ gobuseter vhost -w /usr/share/seclists/Discover/DNS/subdomains-top1million-110000.txt -u http://board.htb -t 50 -o gobuster_subdomains-top1million-110000.txt
```
その結果が以下だが、アクセスできるサブドメインは見当たらなかった。

![](./img/BoardLight05.JPG)

次に`ffuf`にてSub-Domain Enumerationを行った。
```
$ ffuf -w /user/hsare/seclists/Discovery/DNS/subdomains-top1million-110000.txt -H "Host: FUZZ.board.htb" -u http://board.htb -fw 6243
```
この時、Status 400でアクセスできないサイトが引っかかる場合Wordサイズが6243のため`-fw 6243`でフィルタした。
結果は以下。

![](./img/BoardLight07.JPG)

`crm.board.htb`というサブドメインが見つかった。

---
## 3. Web Vulnerability Exploitation

### 3.1 Dolibarr(<=17.0.0)の脆弱性(CVE-2023-30253)

`http://crm.board.htb`にアクセスするとDolibarr 17.0.0のログイン画面が表示される。
既存の製品のため脆弱性がないか検索するとCVE-2023-30253とそのPoCが見つかった。

![](./img/BoardLight08.JPG)

![](./img/BoardLight09.JPG)

これをダウンロードして実行する。IDとPasswordを指定する必要があるが適当に`admin/admin`を指定。待ち受けるポートには`4444`を指定する。

```
$ git clone https://github.com/nikn0laty/Expoit-for-Dolibarr-17.0.0-CVE-2023-30253
```

![](./img/BoardLight11.JPG)

すると待ち受けている4444ポートでリバースシェルが確立される。

![](./img/BoardLight12.JPG)


---
## 4. Privilege Escalation 1 (for 一般ユーザ)

### 4.1 confファイルの探索

先のPoCで`www-data`のシェルを獲得できたが権限が低いため一般ユーザに顕現昇格する。
一番手っ取り早いのはconfファイルでplainなパスワードが保存されており、それを流用するパターンのため、confファイルを探索する。
```
www-data@boardlight:~/html/crm.board.htb/htdocs$ find -name "conf*"
```

これで`conf.php`が見つかる。
`conf.php`の中を見るとデータベースの名称やパスワードが見つかる。

![](./img/BoardLight13.JPG)

このパスワードをそのまま使用して`larissa`のパスワードとして使用するとlarissaとしてログインすることができた。

![](./img/BoardLight15.JPG)


---
## 5. Privilage Escalation 2 (for root)

### 5.1 Linpeas

一般ユーザ権限を獲得したためlinpeasにて脆弱性の列挙を行う。
すると`englightment*`のroot SUIDがセットされたバイナリファイルが見つかる。

### 5.2 Enlightmentの脆弱性(CVE-2022-37706)

EnlightmentのExploitがないかを`searchsploit`で検索したところ、Enlightment v0.25.3の脆弱性があることがわかった。

![](./img/BoardLight17.JPG)

[ExploitDB: Enlightment v0.25.3 - Privilege escalation](https://www.exploit-db.com/exploits/51180)

下の方にPoCも記載されている。

![](./img/BoardLight18.JPG)

これを`enlight_exploit.sh`と言う名称で保存し、ターゲットのPCに送信

![](./img/BoardLight19.JPG)

![](./img/BoardLight20.JPG)

実行することでroot権限を取得することができた。

![](./img/BoardLight21.JPG)

---
## 6. まとめ
HTB Keeperで用いたテクニックや知識を整理以下のように整理した。
- User
  - Sub-domain enumeration
    - ffufによるSub-domain enumeration
  - Web Exploitation
    - Dolibarr(<=17.0.0)の脆弱性(CVE-2023-30253)を利用したRCE
  - Credential leakage
    - Dolibarrのconfファイル`conf.php`のパスワード漏洩
- Root
  - Exploit
    - Enlightment v0.25.3nお脆弱性を利用したPE(CVE-2023-37706)

