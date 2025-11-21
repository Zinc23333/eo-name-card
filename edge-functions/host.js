export default function onRequestGet( {request} ) {
  return new Response(request.headers.get('test.eo.zinc233.top'));
}