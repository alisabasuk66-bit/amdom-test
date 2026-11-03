<?php
/* АМ ДОМ — приём заявок с сайта.
   Заявка уходит на почту и в Telegram. Работает на хостинге с PHP (Beget, Timeweb и т.п.).
   Чтобы включить: заполните настройки ниже и в js/data.js поставьте forms: { demo: false, ... } */

$EMAIL_TO  = 'amdom@inbox.ru';
$EMAIL_FROM = 'site@xn--80aixbj.xn--p1ai';   // адрес отправителя на домене сайта (амдом.рф)
$TG_TOKEN  = '';   // токен Telegram-бота от @BotFather
$TG_CHATS  = [];   // ID чатов, куда слать заявки, например ['123456789']

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) { http_response_code(400); echo '{"ok":false}'; exit; }
$f = function ($k, $max = 500) use ($in) { return mb_substr(trim(strip_tags($in[$k] ?? '')), 0, $max); };
$name = $f('name', 100); $phone = $f('phone', 30);
if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) < 11) { http_response_code(422); echo '{"ok":false}'; exit; }

$text = "Новая заявка с сайта АМ ДОМ\n\n"
  . "Имя: $name\nТелефон: $phone\n"
  . "Как связаться: " . $f('contact', 30) . "\n"
  . "Откуда: " . $f('topic', 1000) . "\n"
  . ($f('comment') !== '' ? "Комментарий: " . $f('comment', 2000) . "\n" : '')
  . "\n" . date('d.m.Y H:i');

$ok = false;
if ($TG_TOKEN && $TG_CHATS) {
  foreach ($TG_CHATS as $chat) {
    $ch = curl_init("https://api.telegram.org/bot$TG_TOKEN/sendMessage");
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10,
      CURLOPT_POSTFIELDS => ['chat_id' => $chat, 'text' => $text]]);
    if (curl_exec($ch) !== false) $ok = true;
    curl_close($ch);
  }
}
$headers = "From: АМ ДОМ <$EMAIL_FROM>\r\nContent-Type: text/plain; charset=utf-8";
if (mail($EMAIL_TO, '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $name) . '?=', $text, $headers)) $ok = true;

echo json_encode(['ok' => $ok]);
