# backend/app/seed_tools.py
from typing import List, Dict
import os

from app.db.database import SessionLocal
from app.models.tool import AITool

# Ако зададеш SEED_EMBEDDED=true, seed_embedded_catalog() ще се изпълни при startup (виж в края).
ENV_SEED_FLAG = os.getenv("SEED_EMBEDDED", "false").lower() == "true"

# ------------------------ Мап: UI категория -> cap:* тагове ------------------------
CATEGORY_TO_CAPS: Dict[str, List[str]] = {
    "Асистенти и продуктивност": ["cap:text-explain", "cap:text-summarize", "cap:doc-read-pdf", "cap:research-web"],
    "Генерация на текст и писане": ["cap:text-explain", "cap:text-edit", "cap:text-summarize"],
    "Изображения и дизайн": ["cap:image-generate", "cap:image-edit"],
    "Видео и 3D": ["cap:video-generate", "cap:video-edit"],
    "Аудио и музика": ["cap:voice-generate", "cap:audio-transcribe"],
    "Бизнес, маркетинг и социални медии": ["cap:research-web", "cap:text-explain", "cap:slide-generate"],
    "Кодиране и разработка": ["cap:text-explain", "cap:research-web", "cap:doc-read-pdf"],
    "Автоматизация и агенти": ["cap:automate-workflow", "cap:integrations"],
    "Данни и анализ": ["cap:research-web", "cap:slide-generate"],
    "Образование и обучение": ["cap:text-explain", "cap:text-summarize", "cap:doc-read-pdf"],
    "Здраве и благополучие": ["cap:text-explain"],
    "Специализирани/нишови": ["cap:text-explain"],
}

