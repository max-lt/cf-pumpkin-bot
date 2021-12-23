function request(op: string, body: object) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/` + op, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
    .then((res) => (res.ok ? null : res.json()))
    .then((err: any) => {
      if (err) {
        console.error('err', err);
        throw new Error(err.description);
      }
    });
}

// sendMessage

import { ChatId, SendMessageOptions } from 'node-telegram-bot-api';

export function sendMessage(chat_id: ChatId, text: string, options: SendMessageOptions = { }) {
  return request('sendMessage', Object.assign(options, Object.assign(options, { chat_id, text })));
}

// editMessageText

import { EditMessageTextOptions } from 'node-telegram-bot-api';

export function editMessageText(text: string, options: EditMessageTextOptions = { }) {
  return request('editMessageText', Object.assign(options, { text }));
}

// Send to Trade signals (dev)
export function broadcast(text: string, options: SendMessageOptions = { }) {
  return sendMessage(BOT_CHANNEL_ID, text, options);
}
