export default function (title, body) {
  return new Notification(title, {
    body,
    icon: "icon.png",
  });
}