# (по желание) уебсайтове за по-популярните имена
LINKS_BY_NAME: Dict[str, str] = {
    "ChatGPT": "https://chat.openai.com/",
    "Claude": "https://anthropic.com/claude",
    "Perplexity": "https://perplexity.ai/",
    "Gemini": "https://gemini.google.com/",
    "DALL-E": "https://openai.com/dall-e-3",
    "Midjourney": "https://www.midjourney.com/",
    "Stable Diffusion": "https://stability.ai/stable-diffusion",
    "Canva": "https://www.canva.com/ai/",
    "Runway": "https://runwayml.com/",
    "Descript": "https://www.descript.com/",
    "Synthesia": "https://www.synthesia.io/",
    "Pika Labs": "https://pika.art/",
    "CapCut": "https://www.capcut.com/",
    "OpusClip": "https://www.opus.pro/",
    "InVideo": "https://invideo.io/",
    "HeyGen": "https://www.heygen.com/",
    "Luma AI": "https://lumalabs.ai/",
    "Remove.bg": "https://www.remove.bg/",
    "Clipdrop": "https://clipdrop.co/",
    "Icons8 AI": "https://icons8.com/",
    "ElevenLabs": "https://elevenlabs.io/",
    "Murf.ai": "https://murf.ai/",
    "Play.ht": "https://play.ht/",
    "AIVA": "https://www.aiva.ai/",
    "Soundraw": "https://soundraw.io/",
    "Uberduck": "https://uberduck.ai/",
    "VoiceMod": "https://www.voicemod.net/",
    "Otter.ai": "https://otter.ai/",
    "Fathom": "https://fathom.video/",
    "Jasper": "https://www.jasper.ai/",
    "Copy.ai": "https://www.copy.ai/",
    "QuillBot": "https://quillbot.com/",
    "Grammarly": "https://www.grammarly.com/",
    "Rytr": "https://rytr.me/",
    "Writesonic": "https://writesonic.com/",
    "Anyword": "https://anyword.com/",
    "Wordtune": "https://www.wordtune.com/",
    "Google NotebookLM": "https://notebooklm.google/",
    "Adobe Firefly": "https://www.adobe.com/sensei/generative-ai/firefly.html",
    "Leonardo AI": "https://leonardo.ai/",
    "Playground AI": "https://playgroundai.com/",
    "Stockimg AI": "https://stockimg.ai/",
    "Fotor AI": "https://www.fotor.com/ai/",
    "Filmora": "https://filmora.wondershare.com/",
    "Pictory": "https://pictory.ai/",
    "Kaiber": "https://kaiber.ai/",
    "Buffer AI": "https://buffer.com/",
    "ClickUp": "https://clickup.com/",
    "DeepL": "https://www.deepl.com/",
    "FeedHive": "https://www.feedhive.com/",
    "Grammarly Business": "https://www.grammarly.com/business",
    "Hootsuite OwlyWriter": "https://www.hootsuite.com/",
    "HubSpot ChatSpot": "https://www.hubspot.com/products/chatspot",
    "Mailchimp AI": "https://mailchimp.com/",
    "Marketo Engage": "https://business.adobe.com/products/marketo/adobe-marketo.html",
    "Salesforce Einstein GPT": "https://www.salesforce.com/",
    "SendPulse AI": "https://sendpulse.com/",
    "SocialBee": "https://socialbee.com/",
    "Trello Assist": "https://trello.com/",
    "Amazon CodeWhisperer": "https://aws.amazon.com/codewhisperer/",
    "Codeium": "https://codeium.com/",
    "Cursor": "https://www.cursor.com/",
    "GitHub Copilot": "https://github.com/features/copilot",
    "GPT Engineer": "https://github.com/AntonOsika/gpt-engineer",
    "Kite": "https://www.kite.com/",
    "Replit Ghostwriter": "https://replit.com/site/ghostwriter",
    "Sourcegraph Cody": "https://about.sourcegraph.com/cody",
    "Tabnine": "https://www.tabnine.com/",
    "CodeGPT": "https://codegpt.co/",
    "Snyk AI": "https://snyk.io/",
    "MutableAI": "https://mutable.ai/",
    "StackSpot": "https://stackspot.com/",
    "AgentGPT": "https://agentgpt.reworkd.ai/",
    "AutoGPT": "https://autogpt.net/",
    "Bardeen": "https://www.bardeen.ai/",
    "Make (Integromat)": "https://www.make.com/",
    "n8n": "https://n8n.io/",
    "On-Page": "https://www.onpage.ai/",
    "Pipedream": "https://pipedream.com/",
    "Selenium IDE AI": "https://www.selenium.dev/selenium-ide/",
    "Taskade": "https://www.taskade.com/",
    "Trebble": "https://www.trebble.fm/",
    "Zapier": "https://zapier.com/",
    "Agento": "https://agento.ai/",
    "AutoML": "https://cloud.google.com/automl",
    "Coefficient": "https://coefficient.io/",
    "DataRobot": "https://www.datarobot.com/",
    "IBM Watsonx": "https://www.ibm.com/watsonx",
    "Julius AI": "https://www.julius.ai/",
    "Looker Studio": "https://lookerstudio.google.com/",
    "Microsoft Fabric": "https://www.microsoft.com/fabric",
    "Pecan AI": "https://www.pecan.ai/",
    "Tableau Pulse": "https://www.tableau.com/",
    "Zoho Analytics": "https://www.zoho.com/analytics/",
    "ThoughtSpot Sage": "https://www.thoughtspot.com/",
    "Seek AI": "https://seek.ai/",
    "Tableau GPT": "https://www.tableau.com/",
    "ChatGPT Education": "https://openai.com/education",
    "Duolingo Max": "https://www.duolingo.com/",
    "Elicit": "https://elicit.com/",
    "Khanmigo": "https://www.khanacademy.org/khan-labs",
    "Mindgrasp": "https://mindgrasp.ai/",
    "PoetAI": "https://poetai.io/",
    "Querlo": "https://www.querlo.com/",
    "Quizlet Q-Chat": "https://quizlet.com/",
    "ScribeSense": "https://www.scribesense.com/",
    "Socratic": "https://socratic.org/",
    "TutorAI": "https://tutorai.me/",
    "Wolfram Alpha": "https://www.wolframalpha.com/",
    "Ada Health": "https://ada.com/",
    "Babylon Health": "https://www.babylonhealth.com/",
    "Dario": "https://www.dariohealth.com/",
    "Flo": "https://flo.health/",
    "FitnessAI": "https://www.fitnessai.com/",
    "K Health": "https://www.khealth.com/",
    "Lumen": "https://www.lumen.me/",
    "MyFitnessPal AI": "https://www.myfitnesspal.com/",
    "Wysa": "https://www.wysa.com/",
    "Youper": "https://www.youper.ai/",
    "Headspace AI": "https://www.headspace.com/",
    "BioAge": "https://www.bioage.com/",
    "AfforAI": "https://afforai.com/",
    "DoNotPay": "https://donotpay.com/",
    "Fireflies": "https://fireflies.ai/",
    "Giftassistant": "https://giftassistant.ai/",
    "HireVue": "https://www.hirevue.com/",
    "Legal Robot": "https://legalrobot.com/",
    "Lexion AI": "https://www.lexion.ai/",
    "Restate.ai": "https://restate.ai/",
    "Revi": "https://www.revi.com/",
    "SidelineAI": "https://sideline.ai/",
    "Synthesys X": "https://www.synthesys.io/",
    "Trala": "https://trala.com/",
    "Upheal": "https://upheal.com/",
    "Verse by Verse": "https://sites.research.google/versebyverse/",
    "Beatoven.ai": "https://www.beatoven.ai/",
    "Riffusion": "https://www.riffusion.com/",
    "Voicemodel.io": "https://www.voicemodel.io/",
    "Krisp.ai": "https://krisp.ai/",
    "Simplified": "https://simplified.com/",
    "Writer.com": "https://writer.com/",
    "Notion AI": "https://www.notion.so/product/ai",
    "Grok": "https://grok.x.ai/",
    "Monty": "https://www.g2.com/products/monty/reviews",
    "Reclaim": "https://reclaim.ai/",
    "Slack AI": "https://slack.com/features/ai",
    "Superhuman": "https://superhuman.com/",
    "Notion AI Writer": "https://www.notion.so/product/ai"
}

