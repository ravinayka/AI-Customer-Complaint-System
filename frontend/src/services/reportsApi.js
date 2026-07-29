const BASE_URL = 'http://localhost:8000';

export async function getComplaints() {
  const response = await fetch(`${BASE_URL}/api/complaints`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch complaints.');
  }
  return response.json();
}

export async function createComplaint(complaintData) {
  const response = await fetch(`${BASE_URL}/api/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(complaintData),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to create complaint.');
  }
  return response.json();
}

export async function updateComplaintBackend(id, changes) {
  const response = await fetch(`${BASE_URL}/api/complaints/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(changes),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to update complaint.');
  }
  return response.json();
}

export async function getReportsStatistics(filters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.start_date) queryParams.append('start_date', filters.start_date);
  if (filters.end_date) queryParams.append('end_date', filters.end_date);
  if (filters.product && filters.product !== 'All') queryParams.append('product', filters.product);
  if (filters.severity && filters.severity !== 'All') queryParams.append('severity', filters.severity);
  if (filters.status && filters.status !== 'All') queryParams.append('status', filters.status);

  const url = `${BASE_URL}/api/reports/statistics?${queryParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch reports statistics.');
  }
  return response.json();
}
