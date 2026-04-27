/**
 * Notification Store — localStorage-backed, event-driven
 * Use addNotification() anywhere in the app.
 * The NotificationPanel in Navbar listens for updates.
 */

const KEY = 'kyc_notifications'

export function addNotification(message, type = 'info', link = null) {
  const list = getNotifications()
  list.unshift({
    id:        Date.now(),
    message,
    type,       // 'info' | 'success' | 'warning' | 'error'
    link,
    read:      false,
    timestamp: new Date().toISOString(),
  })
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)))
  window.dispatchEvent(new Event('kyc_notifications_updated'))
}

export function getNotifications() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function markAllRead() {
  const list = getNotifications().map(n => ({ ...n, read: true }))
  localStorage.setItem(KEY, JSON.stringify(list))
  window.dispatchEvent(new Event('kyc_notifications_updated'))
}

export function clearNotifications() {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('kyc_notifications_updated'))
}

export function unreadCount() {
  return getNotifications().filter(n => !n.read).length
}