# ------------------------ Вграден списък от инструменти ------------------------
EMBEDDED_TOOLS: List[Dict[str, str]] = [
    # Асистенти и продуктивност
    {"Category": "Асистенти и продуктивност", "Tool": "ChatGPT", "Description": "универсален чатбот"},
    {"Category": "Асистенти и продуктивност", "Tool": "Claude", "Description": "дълги контексти"},
    {"Category": "Асистенти и продуктивност", "Tool": "Fathom", "Description": "бележки от срещи"},
    {"Category": "Асистенти и продуктивност", "Tool": "Gemini", "Description": "мултимодален асистент"},
    {"Category": "Асистенти и продуктивност", "Tool": "Grok", "Description": "чат в X"},
    {"Category": "Асистенти и продуктивност", "Tool": "Monty", "Description": "помощник на G2"},
    {"Category": "Асистенти и продуктивност", "Tool": "Notion AI", "Description": "асистент в бележки"},
    {"Category": "Асистенти и продуктивност", "Tool": "Otter.ai", "Description": "транскрипции"},
    {"Category": "Асистенти и продуктивност", "Tool": "Perplexity", "Description": "търсене/анализ"},
    {"Category": "Асистенти и продуктивност", "Tool": "Reclaim", "Description": "календар"},
    {"Category": "Асистенти и продуктивност", "Tool": "Slack AI", "Description": "асистент в Slack"},
    {"Category": "Асистенти и продуктивност", "Tool": "Superhuman", "Description": "AI имейли"},

    # Генерация на текст и писане
    {"Category": "Генерация на текст и писане", "Tool": "Anyword", "Description": "маркетингов текст"},
    {"Category": "Генерация на текст и писане", "Tool": "Copy.ai", "Description": "копирайтинг"},
    {"Category": "Генерация на текст и писане", "Tool": "Jasper", "Description": "маркетинг/блогове"},
    {"Category": "Генерация на текст и писане", "Tool": "Notion AI Writer", "Description": "текст в документи"},
    {"Category": "Генерация на текст и писане", "Tool": "QuillBot", "Description": "преразказ и поправки"},
    {"Category": "Генерация на текст и писане", "Tool": "Rytr", "Description": "бързо писане"},
    {"Category": "Генерация на текст и писане", "Tool": "Simplified", "Description": "съдържание"},
    {"Category": "Генерация на текст и писане", "Tool": "Wordtune", "Description": "пренаписване"},
    {"Category": "Генерация на текст и писане", "Tool": "Writesonic", "Description": "генератор на статии"},
    {"Category": "Генерация на текст и писане", "Tool": "Grammarly", "Description": "граматика и стил"},
    {"Category": "Генерация на текст и писане", "Tool": "Writer.com", "Description": "корпоративен копирайтинг"},
    {"Category": "Генерация на текст и писане", "Tool": "Google NotebookLM", "Description": "AI бележки"},

    # Изображения и дизайн
    {"Category": "Изображения и дизайн", "Tool": "Adobe Firefly", "Description": "генератор на изображения"},
    {"Category": "Изображения и дизайн", "Tool": "Canva", "Description": "дизайн и шаблони"},
    {"Category": "Изображения и дизайн", "Tool": "DALL‑E", "Description": "текст‑към‑изображение"},
    {"Category": "Изображения и дизайн", "Tool": "Leonardo AI", "Description": "творческа генерация"},
    {"Category": "Изображения и дизайн", "Tool": "Midjourney", "Description": "художествени илюстрации"},
    {"Category": "Изображения и дизайн", "Tool": "Playground AI", "Description": "свободна генерация"},
    {"Category": "Изображения и дизайн", "Tool": "Remove.bg", "Description": "премахва фон"},
    {"Category": "Изображения и дизайн", "Tool": "Stable Diffusion", "Description": "отворен генератор"},
    {"Category": "Изображения и дизайн", "Tool": "Stockimg AI", "Description": "постери/продуктови снимки"},
    {"Category": "Изображения и дизайн", "Tool": "Fotor AI", "Description": "редакции"},
    {"Category": "Изображения и дизайн", "Tool": "Clipdrop", "Description": "ретуш/увеличаване"},
    {"Category": "Изображения и дизайн", "Tool": "Icons8 AI", "Description": "AI икони"},

    # Видео и 3D
    {"Category": "Видео и 3D", "Tool": "CapCut", "Description": "AI видео редактор"},
    {"Category": "Видео и 3D", "Tool": "Descript", "Description": "монтаж и аудио"},
    {"Category": "Видео и 3D", "Tool": "Filmora", "Description": "лесно видео"},
    {"Category": "Видео и 3D", "Tool": "HeyGen", "Description": "видео с аватари"},
    {"Category": "Видео и 3D", "Tool": "InVideo", "Description": "видеоклипове"},
    {"Category": "Видео и 3D", "Tool": "Luma AI", "Description": "3D модели"},
    {"Category": "Видео и 3D", "Tool": "OpusClip", "Description": "кратки клипове"},
    {"Category": "Видео и 3D", "Tool": "Runway", "Description": "генерация и редакция"},
    {"Category": "Видео и 3D", "Tool": "Synthesia", "Description": "видео с аватар"},
    {"Category": "Видео и 3D", "Tool": "Pika Labs", "Description": "текст‑към‑видео"},
    {"Category": "Видео и 3D", "Tool": "Pictory", "Description": "видео резюме"},
    {"Category": "Видео и 3D", "Tool": "Kaiber", "Description": "музикални видеа"},

    # Аудио и музика
    {"Category": "Аудио и музика", "Tool": "AIVA", "Description": "композира музика"},
    {"Category": "Аудио и музика", "Tool": "Beatoven.ai", "Description": "лицензирана музика"},
    {"Category": "Аудио и музика", "Tool": "ElevenLabs", "Description": "синтез на говор"},
    {"Category": "Аудио и музика", "Tool": "Murf.ai", "Description": "AI говорител"},
    {"Category": "Аудио и музика", "Tool": "Play.ht", "Description": "текст‑към‑реч"},
    {"Category": "Аудио и музика", "Tool": "Riffusion", "Description": "генерира мелодии"},
    {"Category": "Аудио и музика", "Tool": "Soundraw", "Description": "адаптивна музика"},
    {"Category": "Аудио и музика", "Tool": "Uberduck", "Description": "анимационни гласове"},
    {"Category": "Аудио и музика", "Tool": "VoiceMod", "Description": "промяна на гласа"},
    {"Category": "Аудио и музика", "Tool": "Voicemodel.io", "Description": "персонални гласове"},
    {"Category": "Аудио и музика", "Tool": "Descript", "Description": "подкаст аудио"},
    {"Category": "Аудио и музика", "Tool": "Krisp.ai", "Description": "шумопотискане"},

    # Бизнес, маркетинг и социални медии
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Buffer AI", "Description": "генерира постове"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "ClickUp", "Description": "управление на задачи"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "DeepL", "Description": "превод"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "FeedHive", "Description": "социални медии"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Grammarly Business", "Description": "бизнес текст"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Hootsuite OwlyWriter", "Description": "социални мрежи"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "HubSpot ChatSpot", "Description": "CRM помощник"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Jasper", "Description": "маркетинг копирайтинг"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Mailchimp AI", "Description": "имейл кампании"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Marketo Engage", "Description": "маркетинг автоматизация"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Salesforce Einstein GPT", "Description": "AI за продажби"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "SendPulse AI", "Description": "имейл маркетинг"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "SocialBee", "Description": "социални постове"},
    {"Category": "Бизнес, маркетинг и социални медии", "Tool": "Trello Assist", "Description": "организационен асистент"},

    # Кодиране и разработка
    {"Category": "Кодиране и разработка", "Tool": "Amazon CodeWhisperer", "Description": "допълване на код"},
    {"Category": "Кодиране и разработка", "Tool": "Codeium", "Description": "генериране на код"},
    {"Category": "Кодиране и разработка", "Tool": "Cursor", "Description": "AI IDE"},
    {"Category": "Кодиране и разработка", "Tool": "GitHub Copilot", "Description": "кодови предложения"},
    {"Category": "Кодиране и разработка", "Tool": "GPT Engineer", "Description": "генерира scaffold"},
    {"Category": "Кодиране и разработка", "Tool": "Kite", "Description": "автодовършване"},
    {"Category": "Кодиране и разработка", "Tool": "Replit Ghostwriter", "Description": "AI писане на код"},
    {"Category": "Кодиране и разработка", "Tool": "Sourcegraph Cody", "Description": "помощник в IDE"},
    {"Category": "Кодиране и разработка", "Tool": "Tabnine", "Description": "автокомплит"},
    {"Category": "Кодиране и разработка", "Tool": "CodeGPT", "Description": "генератор"},
    {"Category": "Кодиране и разработка", "Tool": "Snyk AI", "Description": "сигурност"},
    {"Category": "Кодиране и разработка", "Tool": "MutableAI", "Description": "рефакторинг"},
    {"Category": "Кодиране и разработка", "Tool": "StackSpot", "Description": "AI в dev среда"},

    # Автоматизация и агенти
    {"Category": "Автоматизация и агенти", "Tool": "AgentGPT", "Description": "автономни агенти"},
    {"Category": "Автоматизация и агенти", "Tool": "AutoGPT", "Description": "експериментален агент"},
    {"Category": "Автоматизация и агенти", "Tool": "Bardeen", "Description": "автоматизира задачи"},
    {"Category": "Автоматизация и агенти", "Tool": "Make (Integromat)", "Description": "визуални workflows"},
    {"Category": "Автоматизация и агенти", "Tool": "n8n", "Description": "автоматизация"},
    {"Category": "Автоматизация и агенти", "Tool": "On-Page", "Description": "AI агенти за уеб"},
    {"Category": "Автоматизация и агенти", "Tool": "Pipedream", "Description": "event-driven workflows"},
    {"Category": "Автоматизация и агенти", "Tool": "Selenium IDE AI", "Description": "браузър автоматизация"},
    {"Category": "Автоматизация и агенти", "Tool": "Taskade", "Description": "AI агенти"},
    {"Category": "Автоматизация и агенти", "Tool": "Trebble", "Description": "voice workflows"},
    {"Category": "Автоматизация и агенти", "Tool": "Zapier", "Description": "workflow автоматизация"},
    {"Category": "Автоматизация и агенти", "Tool": "Agento", "Description": "маркетингов агент"},

    # Данни и анализ
    {"Category": "Данни и анализ", "Tool": "AutoML", "Description": "модели без код"},
    {"Category": "Данни и анализ", "Tool": "Coefficient", "Description": "CRM данни към таблици"},
    {"Category": "Данни и анализ", "Tool": "DataRobot", "Description": "ML платформа"},
    {"Category": "Данни и анализ", "Tool": "IBM Watsonx", "Description": "анализи"},
    {"Category": "Данни и анализ", "Tool": "Julius AI", "Description": "визуализация на данни"},
    {"Category": "Данни и анализ", "Tool": "Looker Studio", "Description": "business dashboards"},
    {"Category": "Данни и анализ", "Tool": "Microsoft Fabric", "Description": "аналитична платформа"},
    {"Category": "Данни и анализ", "Tool": "Pecan AI", "Description": "прогнози"},
    {"Category": "Данни и анализ", "Tool": "Tableau Pulse", "Description": "AI анализи"},
    {"Category": "Данни и анализ", "Tool": "Zoho Analytics", "Description": "BI"},
    {"Category": "Данни и анализ", "Tool": "ThoughtSpot Sage", "Description": "AI търсене"},
    {"Category": "Данни и анализ", "Tool": "Seek AI", "Description": "SQL генератор"},
    {"Category": "Данни и анализ", "Tool": "Tableau GPT", "Description": "автоматични инсайти"},

    # Образование и обучение
    {"Category": "Образование и обучение", "Tool": "ChatGPT Education", "Description": "учебни материали"},
    {"Category": "Образование и обучение", "Tool": "Duolingo Max", "Description": "учене на езици"},
    {"Category": "Образование и обучение", "Tool": "Elicit", "Description": "изследователски асистент"},
    {"Category": "Образование и обучение", "Tool": "Khanmigo", "Description": "обучителен AI"},
    {"Category": "Образование и обучение", "Tool": "Mindgrasp", "Description": "обобщава текстове"},
    {"Category": "Образование и обучение", "Tool": "Otter.ai", "Description": "резюме на лекции"},
    {"Category": "Образование и обучение", "Tool": "PoetAI", "Description": "генерира въпроси"},
    {"Category": "Образование и обучение", "Tool": "Querlo", "Description": "разговорни тренажори"},
    {"Category": "Образование и обучение", "Tool": "Quizlet Q‑Chat", "Description": "взаимодействие"},
    {"Category": "Образование и обучение", "Tool": "ScribeSense", "Description": "оценяване"},
    {"Category": "Образование и обучение", "Tool": "Socratic", "Description": "помощ с домашни"},
    {"Category": "Образование и обучение", "Tool": "TutorAI", "Description": "персонални уроци"},
    {"Category": "Образование и обучение", "Tool": "Wolfram Alpha", "Description": "математически изчисления"},

    # Здраве и благополучие
    {"Category": "Здраве и благополучие", "Tool": "Ada Health", "Description": "симптом чекър"},
    {"Category": "Здраве и благополучие", "Tool": "Babylon Health", "Description": "телемедицина"},
    {"Category": "Здраве и благополучие", "Tool": "Dario", "Description": "управление на диабет"},
    {"Category": "Здраве и благополучие", "Tool": "Flo", "Description": "женско здраве"},
    {"Category": "Здраве и благополучие", "Tool": "FitnessAI", "Description": "персонални тренировки"},
    {"Category": "Здраве и благополучие", "Tool": "K Health", "Description": "здравни консултации"},
    {"Category": "Здраве и благополучие", "Tool": "Lumen", "Description": "метаболитен анализ"},
    {"Category": "Здраве и благополучие", "Tool": "MyFitnessPal AI", "Description": "хранене"},
    {"Category": "Здраве и благополучие", "Tool": "Wysa", "Description": "ментално здраве"},
    {"Category": "Здраве и благополучие", "Tool": "Youper", "Description": "терапевтичен бот"},
    {"Category": "Здраве и благополучие", "Tool": "Headspace AI", "Description": "медитация"},
    {"Category": "Здраве и благополучие", "Tool": "BioAge", "Description": "здравен анализ"},

    # Специализирани/нишови
    {"Category": "Специализирани/нишови", "Tool": "AfforAI", "Description": "прогнозира цени"},
    {"Category": "Специализирани/нишови", "Tool": "DoNotPay", "Description": "правни документи"},
    {"Category": "Специализирани/нишови", "Tool": "Fireflies", "Description": "разпознаване на срещи"},
    {"Category": "Специализирани/нишови", "Tool": "Giftassistant", "Description": "идеи за подаръци"},
    {"Category": "Специализирани/нишови", "Tool": "HireVue", "Description": "интервюта"},
    {"Category": "Специализирани/нишови", "Tool": "Legal Robot", "Description": "проверка на договори"},
    {"Category": "Специализирани/нишови", "Tool": "Lexion AI", "Description": "управление на договори"},
    {"Category": "Специализирани/нишови", "Tool": "Restate.ai", "Description": "недвижими имоти"},
    {"Category": "Специализирани/нишови", "Tool": "Revi", "Description": "ревюта"},
    {"Category": "Специализирани/нишови", "Tool": "SidelineAI", "Description": "спортни анализи"},
    {"Category": "Специализирани/нишови", "Tool": "Synthesys X", "Description": "мода"},
    {"Category": "Специализирани/нишови", "Tool": "Trala", "Description": "учене на музика"},
    {"Category": "Специализирани/нишови", "Tool": "Upheal", "Description": "психотерапия"},
    {"Category": "Специализирани/нишови", "Tool": "Verse by Verse", "Description": "стихове"},
]

