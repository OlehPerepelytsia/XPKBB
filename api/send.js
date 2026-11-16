// api/send.js — виконується на сервері Vercel, недоступний для перегляду в браузері
export default async function handler(req, res) {
  // Дозволяємо лише POST-запити
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, phone, message, formHeading, pageTitle } = req.body;

  // Перевірка вхідних даних
  if (!name || !phone) {
    return res.status(400).json({ error: 'Ім’я та телефон обов’язкові' });
  }

  // Беремо секретні дані зі змінних оточення Vercel
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  const cleanPhone = phone.replace(/\D/g, '');
  let text = `🚛 <b>Нова заявка — ХРКВВ</b>\n\n`;
  text += `👤 <b>Ім'я:</b> ${name}\n`;
  text += `📞 <b>Телефон:</b> <a href="tel:+${cleanPhone}">${phone}</a>\n`;
  if (message) text += `💬 <b>Коментар:</b> ${message}\n`;
  text += `\n📌 <b>Форма:</b> ${formHeading || 'Заявка з сайту'}\n`;
  text += `📄 <b>Сторінка:</b> ${pageTitle || ''}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await tgRes.json();
    if (!data.ok) throw new Error(data.description);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}