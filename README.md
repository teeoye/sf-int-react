# Snowflake Analyst (but worse)

React codebase for interactive chat sessions with snowflake cortex agent API

## 🚀 النشر (Deployment)

### خيارات النشر المتاحة:
- ✅ **Vercel** (موصى به - الأسهل): استخدم `vercel --prod`
- ✅ **Docker**: استخدم `docker-compose up -d`
- ✅ **خادم خاص**: ثبت Node.js، ثم `npm install && npm run build && npm start`

## 📋 المتطلبات

- Node.js 20+
- ملف `rsa_key.p8` من Snowflake
- متغيرات بيئية (راجع `.env.example`)

## 🛠️ التطوير المحلي

```bash
# تثبيت المتطلبات
npm install

# إعداد المتغيرات البيئية
cp .env.example .env
# عدّل القيم في .env

# تشغيل خادم التطوير
npm run dev
```

## 📝 TODO

- Switch to general cortex agent run api without agent object, which entails:
    - (Ideally) pull and list agent objects for interactice selection (pill buttons inside chat text entry)
    - insert agent/tool seleciton into request body
- Experiment with Azure AD sso login page
- other style changes

## 📚 المراجع

Based (loosely) on the tutorial available on Snowflake documentation page.
For prerequisites, environment setup, step-by-step guide and instructions, please refer to the [QuickStart Guide](https://quickstarts.snowflake.com/guide/getting_started_with_snowflake_agents_api_and_react/index.html?index=..%2F..index#0).



