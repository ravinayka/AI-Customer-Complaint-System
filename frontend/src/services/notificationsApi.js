const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getNotifications(filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.is_read !== undefined && filters.is_read !== null && filters.is_read !== 'all') {
    queryParams.append('is_read', filters.is_read);
  }
  if (filters.search) {
    queryParams.append('search', filters.search);
  }
  
  const url = `${BASE_URL}/api/notifications?${queryParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch notifications.');
  }
  return response.json();
}

export async function markNotificationAsRead(id) {
  const response = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: 'PUT',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to mark notification as read.');
  }
  return response.json();
}

export async function markAllNotificationsAsRead() {
  const response = await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: 'PUT',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to mark all notifications as read.');
  }
  return response.json();
}

export async function deleteNotification(id) {
  const response = await fetch(`${BASE_URL}/api/notifications/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to delete notification.');
  }
  return response.json();
}
