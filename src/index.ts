import { Update } from 'node-telegram-bot-api';
import { broadcast } from './telegram';
import { handleUpdate } from './telegram.handle-update';

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

async function handleSchedule(scheduledDate: number) {
  const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=BTCEUR');
  const json = await res.json<any>();
  const price = parseInt(json.result.XXBTZEUR.a[0]);
  const options = { disable_notification: true };

  await broadcast(`Le Bitcoin s'échange actuellement à ${price}€`, options);
}

async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

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
