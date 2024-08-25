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
  "app_id": "", // идентификатор приложения (может быть любым числом или строкой)
  "platforms": {
    "mobile": true, // true - заменять URL на мобильные устройства, false - не заменять
    "web": true, // true - заменять URL на десктоп, false - не заменять
    "mvk": true, // true - заменять URL на mvk, false - не заменять
  }
}

```

И наконец, сбилдите Ваш проект и запустите деплой:

```
kokateam-deploy
```
