import moment from 'moment';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request) {
  const date = moment().locale('fr').format('dddd LL');

  return new Response(date, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
