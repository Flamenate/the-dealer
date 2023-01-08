# The Dealer: A Casino Event Bot

![](https://media.discordapp.net/attachments/1055985379125248010/1058379212005851176/el_casino.png)
This bot was made as part of a (virtual) gambling event called: **El Casino: Balance Unlimited** that took place on Anime.TN's community Discord server.
The event's premise is very simple, and the user's experience can be summarized in this diagram:

[![](https://mermaid.ink/img/pako:eNpdkttu2zAMhl-F0M1cIGnvc9Ehpx7XrmiLFpvsC8ZmbS22mOnQLYjz7qPtBWgqQJB-6iNFUdypnAtSE1U63FTwvEgtyPim5xXlayixIfgdKZLPYDw-b8960cJU37CxgD3xxQ9MNjhPO3K2u-cAS8uxrOChxi05_3Wf2gGZ9cHuuYX5EOiFTU4wrzBkx8wP8i0skuXfTc2O4HuoyME0D-bdBEMeXitTE7yiKFueHHwXMD69DpLXlqODEJ09HZ_D_MOxyGWiZxSAu2e8mbIK2ckR0J7VjLaFy0Q_45qE6vQnCK4SfYW2BI4B-or8GXIReLXafqYvEn2JzUpSFvbhfdnXz3dUx1wM165qzNe_ZLZwrWcHkR0xvubg2xv9JCvcYV4ZS8eE41hTCPJZt_oxem_QwuN_W19kNVINuQZNIf-_63xTJeVtKFUT2Rbo1qlK7V44jIGftjZXk-AijVTcFBhoYVDaplGTN6y9WKkwgd3d0FB9X43UBu1P5gOz_wcAjcgp?type=png)]()

## Gambler Commands

| Command                                 | Description                                                                     | Example Usage                          |
| --------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------- |
| `/profile`                              | View your (or someone else's) profile data.                                     | `/profile` or `/profile @Someone#1234` |
| `/queue`                                | View all game queues. Provides a menu that allows you to join a specific queue. | `/queue`                               |
| `/leave`                                | Leave the queue you're currently in.                                            | `/leave`                               |
| `/games`                                | View all game descriptions.                                                     | `/games`                               |
| `/loan`                                 | Take a loan from the Yakuza.                                                    | `/loan 2000`                           |
| `/blackjack`<br>`/slots`<br>`/roulette` | Play the respective PvE game against the bot with a bet of your choosing.       | `/roulette 750`                        |

Every PvP game gives a **$500** bonus to the player for playing it each time, regardless of whether they win or lose.

There was a total of 17 PvP games (13 1v1, 4 group games), split between two phases each taking 2.5 hours, most of them programmed within the bot itself (See [Hosting](#Hosting-The-Event) for details).

## Hosting The Event

Each phase of the event required 9 game hosts (1 for each PvP game), and their duties can be summarized in this diagram:

[![](https://mermaid.ink/img/pako:eNpNkctOhDAUQH_lphsxAT-AhWZ4zLDRmGhiFFhc4QrNQIulVQnw75bHGLtqes599Y6skCUxn1UKuxqeo0yAPYc0rKk4wyCNggpbuurh05ChHDzvFoIxFtJUNTw2OJDq7-YtLFjo9CAnCJ30BbkGhHeu8-sNh-Dd2OjDf_mV-gmiNFBcVKBraoGLfBOitVbsxD9dg1ws9NKLMg31e9Z41Y5Ogl-0ZcBKEYEUS3XSu3ZctZOTyF7_pdrZaWWJE1HRoCL45kLYsXaarNR2nQnmspZUi7y0XzYuOGNLScqYb68lqnPGMjFbD42WT4MomK-VIZeZrkRNEbfNYcv8D2x6-0ol11LdbztYV-GyDsWblBdn_gW0XIDT?type=png)]()

### Host Commands

| Command    | Description                                                                                                | Example Usage                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `/next`    | Removes voice & text perms from current players, and adds perms to the new players from queue.             | `/next`                                                        |
| `/declare` | Declares game winners & losers and deducts/rewards the bet accordingly (includes an option for tied games) | `/declare winners: @Winner#0123 losers: @Loser#0000 bet: 1500` |

11 out of the 17 PvP games are programmed into the bot for the hosts to use. You can check the game list in the [game database example file](game_db.json).

## Betting

As demonstrated in the user experience flowchart, there's also a betting system in place (separate to gambling), where the players can gamble on CPU v CPU fights in Naruto Ultimate Ninja Storm 4 streamed by a staff member, whose job is described by this very simple diagram:

[![](https://mermaid.ink/img/pako:eNo1ULtuwzAM_BWCQyenH-ChQJ5TsiRDgUodWIuJhNiUIdMoiiD_XjpOOBF3x8Mdb9jkwFjjpVAfYX_0AjZLt445Dwy7dInKZYA3OFD_DYvFB6zcSakorFhnYO0-KSkQtEm1ZfhJT2Lj9rm5gkbDXuLt8_rhPEM7t5UwKeA3ssB5YoAlDEa_G7_04gUr7Lh0lIKlvU0xPZpxxx5rWwOVq0cvd9PRqPn0Jw3WWkaucOwDKW8SWckO6zO1g6EckuZymOs_vlBhT_KV80tz_wdr7Fw1?type=png)]()

### Commands

| Command    | Description                              | Usage Example                 |
| ---------- | ---------------------------------------- | ----------------------------- |
| `/bet`     | Start a bet.                             | `/bet Character1, Character2` |
| `/lockbet` | Lock a bet.                              | `/lockbet <bet_message_id>`   |
| `/endbet`  | End a bet and choose the winning option. | `/endbet`                     |
