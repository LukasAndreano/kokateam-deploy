# koka team deploy

Модуль выгрузки статики на [koka team](https://vk.com/kokateam) хостинг.

## Использование

Первым делом установите зависимость локально или глобально.

```
npm i -g kokateam-deploy
```

Затем, создайте конфиг в корне проекта, используя шаблон:

```
# kokateam-deploy-config.json
# app_id - идентификатор приложения
# static_path - путь к статике

{
  "static_path": "build",
  "app_id": ""
}
```

И наконец, сбилдите Ваш проект и запустите деплой:

```
kokateam-deploy
```
