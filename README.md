# koka team deploy

Выгружайте статику на [koka team](https://vk.com/kokateam) cdn, размещенном у GCore-Labs (через VK Cloud Solutions).

## Использование

Первым делом установите зависимость локально или глобально.

```
npm i -g kokateam-deploy
```

Затем, создайте конфиг в корне проекта, используя шаблон:

```
# kokateam-deploy-config.json

{
  "static_path": "build",
  "app_id": ""
}
```

И наконец, сбилдите Ваш проект и запустите деплой:

```
kokateam-deploy
```
