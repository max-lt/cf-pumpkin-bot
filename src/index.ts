import { Message, Update } from 'node-telegram-bot-api';
import { sendMessage, editMessageText, broadcast } from './telegram';

addEventListener('fetch', (event) => {
  event.respondWith(
    handleRequest(event.request).catch(async (err) => {
      await broadcast(err.message);
      return new Response(err.stack, { status: 500 });
    })
  );
});

addEventListener('scheduled', (event) => {
  event.waitUntil(handleSchedule(event.scheduledTime).catch((err) => broadcast(err.message)));
});

class StorableSet<T> extends Set<T> {
  private _key!: string;

  private constructor(key: string, values?: readonly T[] | null) {
    super(values);
    this._key = key;
  }

  static async restore(key: string) {
    const value = await kv.get(key);
    return new this(key, value?.split(','));
  }

  async addAndSync(key: T) {
    const self = super.add.call(this, key);
    await kv.put(this._key, String([...self]));
    return self;
  }
}

// https://core.telegram.org/bots/api#getting-updates
// https://core.telegram.org/bots/api#update
// https://core.telegram.org/bots/api#message
// https://core.telegram.org/bots/api#messageentity
async function handleUpdate(update: Update) {
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
        await members.addAndSync(userId);
        await sendMessage(message.chat.id, `Bienvenue ${from.first_name}`);
      }
    } else if (/^\/ping$/.test(message.text)) {
      await sendMessage(message.chat.id, 'pong');
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

async function handleSchedule(scheduledDate: number) {
  const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=BTCEUR');
  const json = await res.json<any>();
  const price = parseInt(json.result.XXBTZEUR.a[0]);
  const options = { disable_notification: true };

  await broadcast(`Le Bitcoin s'échange actuellement à ${price}€`, options);
}

/**
 * Many more examples available at:
 *   https://developers.cloudflare.com/workers/examples
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);

  console.log('BOT_HOOK_SECRET', BOT_HOOK_SECRET);

  if (request.method == 'POST' && pathname.startsWith('/api/hook')) {
    const secret = pathname.slice(10);

    // https://telegram.devcat.workers.dev/api/hook/b6e*****3f6
    // https://core.telegram.org/bots/api#setwebhook
    // https://core.telegram.org/bots/api#deletewebhook
    if (secret != BOT_HOOK_SECRET) {
      return new Response('Invalid secret', { status: 401 });
    }

    return request.json<Update>().then((update) => handleUpdate(update));
  }

  if (request.method == 'GET' && pathname == '/') {
    return Response.redirect('http://telegram.me/cute_pumpin_bot', 301);
  }

  return new Response(null, { status: 204 });
}