def _caps_for_category(cat: str) -> List[str]:
    return CATEGORY_TO_CAPS.get((cat or "").strip(), ["cap:text-explain"])

def seed_embedded_catalog():
    """
    Обхожда EMBEDDED_TOOLS и прави upsert в AITool (merge на tags и link).
    """
    db = SessionLocal()
    inserted = updated = 0
    try:
        for row in EMBEDDED_TOOLS:
            cat = (row.get("Category") or "").strip()
            name = (row.get("Tool") or "").strip()
            desc = (row.get("Description") or "").strip()
            if not name:
                continue

            caps = _caps_for_category(cat)
            website = LINKS_BY_NAME.get(name)

            tool = db.query(AITool).filter(AITool.name == name).first()
            if tool:
                changed = False
                if desc and (tool.description or "") != desc:
                    tool.description = desc
                    changed = True
                # merge tags
                new_tags = sorted(set((tool.tags or []) + caps))
                if new_tags != (tool.tags or []):
                    tool.tags = new_tags
                    changed = True
                if website:
                    links = (tool.links or {}).copy()
                    if links.get("website") != website:
                        links["website"] = website
                        tool.links = links
                        changed = True
                if changed:
                    db.add(tool)
                    updated += 1
            else:
                db.add(AITool(
                    name=name,
                    description=desc,
                    tags=sorted(set(caps)),
                    links={"website": website} if website else {},
                    rating=None,
                ))
                inserted += 1

        db.commit()
        print(f"[seed_embedded_catalog] inserted={inserted}, updated={updated}")
    except Exception as e:
        db.rollback()
        print(f"[seed_embedded_catalog] ERROR: {e}")
        raise
    finally:
        db.close()

# За обратно съвместимост:
def seed_ai_tools():
    seed_embedded_catalog()

# Позволи автоматично seed-ване при стартиране, ако е включено с env променлива.
if ENV_SEED_FLAG:
    try:
        seed_embedded_catalog()
    except Exception as e:
        print(f"[seed] WARN: auto-seed failed: {e}")