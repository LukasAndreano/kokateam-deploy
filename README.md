# koka team deploy

Модуль выгрузки статики на [koka team](https://vk.com/kokateam) хостинг. Имеет два режима деплоя: **static** и **cdn**.

При использовании **static** выгрузка происходит на [apps.koka.team](https://apps.koka.team) - сервер команды, а при **cdn** - на сеть G-Core Labs (VK Cloud Solutions). Чаще всего применяется режим **static**.

## Использование

Первым делом установите зависимость локально или глобально.

```
npm i -g kokateam-deploy
```

Затем, создайте конфиг в корне проекта, используя шаблон:

```
# kokateam-deploy-config.json
# use_random_prefix - использовать рандомный префикс для выгрузки (моментальный обход кэша)
# purge_access_token - удалить токен после выгрузки (по умолчанию false)
# disable_dev_mode - отключить режим разработки после деплоя
# web - выгружать для web
# mvk - выгружать для mvk
# mobile - выгружать для mobile

{
  "static_path": "build",
  "app_id": "",
  "purge_access_token": false,
  "disable_dev_mode": false,
  "web": true,
  "mvk": false,
  "mobile": false
}
```

И наконец, сбилдите Ваш проект и запустите деплой:

```
kokateam-deploy
```
