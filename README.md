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

{
  "static_path": "dist", // путь к билду
  "app_id": "", // идентификатор приложения (к нему должен быть доступ)
  "platforms": {
    "mobile": true, // true - заменять URL на мобильные устройства, false - не заменять
    "web": true, // true - заменять URL на десктоп, false - не заменять
    "mvk": true, // true - заменять URL на mvk, false - не заменять
  },
  "upload_odr": true, // true - автоматически загружать ODR, false - не загружать
  "send_odr_to_moderation": false, // true - отправить ODR в модерацию, false - не отправить (приоритетнее использовать через CLI)
  "disable_dev_mode": false // true - отключить режим разработки, false - не отключить (приоритетнее использовать через CLI)
}

```

И наконец, сбилдите Ваш проект и запустите деплой:

```
kokateam-deploy
```
