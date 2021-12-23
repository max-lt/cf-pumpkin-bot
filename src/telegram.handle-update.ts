import { Update, Message } from "node-telegram-bot-api";
import { StorableSet } from "./storable.set";
import { broadcast, sendMessage, editMessageText } from "./telegram";

// https://core.telegram.org/bots/api#getting-updates
// https://core.telegram.org/bots/api#update
// https://core.telegram.org/bots/api#message
// https://core.telegram.org/bots/api#messageentity
export async function handleUpdate(update: Update) {
  if (update.channel_post) {
    return new Response(null, { status: 204 });
  }

  await broadcast(JSON.stringify(update, null, 4));

  if (update.message) {
    const message = update.message as Required<Message>;
    const from = message.from;

    if (from.is_bot) {
      // We do nothing with other bots here
    } else if (/^\/start$/.test(message.text)) {
      const members = await StorableSet.restore('telegram-chat-members');
      const userId = String(from.id);
      if (members.has(userId)) {
        await sendMessage(message.chat.id, `Bonjour ${from.first_name}, content de te revoir !`);
      } else {
        members.add(userId);
        await members.save();
        await sendMessage(message.chat.id, `Bienvenue ${from.first_name}`);
      }
    } else if (/^\/ping$/.test(message.text)) {
      await sendMessage(message.chat.id, 'pong');
    } else if (/^\/version$/.test(message.text)) {
      await sendMessage(message.chat.id, '<version>');
    } else if (/(bonjour|salut|hello|yo)/i.test(message.text)) {
      await sendMessage(message.chat.id, `Bonjour ${from.first_name} 😊`);
    } else if (/(btc|bitcoin)/i.test(message.text)) {
      const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=BTCEUR');
      const json = await res.json<any>();
      const price = parseInt(json.result.XXBTZEUR.a[0]);
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'buy',
                callback_data: 'buy'
              },
              {
                text: 'sell',
                callback_data: 'sell'
              }
            ]
          ]
        }
      };

      await sendMessage(message.chat.id, `Le Bitcoin s'échange actuellement à ${price}€`, options);
    }
  } else if (update.callback_query) {
    const query = update.callback_query;
    const message = query.message as Required<Message>;

    if (query.data == 'buy') {
      await editMessageText(message.text, {
        chat_id: message.chat.id, 
        message_id: message.message_id
      });
      await sendMessage(message.chat.id, `Ok ${query.from.first_name}, j'achète !`);
    } else if (query.data == 'sell') {
      await editMessageText(message.text, {
        chat_id: message.chat.id, 
        message_id: message.message_id
      });
      await sendMessage(message.chat.id, `Ok ${query.from.first_name}, je vends !`);
    }
  }

  return new Response(null, { status: 204 });
}
