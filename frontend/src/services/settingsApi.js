const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getSettings() {
  const response = await fetch(`${BASE_URL}/api/settings`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch settings.');
  }
  return response.json();
}

export async function updateSettings(settingsData) {
  const response = await fetch(`${BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settingsData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save settings.');
  }
  return response.json();
}

export async function changePassword(oldPassword, newPassword) {
  const response = await fetch(`${BASE_URL}/api/settings/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to change password.');
  }
  return response.json();
}

export async function logoutAllDevices() {
  const response = await fetch(`${BASE_URL}/api/settings/logout-all`, {
    method: 'POST',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to log out all other devices.');
  }
  return response.json();
}
